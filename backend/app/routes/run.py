import time
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from ..database import get_db
from ..models.models import Run
from ..services.openrouter import openrouter_client, AVAILABLE_MODELS
from ..services.token_counter import count_tokens, count_message_tokens, estimate_cost
from ..schemas.llm import (
    RunRequest,
    RunResponse,
    CompareRequest,
    CompareResponse,
    ModelInfo,
    TokenCountRequest,
    TokenCountResponse,
)

router = APIRouter()


@router.post("/run", response_model=RunResponse)
async def execute_run(req: RunRequest, db: Session = Depends(get_db)):
    """Execute a prompt against a model and save the run."""
    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    # Extract system prompt and user prompt for DB storage
    system_prompt = ""
    prompt_text = ""
    for m in req.messages:
        if m.role == "system":
            system_prompt = m.content
        elif m.role == "user":
            prompt_text = m.content

    if req.stream:
        return await _stream_run(req, messages, system_prompt, prompt_text, db)

    start = time.time()
    try:
        result = await openrouter_client.chat_completion(
            model=req.model,
            messages=messages,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
            top_p=req.top_p,
            frequency_penalty=req.frequency_penalty,
            presence_penalty=req.presence_penalty,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Model API error: {e}")

    elapsed_ms = int((time.time() - start) * 1000)
    content = result["content"]
    usage = result.get("usage", {})

    tokens_input = usage.get("prompt_tokens", count_message_tokens(messages))
    tokens_output = usage.get("completion_tokens", count_tokens(content))
    tokens_total = tokens_input + tokens_output
    cost_info = estimate_cost(req.model, tokens_input, tokens_output)

    # Persist run
    run = Run(
        user_id=1,
        simulation_id=req.simulation_id,
        model=req.model,
        system_prompt=system_prompt,
        prompt_text=prompt_text,
        output_text=content,
        tokens_input=tokens_input,
        tokens_output=tokens_output,
        tokens_total=tokens_total,
        cost=cost_info["total_cost"],
        temperature=req.temperature,
        top_p=req.top_p,
        max_tokens=req.max_tokens,
        frequency_penalty=req.frequency_penalty,
        presence_penalty=req.presence_penalty,
        response_time_ms=elapsed_ms,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    return RunResponse(
        id=run.id,
        content=content,
        model=result.get("model", req.model),
        tokens_input=tokens_input,
        tokens_output=tokens_output,
        tokens_total=tokens_total,
        cost=cost_info["total_cost"],
        response_time_ms=elapsed_ms,
        finish_reason=result.get("finish_reason", "stop"),
    )


async def _stream_run(
    req: RunRequest,
    messages: list[dict],
    system_prompt: str,
    prompt_text: str,
    db: Session,
):
    """Return an SSE stream of chunks, then persist the full run."""
    collected_chunks: list[str] = []
    start = time.time()

    async def event_generator():
        try:
            async for chunk in openrouter_client.chat_completion_stream(
                model=req.model,
                messages=messages,
                temperature=req.temperature,
                max_tokens=req.max_tokens,
                top_p=req.top_p,
                frequency_penalty=req.frequency_penalty,
                presence_penalty=req.presence_penalty,
            ):
                collected_chunks.append(chunk)
                yield {"event": "chunk", "data": json.dumps({"content": chunk})}
        except Exception as e:
            yield {"event": "error", "data": json.dumps({"error": str(e)})}
            return

        # Stream complete — compute final stats and persist
        full_content = "".join(collected_chunks)
        elapsed_ms = int((time.time() - start) * 1000)
        tokens_input = count_message_tokens(messages)
        tokens_output = count_tokens(full_content)
        tokens_total = tokens_input + tokens_output
        cost_info = estimate_cost(req.model, tokens_input, tokens_output)

        run = Run(
            user_id=1,
            simulation_id=req.simulation_id,
            model=req.model,
            system_prompt=system_prompt,
            prompt_text=prompt_text,
            output_text=full_content,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            tokens_total=tokens_total,
            cost=cost_info["total_cost"],
            temperature=req.temperature,
            top_p=req.top_p,
            max_tokens=req.max_tokens,
            frequency_penalty=req.frequency_penalty,
            presence_penalty=req.presence_penalty,
            response_time_ms=elapsed_ms,
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        # Final summary event
        yield {
            "event": "done",
            "data": json.dumps({
                "id": run.id,
                "tokens_input": tokens_input,
                "tokens_output": tokens_output,
                "tokens_total": tokens_total,
                "cost": cost_info["total_cost"],
                "response_time_ms": elapsed_ms,
            }),
        }

    return EventSourceResponse(event_generator())


@router.post("/compare", response_model=CompareResponse)
async def compare_models(req: CompareRequest, db: Session = Depends(get_db)):
    """Run the same prompt against multiple models."""
    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    system_prompt = ""
    prompt_text = ""
    for m in req.messages:
        if m.role == "system":
            system_prompt = m.content
        elif m.role == "user":
            prompt_text = m.content

    start = time.time()
    try:
        results = await openrouter_client.compare_models(
            models=req.models,
            messages=messages,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
            top_p=req.top_p,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Comparison failed: {e}")

    responses: list[RunResponse] = []
    for r in results:
        elapsed_ms = int((time.time() - start) * 1000)
        if r.get("error"):
            responses.append(RunResponse(
                content=f"Error: {r['error']}",
                model=r["model"],
            ))
            continue

        content = r["content"]
        usage = r.get("usage", {})
        tokens_in = usage.get("prompt_tokens", count_message_tokens(messages))
        tokens_out = usage.get("completion_tokens", count_tokens(content))
        tokens_total = tokens_in + tokens_out
        cost_info = estimate_cost(r["model"], tokens_in, tokens_out)

        run = Run(
            user_id=1,
            model=r["model"],
            system_prompt=system_prompt,
            prompt_text=prompt_text,
            output_text=content,
            tokens_input=tokens_in,
            tokens_output=tokens_out,
            tokens_total=tokens_total,
            cost=cost_info["total_cost"],
            temperature=req.temperature,
            top_p=req.top_p,
            max_tokens=req.max_tokens,
            response_time_ms=elapsed_ms,
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        responses.append(RunResponse(
            id=run.id,
            content=content,
            model=r.get("model", r["model"]),
            tokens_input=tokens_in,
            tokens_output=tokens_out,
            tokens_total=tokens_total,
            cost=cost_info["total_cost"],
            response_time_ms=elapsed_ms,
            finish_reason=r.get("finish_reason", "stop"),
        ))

    return CompareResponse(results=responses)


@router.get("/models", response_model=list[ModelInfo])
async def list_models():
    """List all available models."""
    return [
        ModelInfo(id=model_id, **info)
        for model_id, info in AVAILABLE_MODELS.items()
    ]


@router.post("/tokens/count", response_model=TokenCountResponse)
async def count_tokens_endpoint(req: TokenCountRequest):
    """Count tokens and estimate cost."""
    if req.messages:
        messages = [{"role": m.role, "content": m.content} for m in req.messages]
        token_count = count_message_tokens(messages)
    elif req.text:
        token_count = count_tokens(req.text)
    else:
        raise HTTPException(status_code=400, detail="Provide text or messages")

    cost = estimate_cost(req.model, token_count, 0)
    return TokenCountResponse(token_count=token_count, estimated_cost=cost)
