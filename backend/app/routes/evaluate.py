from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.models import Run, Score
from ..services.evaluation import evaluation_engine
from ..schemas.evaluation import (
    EvalRequest,
    EvalBatchRequest,
    EvalResult,
    EvalBatchResult,
)

router = APIRouter()


@router.post("/evaluate", response_model=EvalResult)
async def evaluate_single(req: EvalRequest, db: Session = Depends(get_db)):
    """Score a single LLM output against a test case."""
    try:
        result = await evaluation_engine.evaluate(
            output=req.output,
            test_case=req.test_case.model_dump(),
            scoring_config=req.scoring.model_dump(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {e}")

    # Save score to DB if we can link it to a run via simulation_id
    if req.simulation_id:
        # Find the latest run for this simulation to link the score
        run = (
            db.query(Run)
            .filter(Run.simulation_id == req.simulation_id, Run.user_id == 1)
            .order_by(Run.created_at.desc())
            .first()
        )
        if run and not run.score:
            score_record = Score(
                run_id=run.id,
                accuracy=result["scores"].get("accuracy", 0.0),
                format_compliance=result["scores"].get("format_compliance", 0.0),
                consistency=result["scores"].get("consistency", 0.0),
                efficiency=result["scores"].get("efficiency", 0.0),
                robustness=result["scores"].get("robustness", 0.0),
                composite=result["composite"],
                passed=result["passed"],
                details=result.get("details"),
            )
            db.add(score_record)
            db.commit()

    return EvalResult(**result)


@router.post("/evaluate/batch", response_model=EvalBatchResult)
async def evaluate_batch(req: EvalBatchRequest, db: Session = Depends(get_db)):
    """Score multiple outputs against multiple test cases."""
    if len(req.outputs) != len(req.test_cases):
        raise HTTPException(
            status_code=400,
            detail="Number of outputs must match number of test cases",
        )

    try:
        result = await evaluation_engine.evaluate_batch(
            outputs=req.outputs,
            test_cases=[tc.model_dump() for tc in req.test_cases],
            scoring_config=req.scoring.model_dump(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch evaluation failed: {e}")

    individual = [EvalResult(**r) for r in result["individual_results"]]

    return EvalBatchResult(
        individual_results=individual,
        aggregate_scores=result["aggregate_scores"],
        composite=result["composite"],
        passed=result["passed"],
        pass_rate=result["pass_rate"],
    )
