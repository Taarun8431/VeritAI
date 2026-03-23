from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

class ClaimObject(BaseModel):
    id: str
    text: str
    type: Literal["factual", "temporal", "entity", "opinion"]
    anchor: str
    char_start: int
    char_end: int
    status: str = "searching"

class EvidenceObject(BaseModel):
    claim_id: str
    url: str
    title: str
    snippet: str
    credibility: Literal["high", "medium", "low"]
    published_date: Optional[str] = None

class VerificationResult(BaseModel):
    claim_id: str
    verdict: Literal[
        "True",
        "False",
        "Partially True",
        "Conflicting",
        "Unverifiable",
        "Temporally Uncertain"
    ]
    confidence: float
    reasoning: str
    sources: List[EvidenceObject]
    conflicting: bool
    needs_reflection: bool = False

class AIScoreResult(BaseModel):
    probability: float = Field(..., ge=0.0, le=100.0)
    label: Literal["Likely AI-generated", "Likely human-written"]
    model: str

class DeepfakeResult(BaseModel):
    image_url: str
    score: float
    label: Literal["REAL", "FAKE"]
    type: Literal["ai_generated", "face_swapped"]

class PipelineEvent(BaseModel):
    event: str
    data: Dict[str, Any]
