from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.models import User, Module, UserProgress, Badge, Run, Score
from app.schemas.user import UserStats, UserProgressResponse, BadgeResponse

router = APIRouter()


@router.get("/user/progress", response_model=UserProgressResponse)
def get_user_progress(db: Session = Depends(get_db)):
    """Get full user progress including module statuses and recent activity."""
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        return UserProgressResponse(
            user=UserStats(
                username="student", xp=0, level=1, streak_days=0,
                modules_completed=0, total_runs=0, average_score=0.0,
                best_module_score=0.0, total_badges=0,
            ),
            modules=[],
            recent_activity=[],
        )

    # Get all modules ordered by number
    modules = db.query(Module).order_by(Module.number).all()

    # Get all progress entries for this user, keyed by module_id
    progress_entries = db.query(UserProgress).filter(UserProgress.user_id == 1).all()
    progress_map = {p.module_id: p for p in progress_entries}

    # Calculate stats
    total_runs = db.query(func.count(Run.id)).filter(Run.user_id == 1).scalar() or 0

    # Average score from scored runs
    avg_score = (
        db.query(func.avg(Score.composite))
        .join(Run, Run.id == Score.run_id)
        .filter(Run.user_id == 1)
        .scalar()
    ) or 0.0

    # Best module score
    best_module_score = (
        db.query(func.max(UserProgress.best_score))
        .filter(UserProgress.user_id == 1)
        .scalar()
    ) or 0.0

    modules_completed = sum(1 for p in progress_entries if p.completed)
    total_badges = db.query(func.count(Badge.id)).filter(Badge.user_id == 1).scalar() or 0

    user_stats = UserStats(
        username=user.username,
        xp=user.xp or 0,
        level=user.level or 1,
        streak_days=user.streak_days or 0,
        modules_completed=modules_completed,
        total_runs=total_runs,
        average_score=round(float(avg_score), 4),
        best_module_score=round(float(best_module_score), 4),
        total_badges=total_badges,
    )

    # Build module status list
    module_list = []
    # Track which modules are completed to determine unlock status
    completed_numbers = set()
    for p in progress_entries:
        if p.completed:
            mod = next((m for m in modules if m.id == p.module_id), None)
            if mod:
                completed_numbers.add(mod.number)

    for mod in modules:
        prog = progress_map.get(mod.id)
        # Determine status
        if prog and prog.completed:
            status = "completed"
        elif mod.number == 1:
            # Module 1 is always unlocked
            status = "available"
        elif (mod.unlock_after and mod.unlock_after in completed_numbers) or \
             (mod.number - 1 in completed_numbers):
            status = "available"
        elif prog and prog.unlocked:
            status = "available"
        else:
            status = "locked"

        module_list.append({
            "module_id": mod.id,
            "module_number": mod.number,
            "title": mod.title,
            "status": status,
            "best_score": round(prog.best_score, 4) if prog else 0.0,
            "attempts": prog.attempts if prog else 0,
            "pass_threshold": mod.pass_threshold or 0.7,
            "completed_at": prog.completed_at.isoformat() if prog and prog.completed_at else None,
        })

    # Recent activity — last 10 runs with module info
    recent_runs = (
        db.query(Run)
        .filter(Run.user_id == 1)
        .order_by(Run.created_at.desc())
        .limit(10)
        .all()
    )

    recent_activity = []
    for r in recent_runs:
        module_title = None
        if r.simulation and r.simulation.module:
            module_title = r.simulation.module.title
        score_val = r.score.composite if r.score else None
        recent_activity.append({
            "run_id": r.id,
            "module_title": module_title,
            "model": r.model,
            "score": round(score_val, 4) if score_val is not None else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return UserProgressResponse(
        user=user_stats,
        modules=module_list,
        recent_activity=recent_activity,
    )


@router.get("/user/badges", response_model=list[BadgeResponse])
def get_user_badges(db: Session = Depends(get_db)):
    """Get all badges for the current user, sorted by most recent."""
    badges = (
        db.query(Badge)
        .filter(Badge.user_id == 1)
        .order_by(Badge.earned_at.desc())
        .all()
    )
    return badges


@router.get("/user/stats", response_model=UserStats)
def get_user_stats(db: Session = Depends(get_db)):
    """Get summary stats for the current user."""
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        return UserStats(
            username="student", xp=0, level=1, streak_days=0,
            modules_completed=0, total_runs=0, average_score=0.0,
            best_module_score=0.0, total_badges=0,
        )

    total_runs = db.query(func.count(Run.id)).filter(Run.user_id == 1).scalar() or 0
    avg_score = (
        db.query(func.avg(Score.composite))
        .join(Run, Run.id == Score.run_id)
        .filter(Run.user_id == 1)
        .scalar()
    ) or 0.0
    best_module_score = (
        db.query(func.max(UserProgress.best_score))
        .filter(UserProgress.user_id == 1)
        .scalar()
    ) or 0.0
    modules_completed = (
        db.query(func.count(UserProgress.id))
        .filter(UserProgress.user_id == 1, UserProgress.completed == True)
        .scalar()
    ) or 0
    total_badges = db.query(func.count(Badge.id)).filter(Badge.user_id == 1).scalar() or 0

    return UserStats(
        username=user.username,
        xp=user.xp or 0,
        level=user.level or 1,
        streak_days=user.streak_days or 0,
        modules_completed=modules_completed,
        total_runs=total_runs,
        average_score=round(float(avg_score), 4),
        best_module_score=round(float(best_module_score), 4),
        total_badges=total_badges,
    )
