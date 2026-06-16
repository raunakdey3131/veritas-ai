"""Veritas AI — Contradiction Detection Service"""

from typing import Optional
from fastapi import FastAPI
from loguru import logger
from pydantic import BaseModel, Field

app = FastAPI(title="Veritas AI — Contradiction Detection", version="1.0.0")

class ClaimItem(BaseModel):
    id: str
    text: str
    verdict: str = "UNVERIFIABLE"
    support_score: float = 0.0
    contradiction_score: float = 0.0

class DetectionRequest(BaseModel):
    claims: list[ClaimItem]

class ContradictionDetail(BaseModel):
    type: str
    text: str
    severity: str
    between: list[str]
    confidence: float
    explanation: str

class DetectionResponse(BaseModel):
    contradictions: list[ContradictionDetail]
    total: int

# Known contradictory fact pairs for demo
KNOWN_CONTRADICTIONS = {
    ("the earth has one moon", "the earth has two moons"): "Earth has exactly one natural satellite (the Moon).",
    ("python was created in 1991", "python was created in 2010"): "Python was first released in 1991 by Guido van Rossum.",
    ("google was founded in 1998", "google was founded in 2000"): "Google was founded on September 4, 1998.",
    ("light speed is 300000 km/s", "light speed is 200000 km/s"): "The speed of light in vacuum is exactly 299,792,458 m/s (~300,000 km/s).",
}

@app.post("/detect", response_model=DetectionResponse)
async def detect_contradictions(request: DetectionRequest):
    contradictions = []
    claims_text = [(c.id, c.text.lower()) for c in request.claims]

    for i in range(len(claims_text)):
        for j in range(i + 1, len(claims_text)):
            id1, text1 = claims_text[i]
            id2, text2 = claims_text[j]

            for (a, b), explanation in KNOWN_CONTRADICTIONS.items():
                if (a in text1 and b in text2) or (a in text2 and b in text1):
                    contradictions.append(ContradictionDetail(
                        type="INTERNAL_CONTRADICTION",
                        text=f"'{text1[:80]}' contradicts '{text2[:80]}'",
                        severity="high",
                        between=[id1, id2],
                        confidence=0.98,
                        explanation=explanation,
                    ))

    return DetectionResponse(contradictions=contradictions, total=len(contradictions))

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "contradiction-detection"}
