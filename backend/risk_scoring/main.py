"""
Veritas AI — Risk Scoring Engine

Calculates hallucination scores, confidence intervals, and risk levels
using multi-factor weighted evaluation.
"""

from typing import Optional
from fastapi import FastAPI
from loguru import logger
from pydantic import BaseModel, Field

app = FastAPI(title="Veritas AI — Risk Scoring", version="1.0.0")

# ── Models ──────────────────────────────────────────────────────────────────

class ClaimResult(BaseModel):
    id: str
    text: str
    verdict: str
    support_score: float = 0.0
    contradiction_score: float = 0.0
    confidence: float = 0.0

class ContradictionItem(BaseModel):
    text: str
    type: str
    severity: str = "medium"

class UncertaintyResult(BaseModel):
    score: float = 0.0
    token_entropy: float = 0.0
    semantic_entropy: float = 0.0
    consistency_score: float = 1.0

class ScoringRequest(BaseModel):
    claims: list[ClaimResult]
    contradictions: list[ContradictionItem] = Field(default_factory=list)
    uncertainty: UncertaintyResult = Field(default_factory=UncertaintyResult)
    total_claims: int = 0

class ScoringResponse(BaseModel):
    hallucination_score: float
    confidence_score: float
    risk_level: str
    breakdown: dict

# ── Scoring Logic ───────────────────────────────────────────────────────────

WEIGHTS = {
    "evidence_support": 0.30,
    "contradiction": 0.25,
    "citation_validity": 0.15,
    "uncertainty": 0.20,
    "historical_risk": 0.10,
}

RISK_LEVELS = [
    (0, 20, "HIGHLY_RELIABLE"),
    (21, 40, "MOSTLY_RELIABLE"),
    (41, 60, "NEEDS_VERIFICATION"),
    (61, 80, "LIKELY_HALLUCINATED"),
    (81, 100, "HIGHLY_HALLUCINATED"),
]

def calculate_score(request: ScoringRequest) -> ScoringResponse:
    """Calculate combined hallucination risk score."""
    total = request.total_claims or len(request.claims)
    if total == 0:
        return ScoringResponse(
            hallucination_score=0.0,
            confidence_score=1.0,
            risk_level="HIGHLY_RELIABLE",
            breakdown={"message": "No claims to evaluate"},
        )

    # 1. Evidence Support Score
    supported = sum(1 for c in request.claims if c.verdict == "SUPPORTED")
    evidence_support = supported / total
    evidence_risk = 1 - evidence_support

    # 2. Contradiction Score
    num_contradictions = len(request.contradictions)
    contradiction_score = min(1.0, num_contradictions / max(1, total))

    # 3. Citation Validity (inferred from claim confidence)
    avg_confidence = (
        sum(c.confidence for c in request.claims) / total
        if total > 0 else 0.5
    )
    citation_validity = avg_confidence

    # 4. Uncertainty Score
    uncertainty_score = request.uncertainty.score if request.uncertainty else 0.5

    # 5. Historical risk (placeholder — would query time-series DB)
    historical_risk = 0.1

    # Weighted combination
    hallucination_score = (
        evidence_risk * WEIGHTS["evidence_support"]
        + contradiction_score * WEIGHTS["contradiction"]
        + (1 - citation_validity) * WEIGHTS["citation_validity"]
        + uncertainty_score * WEIGHTS["uncertainty"]
        + historical_risk * WEIGHTS["historical_risk"]
    ) * 100

    # Confidence = 1 - normalized_entropy
    confidence_score = avg_confidence * (1 - uncertainty_score * 0.3)

    # Clamp
    hallucination_score = max(0.0, min(100.0, hallucination_score))
    confidence_score = max(0.0, min(1.0, confidence_score))

    # Risk level
    risk_level = "UNKNOWN"
    for low, high, level in RISK_LEVELS:
        if low <= hallucination_score <= high:
            risk_level = level
            break

    breakdown = {
        "evidence_support": round(evidence_support, 4),
        "evidence_risk": round(evidence_risk, 4),
        "contradiction_score": round(contradiction_score, 4),
        "citation_validity": round(citation_validity, 4),
        "uncertainty_score": round(uncertainty_score, 4),
        "historical_risk": round(historical_risk, 4),
        "weighted_evidence": round(evidence_risk * WEIGHTS["evidence_support"], 4),
        "weighted_contradiction": round(contradiction_score * WEIGHTS["contradiction"], 4),
        "weighted_citation": round((1 - citation_validity) * WEIGHTS["citation_validity"], 4),
        "weighted_uncertainty": round(uncertainty_score * WEIGHTS["uncertainty"], 4),
        "weighted_historical": round(historical_risk * WEIGHTS["historical_risk"], 4),
    }

    return ScoringResponse(
        hallucination_score=round(hallucination_score, 2),
        confidence_score=round(confidence_score, 4),
        risk_level=risk_level,
        breakdown=breakdown,
    )

# ── Routes ──────────────────────────────────────────────────────────────────

@app.post("/score", response_model=ScoringResponse)
async def score(request: ScoringRequest):
    """Calculate hallucination risk score for a set of claims."""
    result = calculate_score(request)
    logger.info(f"Risk score: {result.hallucination_score} ({result.risk_level})")
    return result

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "risk-scoring"}
