from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models.duel import CapstoneProject

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────
class CapstoneSubmitRequest(BaseModel):
    title: str
    description: str
    system_prompt: str
    eval_suite: Optional[list] = None
    security_review: Optional[dict] = None
    documentation: Optional[str] = None


class PeerReviewRequest(BaseModel):
    score: float
    feedback: str


class CapstoneOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    eval_suite: Optional[list] = None
    security_review: Optional[dict] = None
    documentation: Optional[str] = None
    score: Optional[float] = None
    peer_reviews: Optional[list] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Endpoints ──────────────────────────────────────────────────
@router.post("/capstone/submit", response_model=CapstoneOut)
async def submit_capstone(req: CapstoneSubmitRequest, db: Session = Depends(get_db)):
    """Submit a capstone project."""
    project = CapstoneProject(
        user_id=1,
        title=req.title,
        description=req.description,
        system_prompt=req.system_prompt,
        eval_suite=req.eval_suite or [],
        security_review=req.security_review or {},
        documentation=req.documentation or "",
        status="submitted",
        peer_reviews=[],
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/capstone/gallery", response_model=list[CapstoneOut])
async def capstone_gallery(
    status: Optional[str] = None,
    sort: Optional[str] = "date",
    db: Session = Depends(get_db),
):
    """List all submitted/reviewed capstone projects."""
    query = db.query(CapstoneProject)

    if status and status != "all":
        query = query.filter(CapstoneProject.status == status)
    else:
        query = query.filter(CapstoneProject.status.in_(["submitted", "reviewed"]))

    if sort == "score":
        query = query.order_by(CapstoneProject.score.desc().nullslast())
    else:
        query = query.order_by(CapstoneProject.created_at.desc())

    return query.all()


@router.get("/capstone/{project_id}", response_model=CapstoneOut)
async def get_capstone(project_id: int, db: Session = Depends(get_db)):
    """Get a capstone project by ID."""
    project = db.query(CapstoneProject).filter(CapstoneProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/capstone/{project_id}/review", response_model=CapstoneOut)
async def review_capstone(
    project_id: int, req: PeerReviewRequest, db: Session = Depends(get_db)
):
    """Submit a peer review for a capstone project."""
    project = db.query(CapstoneProject).filter(CapstoneProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if req.score < 0 or req.score > 1:
        raise HTTPException(status_code=400, detail="Score must be between 0 and 1")

    reviews = project.peer_reviews or []
    reviews.append({
        "score": req.score,
        "feedback": req.feedback,
        "created_at": datetime.utcnow().isoformat(),
    })
    project.peer_reviews = reviews

    # Update aggregate score from all peer reviews
    avg_score = sum(r["score"] for r in reviews) / len(reviews)
    project.score = round(avg_score, 4)
    project.status = "reviewed"
    project.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(project)
    return project
