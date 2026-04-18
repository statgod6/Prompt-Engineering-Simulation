from pydantic import BaseModel, Field
from typing import Optional


class Message(BaseModel):
    role: str = Field(..., description="Role: system, user, or assistant")
    content: str = Field(..., description="Message content")


class RunRequest(BaseModel):
    model: str = Field(default="openai/gpt-4o")
    messages: list[Message]
    temperature: float = Field(default=1.0, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1024, ge=1, le=4096)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)
    frequency_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)
    presence_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)
    stream: bool = Field(default=False)
    simulation_id: Optional[int] = None


class RunResponse(BaseModel):
    id: Optional[int] = None
    content: str
    model: str
    tokens_input: int = 0
    tokens_output: int = 0
    tokens_total: int = 0
    cost: float = 0.0
    response_time_ms: int = 0
    finish_reason: str = "stop"


class CompareRequest(BaseModel):
    models: list[str] = Field(..., min_length=2, max_length=5)
    messages: list[Message]
    temperature: float = Field(default=1.0, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1024, ge=1, le=4096)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)


class CompareResponse(BaseModel):
    results: list[RunResponse]


class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    input_cost: float
    output_cost: float


class TokenCountRequest(BaseModel):
    text: Optional[str] = None
    messages: Optional[list[Message]] = None
    model: str = "openai/gpt-4o"


class TokenCountResponse(BaseModel):
    token_count: int
    estimated_cost: dict
