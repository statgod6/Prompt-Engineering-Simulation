from pydantic import BaseModel
from typing import Optional


class ModuleResponse(BaseModel):
    id: int
    number: int
    title: str
    part: int
    part_title: Optional[str] = None
    description: Optional[str] = None
    pass_threshold: float = 0.7
    unlock_after: Optional[int] = None
    # User-specific fields (populated when user context available)
    status: str = "locked"  # locked, available, completed
    best_score: float = 0.0
    attempts: int = 0

    class Config:
        from_attributes = True


class SimulationResponse(BaseModel):
    id: int
    sim_id: str
    title: str
    type: str
    instructions: Optional[str] = None
    config_json: Optional[dict] = None
    default_model: str = "openai/gpt-4o"
    allowed_models: Optional[list] = None
    concept_content: Optional[str] = None  # Markdown content from concept.md

    class Config:
        from_attributes = True


class ModuleDetailResponse(BaseModel):
    module: ModuleResponse
    simulation: Optional[SimulationResponse] = None
    concept_content: Optional[str] = None
