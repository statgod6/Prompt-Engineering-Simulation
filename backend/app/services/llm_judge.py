import json
import logging
from ..services.openrouter import openrouter_client

logger = logging.getLogger(__name__)

JUDGE_SYSTEM_PROMPT = """You are an expert evaluator for a prompt engineering course.
Score the following output on the requested dimensions, each on a scale of 0.0 to 1.0.

Dimensions to evaluate:
{dimensions}

Scoring rubric:
{rubric}

IMPORTANT: Output your evaluation as valid JSON with NO extra text before or after:
{{
    "scores": {{"dimension_name": score, ...}},
    "reasoning": {{"dimension_name": "brief explanation", ...}}
}}

Be strict but fair. A score of 1.0 means perfect, 0.0 means completely wrong."""

JUDGE_USER_PROMPT = """Evaluate this output:

--- INPUT / PROMPT ---
{input_text}

--- EXPECTED OUTPUT ---
{expected_output}

--- ACTUAL OUTPUT ---
{actual_output}

--- ADDITIONAL CONTEXT ---
{context}

Provide your JSON evaluation now."""

IMPROVEMENT_SYSTEM_PROMPT = """You are an expert evaluator for a prompt engineering course.
Compare the original and improved prompt/output pairs and score the IMPROVEMENT on each dimension (0.0 to 1.0).
- 0.0 = the improved version is worse
- 0.5 = no meaningful change
- 1.0 = significant improvement

Output your evaluation as valid JSON with NO extra text:
{{
    "scores": {{"dimension_name": score, ...}},
    "reasoning": {{"dimension_name": "brief explanation", ...}}
}}"""

IMPROVEMENT_USER_PROMPT = """Evaluate the improvement:

--- ORIGINAL PROMPT ---
{original_prompt}

--- ORIGINAL OUTPUT ---
{original_output}

--- IMPROVED PROMPT ---
{improved_prompt}

--- IMPROVED OUTPUT ---
{improved_output}

--- DIMENSIONS ---
{dimensions}

Provide your JSON evaluation now."""

# Use a cheaper/faster model for judging
JUDGE_MODEL = "openai/gpt-4o"


def _parse_judge_response(content: str) -> dict:
    """Parse the JSON response from the judge LLM, handling markdown fences."""
    text = content.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        first_newline = text.index("\n")
        text = text[first_newline + 1:]
        if text.endswith("```"):
            text = text[:-3].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Failed to parse judge response as JSON: %s", text[:200])
        return {"scores": {}, "reasoning": {"error": "Failed to parse judge response"}}


class LLMJudge:
    """Use an LLM to judge output quality on multiple dimensions."""

    async def judge(
        self,
        output: str,
        test_case: dict,
        dimensions: list[str],
        rubric: str | None = None,
    ) -> dict:
        """
        Use LLM to judge the output quality.

        Returns:
            {"scores": {"dim": float, ...}, "reasoning": {"dim": "...", ...}}
        """
        dim_text = "\n".join(f"- {d}" for d in dimensions)
        rubric_text = rubric or "Rate each dimension based on quality, correctness, and completeness."

        system_msg = JUDGE_SYSTEM_PROMPT.format(dimensions=dim_text, rubric=rubric_text)
        user_msg = JUDGE_USER_PROMPT.format(
            input_text=test_case.get("input", "N/A"),
            expected_output=test_case.get("expected_output", "N/A"),
            actual_output=output,
            context=test_case.get("context", "None"),
        )

        try:
            response = await openrouter_client.chat_completion(
                model=JUDGE_MODEL,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.1,
                max_tokens=1024,
            )
            parsed = _parse_judge_response(response["content"])

            # Ensure all requested dimensions are present with defaults
            scores = parsed.get("scores", {})
            reasoning = parsed.get("reasoning", {})
            for dim in dimensions:
                if dim not in scores:
                    scores[dim] = 0.0
                else:
                    scores[dim] = max(0.0, min(1.0, float(scores[dim])))
                if dim not in reasoning:
                    reasoning[dim] = "No reasoning provided"

            return {"scores": scores, "reasoning": reasoning}

        except Exception as e:
            logger.error("LLM judge call failed: %s", e)
            return {
                "scores": {d: 0.0 for d in dimensions},
                "reasoning": {d: f"Judge error: {e}" for d in dimensions},
            }

    async def judge_improvement(
        self,
        original_prompt: str,
        original_output: str,
        improved_prompt: str,
        improved_output: str,
        dimensions: list[str],
    ) -> dict:
        """Judge the improvement delta between original and improved prompts."""
        dim_text = "\n".join(f"- {d}" for d in dimensions)
        user_msg = IMPROVEMENT_USER_PROMPT.format(
            original_prompt=original_prompt,
            original_output=original_output,
            improved_prompt=improved_prompt,
            improved_output=improved_output,
            dimensions=dim_text,
        )

        try:
            response = await openrouter_client.chat_completion(
                model=JUDGE_MODEL,
                messages=[
                    {"role": "system", "content": IMPROVEMENT_SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.1,
                max_tokens=1024,
            )
            parsed = _parse_judge_response(response["content"])

            scores = parsed.get("scores", {})
            reasoning = parsed.get("reasoning", {})
            for dim in dimensions:
                if dim not in scores:
                    scores[dim] = 0.5  # default: no change
                else:
                    scores[dim] = max(0.0, min(1.0, float(scores[dim])))
                if dim not in reasoning:
                    reasoning[dim] = "No reasoning provided"

            return {"scores": scores, "reasoning": reasoning}

        except Exception as e:
            logger.error("LLM judge improvement call failed: %s", e)
            return {
                "scores": {d: 0.5 for d in dimensions},
                "reasoning": {d: f"Judge error: {e}" for d in dimensions},
            }


# Singleton instance
llm_judge = LLMJudge()
