from typing import Literal, List, Optional
from pydantic import BaseModel

ClaimType = Literal["factual", "temporal", "entity", "opinion"]
ClaimStatus = Literal["pending", "searching", "verified", "error"]
CredibilityLevel = Literal["high", "medium", "low"]
Verdict = Literal["True", "False", "Partially True", "Conflicting", "Unverifiable", "Temporally Uncertain"]

class EvidenceObject(BaseModel):
    claim_id: str
    url: str
    title: str
    snippet: str
    credibility: CredibilityLevel
    published_date: Optional[str] = None

class ClaimObject(BaseModel):
    id: str
    text: str
    type: ClaimType
    anchor: str          # exact original sentence
    char_start: int      # character offset in original text
    char_end: int
    status: ClaimStatus

class VerificationResult(BaseModel):
    claim_id: str
    verdict: Verdict
    confidence: float    # 0.0 to 1.0
    reasoning: str       # MUST name specific source titles
    sources: List[EvidenceObject]
    conflicting: bool

class AIScoreResult(BaseModel):
    probability: float   # 0 to 100
    label: Literal["Likely AI-generated", "Likely human-written"]
    model: str

class DeepfakeResult(BaseModel):
    image_url: str
    score: float         # 0.0 to 1.0
    label: Literal["REAL", "FAKE"]
    type: Literal["ai_generated", "face_swapped"]
