from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Duel(Base):
    __tablename__ = "duels"
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    opponent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    status = Column(String(20), default="waiting")  # waiting, active, completed
    current_round = Column(Integer, default=1)
    max_rounds = Column(Integer, default=5)
    creator_score = Column(Float, default=0.0)
    opponent_score = Column(Float, default=0.0)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    rounds = relationship("DuelRound", back_populates="duel")


class DuelRound(Base):
    __tablename__ = "duel_rounds"
    id = Column(Integer, primary_key=True, index=True)
    duel_id = Column(Integer, ForeignKey("duels.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    attacker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    defender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    attack_prompt = Column(Text)  # Injection attempt
    defender_system_prompt = Column(Text)  # Defense system prompt
    attack_output = Column(Text)  # What the model said
    attack_succeeded = Column(Boolean, default=False)
    score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    duel = relationship("Duel", back_populates="rounds")


class CapstoneProject(Base):
    __tablename__ = "capstone_projects"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    system_prompt = Column(Text)
    eval_suite = Column(JSON)  # Test cases
    security_review = Column(JSON)  # Attack test results
    documentation = Column(Text)
    score = Column(Float, nullable=True)
    peer_reviews = Column(JSON, default=list)
    status = Column(String(20), default="draft")  # draft, submitted, reviewed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
