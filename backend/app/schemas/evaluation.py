from pydantic import BaseModel, Field
from typing import Optional


class TestCase(BaseModel):
    input: str
    expected_output: Optional[str] = None
    context: Optional[str] = None  # Additional context (e.g., documents for RAG)
    metadata: Optional[dict] = None


class ScoringConfig(BaseModel):
    methods: list[str] = Field(default=["llm_judge"])
    pass_threshold: Optional[float] = 0.7
    dimensions: list[str] = Field(default=["accuracy"])
    weights: Optional[dict] = None  # Custom dimension weights
    rubric: Optional[str] = None  # Custom rubric for LLM judge
    json_schema: Optional[dict] = None  # Schema for json_schema validation


class EvalRequest(BaseModel):
    output: str
    test_case: TestCase
    scoring: ScoringConfig
    simulation_id: Optional[int] = None


class EvalBatchRequest(BaseModel):
    outputs: list[str]
    test_cases: list[TestCase]
    scoring: ScoringConfig
    simulation_id: Optional[int] = None


class DimensionScore(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    reasoning: Optional[str] = None


class EvalResult(BaseModel):
    scores: dict[str, float]  # dimension -> score
    composite: float
    passed: bool
    details: Optional[dict] = None  # Per-test-case breakdown
    reasoning: Optional[dict[str, str]] = None


class EvalBatchResult(BaseModel):
    individual_results: list[EvalResult]
    aggregate_scores: dict[str, float]
    composite: float
    passed: bool
    pass_rate: float  # % of test cases passed
