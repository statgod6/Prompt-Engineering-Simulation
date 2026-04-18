from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak_days = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    runs = relationship("Run", back_populates="user")
    progress = relationship("UserProgress", back_populates="user")
    badges = relationship("Badge", back_populates="user")
    leaderboard_entries = relationship("LeaderboardEntry", back_populates="user")


class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, nullable=False)  # 1-20
    title = Column(String(200), nullable=False)
    part = Column(Integer, nullable=False)  # 1-4
    part_title = Column(String(100))  # "Foundations", "Intermediate", etc.
    description = Column(Text)
    pass_threshold = Column(Float, default=0.7)
    unlock_after = Column(Integer, nullable=True)  # module number required before this one
    order_index = Column(Integer, default=0)

    simulation = relationship("Simulation", back_populates="module", uselist=False)
    progress_entries = relationship("UserProgress", back_populates="module")


class Simulation(Base):
    __tablename__ = "simulations"
    id = Column(Integer, primary_key=True, index=True)
    sim_id = Column(String(20), unique=True)  # "sim-01", "sim-02", etc.
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    title = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False)  # free_lab, fix_the_prompt, build_to_spec, adversarial, pipeline, duel, blind_diagnosis, token_budget, speed_run
    instructions = Column(Text)
    config_json = Column(JSON)  # Full simulation config including test_cases, scoring, constraints
    default_model = Column(String(100), default="openai/gpt-4o")
    allowed_models = Column(JSON)  # List of model identifiers

    module = relationship("Module", back_populates="simulation")
    runs = relationship("Run", back_populates="simulation")


class Run(Base):
    __tablename__ = "runs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    simulation_id = Column(Integer, ForeignKey("simulations.id"), nullable=True)
    model = Column(String(100), nullable=False)
    system_prompt = Column(Text, default="")
    prompt_text = Column(Text, nullable=False)
    output_text = Column(Text)
    tokens_input = Column(Integer, default=0)
    tokens_output = Column(Integer, default=0)
    tokens_total = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    temperature = Column(Float, default=1.0)
    top_p = Column(Float, default=1.0)
    max_tokens = Column(Integer, default=1024)
    frequency_penalty = Column(Float, default=0.0)
    presence_penalty = Column(Float, default=0.0)
    response_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="runs")
    simulation = relationship("Simulation", back_populates="runs")
    score = relationship("Score", back_populates="run", uselist=False)


class Score(Base):
    __tablename__ = "scores"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id"), nullable=False)
    accuracy = Column(Float, default=0.0)
    format_compliance = Column(Float, default=0.0)
    consistency = Column(Float, default=0.0)
    efficiency = Column(Float, default=0.0)
    robustness = Column(Float, default=0.0)
    composite = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    details = Column(JSON)  # Detailed scoring breakdown per test case
    created_at = Column(DateTime, default=datetime.utcnow)

    run = relationship("Run", back_populates="score")


class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    best_score = Column(Float, default=0.0)
    attempts = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    unlocked = Column(Boolean, default=False)
    first_attempt_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="progress")
    module = relationship("Module", back_populates="progress_entries")


class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_type = Column(String(50), nullable=False)  # perfect_score, speed_run, creative, helper, streak_7, streak_30, first_blood, completionist
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=True)
    description = Column(String(200))
    earned_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="badges")


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    best_score = Column(Float, default=0.0)
    attempts = Column(Integer, default=0)
    best_time_ms = Column(Integer, nullable=True)
    rank = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="leaderboard_entries")
