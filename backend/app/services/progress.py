from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import User, UserProgress, Badge, LeaderboardEntry, Module, Score, Run
from datetime import datetime

XP_PER_COMPLETION = 100
XP_PER_PERFECT = 50  # Bonus for score >= 0.95
XP_PER_RUN = 10
LEVEL_XP = 500  # XP per level

BADGE_TYPES = {
    "perfect_score": "Achieved a perfect score (>=95%)",
    "speed_run": "Completed a simulation in under 60 seconds",
    "first_blood": "First attempt at a new module",
    "streak_7": "7-day activity streak",
    "streak_30": "30-day activity streak",
    "completionist": "Completed all 20 modules",
    "explorer": "Tried all 5 models on a single simulation",
}


def calculate_xp_for_run(score: float, is_first_completion: bool) -> int:
    xp = XP_PER_RUN
    if is_first_completion:
        xp += XP_PER_COMPLETION
    if score >= 0.95:
        xp += XP_PER_PERFECT
    return xp


def update_progress_after_run(db: Session, user_id: int, module_id: int, score: float, run_id: int):
    """Update user progress, XP, badges, and leaderboard after a scored run."""
    # Get the run for timing info
    run = db.query(Run).filter(Run.id == run_id).first()

    # Get the module for pass_threshold
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        return
    pass_threshold = module.pass_threshold or 0.7

    # Get or create UserProgress
    progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id, UserProgress.module_id == module_id)
        .first()
    )

    is_first_completion = False

    if not progress:
        progress = UserProgress(
            user_id=user_id,
            module_id=module_id,
            best_score=0.0,
            attempts=0,
            completed=False,
            unlocked=True,
            first_attempt_at=datetime.utcnow(),
        )
        db.add(progress)
        db.flush()

    # Update attempts
    progress.attempts += 1

    # Update best_score if new score is higher
    if score > progress.best_score:
        progress.best_score = score

    # Mark completed if score >= pass_threshold and not already completed
    if score >= pass_threshold and not progress.completed:
        progress.completed = True
        progress.completed_at = datetime.utcnow()
        is_first_completion = True

        # Unlock the next module
        next_module = (
            db.query(Module)
            .filter(Module.number == module.number + 1)
            .first()
        )
        if next_module:
            next_progress = (
                db.query(UserProgress)
                .filter(UserProgress.user_id == user_id, UserProgress.module_id == next_module.id)
                .first()
            )
            if not next_progress:
                next_progress = UserProgress(
                    user_id=user_id,
                    module_id=next_module.id,
                    best_score=0.0,
                    attempts=0,
                    completed=False,
                    unlocked=True,
                )
                db.add(next_progress)
            else:
                next_progress.unlocked = True

    # Award XP
    xp_earned = calculate_xp_for_run(score, is_first_completion)
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.xp = (user.xp or 0) + xp_earned
        user.level = max(1, (user.xp // LEVEL_XP) + 1)
        user.last_active = datetime.utcnow()

    # Check for badge awards
    check_and_award_badges(db, user_id, module_id, score, run)

    # Update leaderboard entry
    time_ms = run.response_time_ms if run else None
    update_leaderboard(db, user_id, module_id, score, time_ms)

    db.commit()


def check_and_award_badges(db: Session, user_id: int, module_id: int, score: float, run: Run):
    """Check conditions and award badges."""

    def _has_badge(badge_type: str, mod_id: int = None) -> bool:
        q = db.query(Badge).filter(Badge.user_id == user_id, Badge.badge_type == badge_type)
        if mod_id is not None:
            q = q.filter(Badge.module_id == mod_id)
        return q.first() is not None

    def _award(badge_type: str, mod_id: int = None):
        badge = Badge(
            user_id=user_id,
            badge_type=badge_type,
            module_id=mod_id,
            description=BADGE_TYPES.get(badge_type, ""),
            earned_at=datetime.utcnow(),
        )
        db.add(badge)

    # Perfect score badge
    if score >= 0.95 and not _has_badge("perfect_score", module_id):
        _award("perfect_score", module_id)

    # Speed run badge (response_time < 60000ms)
    if run and run.response_time_ms and run.response_time_ms < 60000:
        if not _has_badge("speed_run", module_id):
            _award("speed_run", module_id)

    # First blood badge — first attempt at this module
    progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id, UserProgress.module_id == module_id)
        .first()
    )
    if progress and progress.attempts == 1 and not _has_badge("first_blood", module_id):
        _award("first_blood", module_id)

    # Completionist badge — all 20 modules completed
    completed_count = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id, UserProgress.completed == True)
        .count()
    )
    if completed_count >= 20 and not _has_badge("completionist"):
        _award("completionist")

    # Explorer badge — tried all 5 models on this module's simulation
    simulation = db.query(Module).filter(Module.id == module_id).first()
    if simulation and simulation.simulation:
        sim_id = simulation.simulation.id
        distinct_models = (
            db.query(func.count(func.distinct(Run.model)))
            .filter(Run.user_id == user_id, Run.simulation_id == sim_id)
            .scalar()
        )
        if distinct_models and distinct_models >= 5 and not _has_badge("explorer", module_id):
            _award("explorer", module_id)

    # Streak badges are handled by streak tracking logic (not per-run)
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        if user.streak_days >= 7 and not _has_badge("streak_7"):
            _award("streak_7")
        if user.streak_days >= 30 and not _has_badge("streak_30"):
            _award("streak_30")


def update_leaderboard(db: Session, user_id: int, module_id: int, score: float, time_ms: int = None):
    """Update or create leaderboard entry."""
    entry = (
        db.query(LeaderboardEntry)
        .filter(LeaderboardEntry.user_id == user_id, LeaderboardEntry.module_id == module_id)
        .first()
    )

    if not entry:
        entry = LeaderboardEntry(
            user_id=user_id,
            module_id=module_id,
            best_score=score,
            attempts=1,
            best_time_ms=time_ms,
            updated_at=datetime.utcnow(),
        )
        db.add(entry)
    else:
        entry.attempts += 1
        if score > entry.best_score:
            entry.best_score = score
            if time_ms is not None:
                entry.best_time_ms = time_ms
        elif score == entry.best_score and time_ms is not None:
            # Same score — keep the faster time
            if entry.best_time_ms is None or time_ms < entry.best_time_ms:
                entry.best_time_ms = time_ms
        entry.updated_at = datetime.utcnow()

    db.flush()

    # Recalculate ranks for this module
    entries = (
        db.query(LeaderboardEntry)
        .filter(LeaderboardEntry.module_id == module_id)
        .order_by(LeaderboardEntry.best_score.desc(), LeaderboardEntry.best_time_ms.asc())
        .all()
    )
    for i, e in enumerate(entries, 1):
        e.rank = i
