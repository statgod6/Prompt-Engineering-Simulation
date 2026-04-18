from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.models import LeaderboardEntry, User, Module, UserProgress
from app.schemas.user import LeaderboardResponse, LeaderboardEntryResponse

router = APIRouter()


@router.get("/leaderboard/overall", response_model=LeaderboardResponse)
def get_overall_leaderboard(db: Session = Depends(get_db)):
    """Aggregate scores across all modules per user, ranked by average best_score."""
    # Aggregate: average best_score across completed modules per user
    results = (
        db.query(
            LeaderboardEntry.user_id,
            func.avg(LeaderboardEntry.best_score).label("avg_score"),
            func.sum(LeaderboardEntry.attempts).label("total_attempts"),
            func.min(LeaderboardEntry.best_time_ms).label("best_time"),
        )
        .group_by(LeaderboardEntry.user_id)
        .order_by(func.avg(LeaderboardEntry.best_score).desc())
        .all()
    )

    entries = []
    for rank, row in enumerate(results, 1):
        user = db.query(User).filter(User.id == row.user_id).first()
        username = user.username if user else f"user_{row.user_id}"
        entries.append(LeaderboardEntryResponse(
            rank=rank,
            username=username,
            user_id=row.user_id,
            best_score=round(float(row.avg_score or 0), 4),
            attempts=int(row.total_attempts or 0),
            best_time_ms=int(row.best_time) if row.best_time else None,
        ))

    return LeaderboardResponse(
        module_id=None,
        module_title=None,
        entries=entries,
        total_participants=len(entries),
    )


@router.get("/leaderboard/{module_id}", response_model=LeaderboardResponse)
def get_module_leaderboard(module_id: int, db: Session = Depends(get_db)):
    """Get leaderboard for a specific module."""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    lb_entries = (
        db.query(LeaderboardEntry)
        .filter(LeaderboardEntry.module_id == module_id)
        .order_by(LeaderboardEntry.best_score.desc(), LeaderboardEntry.best_time_ms.asc())
        .all()
    )

    entries = []
    for rank, entry in enumerate(lb_entries, 1):
        user = db.query(User).filter(User.id == entry.user_id).first()
        username = user.username if user else f"user_{entry.user_id}"
        entries.append(LeaderboardEntryResponse(
            rank=rank,
            username=username,
            user_id=entry.user_id,
            best_score=round(entry.best_score, 4),
            attempts=entry.attempts,
            best_time_ms=entry.best_time_ms,
        ))

    return LeaderboardResponse(
        module_id=module_id,
        module_title=module.title,
        entries=entries,
        total_participants=len(entries),
    )
