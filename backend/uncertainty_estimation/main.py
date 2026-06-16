"""Veritas AI — Uncertainty Estimation Service"""

import math
from typing import Optional
from fastapi import FastAPI
from loguru import logger
from pydantic import BaseModel, Field

app = FastAPI(title="Veritas AI — Uncertainty Estimation", version="1.0.0")

class ClaimItem(BaseModel):
    id: str
    text: str
    confidence: float = 1.0

class UncertaintyRequest(BaseModel):
    query: str
    response: str
    claims: list[ClaimItem] = Field(default_factory=list)

class UncertaintyResponse(BaseModel):
    score: float
    token_entropy: float
    semantic_entropy: float
    consistency_score: float
    confidence_level: str

HEDGE_WORDS = {"might", "could", "possibly", "perhaps", "maybe", "seems", "appears", "likely", "probably", "unlikely", "rarely", "suggests", "indicates", "may", "can"}

@app.post("/estimate", response_model=UncertaintyResponse)
async def estimate_uncertainty(request: UncertaintyRequest):
    words = request.response.split()
    n = len(words)
    if n == 0:
        return UncertaintyResponse(score=1.0, token_entropy=0.0, semantic_entropy=0.0, consistency_score=0.0, confidence_level="LOW")

    hedge_count = sum(1 for w in words if w.lower() in HEDGE_WORDS)
    hedge_ratio = hedge_count / n

    # Token entropy approximation from word frequency diversity
    word_freq = {}
    for w in words:
        wl = w.lower()
        word_freq[wl] = word_freq.get(wl, 0) + 1
    probs = [freq / n for freq in word_freq.values()]
    token_entropy = -sum(p * math.log2(p + 1e-10) for p in probs)
    token_entropy = min(1.0, token_entropy / 10.0)

    # Semantic entropy from claim confidence
    if request.claims:
        claim_confs = [c.confidence for c in request.claims]
        avg_claim_conf = sum(claim_confs) / len(claim_confs)
        semantic_entropy = 1.0 - avg_claim_conf
    else:
        semantic_entropy = 0.5

    # Consistency score (inverse of hedge ratio and entropy)
    consistency_score = max(0.0, 1.0 - (hedge_ratio * 0.5 + token_entropy * 0.3 + semantic_entropy * 0.2))

    # Combined uncertainty score
    score = 1.0 - consistency_score

    if score < 0.3:
        level = "LOW"
    elif score < 0.6:
        level = "MEDIUM"
    else:
        level = "HIGH"

    return UncertaintyResponse(
        score=round(score, 4),
        token_entropy=round(token_entropy, 4),
        semantic_entropy=round(semantic_entropy, 4),
        consistency_score=round(consistency_score, 4),
        confidence_level=level,
    )

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "uncertainty-estimation"}
