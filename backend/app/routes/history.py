from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from ..database import get_db
from ..models.models import Run, Score

router = APIRouter()


class ScoreOut(BaseModel):
    accuracy: float = 0.0
    format_compliance: float = 0.0
    consistency: float = 0.0
    efficiency: float = 0.0
    robustness: float = 0.0
    composite: float = 0.0
    passed: bool = False

    class Config:
        from_attributes = True


class RunOut(BaseModel):
    id: int
    model: str
    system_prompt: str = ""
    prompt_text: str
    output_text: Optional[str] = None
    tokens_input: int = 0
    tokens_output: int = 0
    tokens_total: int = 0
    cost: float = 0.0
    temperature: float = 1.0
    top_p: float = 1.0
    max_tokens: int = 1024
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    response_time_ms: int = 0
    created_at: Optional[str] = None
    simulation_id: Optional[int] = None
    score: Optional[ScoreOut] = None

    class Config:
        from_attributes = True


class PaginatedRuns(BaseModel):
    items: list[RunOut]
    total: int
    limit: int
    offset: int


@router.get("/history", response_model=PaginatedRuns)
async def get_history(
    module_id: Optional[int] = Query(None),
    model: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    sort: str = Query("created_at desc"),
    db: Session = Depends(get_db),
):
    """Get run history with optional filters."""
    query = db.query(Run).options(joinedload(Run.score)).filter(Run.user_id == 1)

    if module_id is not None:
        from ..models.models import Simulation
        sim_ids = [
            s.id for s in db.query(Simulation).filter(Simulation.module_id == module_id).all()
        ]
        if sim_ids:
            query = query.filter(Run.simulation_id.in_(sim_ids))
        else:
            query = query.filter(Run.simulation_id == -1)  # no results

    if model:
        query = query.filter(Run.model == model)

    total = query.count()

    # Parse sort parameter
    sort_parts = sort.strip().split()
    sort_col = sort_parts[0] if sort_parts else "created_at"
    sort_dir = sort_parts[1].lower() if len(sort_parts) > 1 else "desc"

    col = getattr(Run, sort_col, Run.created_at)
    if sort_dir == "asc":
        query = query.order_by(col.asc())
    else:
        query = query.order_by(col.desc())

    runs = query.offset(offset).limit(limit).all()

    items = []
    for run in runs:
        run_dict = {
            "id": run.id,
            "model": run.model,
            "system_prompt": run.system_prompt or "",
            "prompt_text": run.prompt_text,
            "output_text": run.output_text,
            "tokens_input": run.tokens_input,
            "tokens_output": run.tokens_output,
            "tokens_total": run.tokens_total,
            "cost": run.cost,
            "temperature": run.temperature,
            "top_p": run.top_p,
            "max_tokens": run.max_tokens,
            "frequency_penalty": run.frequency_penalty,
            "presence_penalty": run.presence_penalty,
            "response_time_ms": run.response_time_ms,
            "created_at": run.created_at.isoformat() if run.created_at else None,
            "simulation_id": run.simulation_id,
            "score": run.score if run.score else None,
        }
        items.append(RunOut(**run_dict))

    return PaginatedRuns(items=items, total=total, limit=limit, offset=offset)


@router.get("/history/{run_id}", response_model=RunOut)
async def get_run_detail(run_id: int, db: Session = Depends(get_db)):
    """Get a single run with full details."""
    run = (
        db.query(Run)
        .options(joinedload(Run.score))
        .filter(Run.id == run_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    return RunOut(
        id=run.id,
        model=run.model,
        system_prompt=run.system_prompt or "",
        prompt_text=run.prompt_text,
        output_text=run.output_text,
        tokens_input=run.tokens_input,
        tokens_output=run.tokens_output,
        tokens_total=run.tokens_total,
        cost=run.cost,
        temperature=run.temperature,
        top_p=run.top_p,
        max_tokens=run.max_tokens,
        frequency_penalty=run.frequency_penalty,
        presence_penalty=run.presence_penalty,
        response_time_ms=run.response_time_ms,
        created_at=run.created_at.isoformat() if run.created_at else None,
        simulation_id=run.simulation_id,
        score=run.score if run.score else None,
    )
