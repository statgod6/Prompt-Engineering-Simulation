import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import models  # noqa: F401 — register all models with Base
from app.models import duel as duel_models  # noqa: F401 — register duel models
from app.models.models import User
from app.services.seed import seed_modules


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all database tables on startup
    Base.metadata.create_all(bind=engine)

    # Ensure default student user exists
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            db.add(User(id=1, username="student", email="student@promptlab.dev"))
            db.commit()

        # Seed modules from content files
        seed_modules(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title="PromptLab",
    description="Interactive prompt engineering learning platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware — allow all origins for cross-domain access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for content serving
content_dir = settings.CONTENT_DIR
if os.path.isdir(content_dir):
    app.mount("/content", StaticFiles(directory=content_dir), name="content")


# ── Health check ────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "promptlab-api"}


# ── Route includes ────────────────────────────────────────────
from app.routes import run, evaluate, modules, history
app.include_router(run.router, prefix="/api", tags=["run"])
app.include_router(evaluate.router, prefix="/api", tags=["evaluate"])
app.include_router(modules.router, prefix="/api", tags=["modules"])
app.include_router(history.router, prefix="/api", tags=["history"])

from app.routes import user, leaderboard
app.include_router(user.router, prefix="/api", tags=["user"])
app.include_router(leaderboard.router, prefix="/api", tags=["leaderboard"])

from app.routes import duel, capstone
app.include_router(duel.router, prefix="/api", tags=["duel"])
app.include_router(capstone.router, prefix="/api", tags=["capstone"])
