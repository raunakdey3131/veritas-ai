"""
Veritas AI — Verification Engine

Core verification logic using NLI models for claim-evidence comparison.
Supports entailment, contradiction, and neutral classification.
"""

import time
from typing import Optional

from fastapi import FastAPI
from loguru import logger
from pydantic import BaseModel, Field
from transformers import pipeline

app = FastAPI(title="Veritas AI — Verification Engine", version="1.0.0")

# Load NLI model (production would use a fine-tuned variant)
try:
    nli = pipeline(
        "text-classification",
        model="roberta-large-mnli",
        device=-1,  # CPU; use 0 for GPU
        top_k=None,
    )
    logger.info("Loaded RoBERTa-large-MNLI model")
except Exception as e:
    logger.warning(f"Could not load full NLI model: {e}")
    nli = None

# ── Models ──────────────────────────────────────────────────────────────────

class Claim(BaseModel):
    id: str
    text: str
    normalized: str
    subject: Optional[str] = None
    predicate: Optional[str] = None
    obj: Optional[str] = None

class EvidenceItem(BaseModel):
    source: str
    source_type: str
    url: str
    title: str
    snippet: str
    relevance: float

class VerificationRequest(BaseModel):
    claim: Claim
    evidence: list[EvidenceItem] = Field(default_factory=list)

class VerificationResponse(BaseModel):
    claim_id: str
    verdict: str  # SUPPORTED | CONTRADICTED | UNVERIFIABLE
    support_score: float
    contradiction_score: float
    neutral_score: float
    confidence: float
    explanation: str
    evidence_used: int

# ── Verification Logic ──────────────────────────────────────────────────────

def _verify_claim(claim: Claim, evidence: list[EvidenceItem]) -> VerificationResponse:
    """
    Verify a single claim against provided evidence.

    Uses NLI for semantic comparison. Falls back to keyword matching
    if NLI model is unavailable.
    """
    if not evidence:
        return VerificationResponse(
            claim_id=claim.id,
            verdict="UNVERIFIABLE",
            support_score=0.0,
            contradiction_score=0.0,
            neutral_score=1.0,
            confidence=0.5,
            explanation="No evidence found to verify this claim.",
            evidence_used=0,
        )

    scores = []
    for ev in evidence:
        try:
            if nli:
                result = _nli_verify(claim.text, ev.snippet)
            else:
                result = _keyword_verify(claim.text, ev.snippet)
            scores.append(result)
        except Exception as e:
            logger.error(f"NLI failed for claim {claim.id}: {e}")
            scores.append({"entailment": 0.33, "contradiction": 0.33, "neutral": 0.34})

    # Aggregate scores
    support = max(s["entailment"] for s in scores)
    contradiction = max(s["contradiction"] for s in scores)
    neutral = max(s["neutral"] for s in scores)

    # Normalize
    total = support + contradiction + neutral
    if total > 0:
        support /= total
        contradiction /= total
        neutral /= total

    confidence = max(support, contradiction, neutral)

    # Determine verdict
    if support > 0.7 and support > contradiction:
        verdict = "SUPPORTED"
        explanation = _generate_support_explanation(claim, evidence)
    elif contradiction > 0.6:
        verdict = "CONTRADICTED"
        explanation = _generate_contradiction_explanation(claim, evidence)
    else:
        verdict = "UNVERIFIABLE"
        explanation = "Insufficient evidence to determine the veracity of this claim."

    return VerificationResponse(
        claim_id=claim.id,
        verdict=verdict,
        support_score=round(support, 4),
        contradiction_score=round(contradiction, 4),
        neutral_score=round(neutral, 4),
        confidence=round(confidence, 4),
        explanation=explanation,
        evidence_used=len(evidence),
    )

def _nli_verify(claim: str, evidence: str) -> dict:
    """Use NLI model for verification."""
    if not nli:
        return _keyword_verify(claim, evidence)

    result = nli(f"{claim} </s></s> {evidence}")
    scores = {}
    for r in result[0]:
        label = r["label"].lower()
        if "entail" in label:
            scores["entailment"] = r["score"]
        elif "contradict" in label:
            scores["contradiction"] = r["score"]
        else:
            scores["neutral"] = r["score"]

    return scores

def _keyword_verify(claim: str, evidence: str) -> dict:
    """Fallback keyword-based verification."""
    claim_lower = claim.lower()
    evidence_lower = evidence.lower()
    claim_words = set(claim_lower.split())

    overlap = sum(1 for w in claim_words if w in evidence_lower)
    score = overlap / max(len(claim_words), 1) if claim_words else 0

    return {
        "entailment": max(0.3, score),
        "contradiction": max(0.1, 1 - score - 0.3),
        "neutral": max(0.1, 0.3),
    }

def _generate_support_explanation(claim: Claim, evidence: list) -> str:
    """Generate explanation for supported claims."""
    top = evidence[0]
    return (
        f"Claim '{claim.text}' is supported by {top.source_type} from '{top.source}'. "
        f"Evidence strongly suggests this claim is factually accurate."
    )

def _generate_contradiction_explanation(claim: Claim, evidence: list) -> str:
    """Generate explanation for contradicted claims."""
    top = evidence[0]
    return (
        f"Claim '{claim.text}' contradicts evidence from '{top.source}'. "
        f"The authoritative source suggests: '{top.snippet[:200]}'."
    )

# ── Routes ──────────────────────────────────────────────────────────────────

@app.post("/verify", response_model=VerificationResponse)
async def verify(request: VerificationRequest):
    """Verify a single claim against evidence."""
    start = time.time()
    result = _verify_claim(request.claim, request.evidence)
    elapsed = int((time.time() - start) * 1000)
    logger.info(f"Verified claim '{request.claim.id}' as {result.verdict} in {elapsed}ms")
    return result

@app.post("/verify/batch")
async def verify_batch(requests: list[VerificationRequest]):
    """Verify multiple claims."""
    results = [_verify_claim(r.claim, r.evidence) for r in requests]
    return {"results": results, "total": len(results)}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "verification-engine"}
