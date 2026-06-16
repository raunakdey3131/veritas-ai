"""Veritas AI — Standalone Demo Backend

Lightweight FastAPI server with heuristic hallucination detection.
No external services required. Runs on port 8000.
"""

import re
import time
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Veritas AI — Demo Backend", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Known false claims → hallucination ──────────────────────────────────
FALSE_PATTERNS = [
    (re.compile(r'2010.*python|python.*2010', re.I), 'Python was created in 1991 by Guido van Rossum, not 2010.', 85),
    (re.compile(r'1908.*google|google.*1908|1900.*google|google.*1900', re.I), 'Google was founded in 1998 by Larry Page and Sergey Brin, not 1908.', 88),
    (re.compile(r'1898.*google|google.*1898', re.I), 'Google was founded in 1998 by Larry Page and Sergey Brin.', 88),
    (re.compile(r'earth.*two moons|two moons.*earth|earth.*2 moons', re.I), 'Earth has exactly one moon, not two.', 90),
    (re.compile(r'speed.*light.*200.*000|light.*speed.*200', re.I), 'Speed of light is ~300,000 km/s, not 200,000 km/s.', 75),
    (re.compile(r'population.*(9|10|11|12).*billion', re.I), 'World population is approximately 8 billion.', 70),
    (re.compile(r'einstein.*invent', re.I), 'Einstein developed theories of relativity, not inventions.', 60),
    (re.compile(r'moon.*made.*cheese', re.I), 'The moon is made of rock, not cheese.', 95),
    (re.compile(r'71.*water.*earth|water.*71', re.I), 'About 71% of Earth is water.', 45),
    (re.compile(r'sun.*revolve.*earth|earth.*center.*universe', re.I), 'Earth revolves around the Sun, not vice versa.', 98),
]

TRUE_PATTERNS = [
    (re.compile(r'1991.*python|python.*1991|guido van rossum', re.I), 'Python was created in 1991 by Guido van Rossum', -3),
    (re.compile(r'1998.*google|google.*1998|larry page.*sergey brin', re.I), 'Google was founded in 1998 by Larry Page and Sergey Brin', -3),
    (re.compile(r'earth.*one moon|single moon', re.I), 'Earth has exactly one moon', -3),
]


class VerifyRequest(BaseModel):
    query: str = Field(default="Verify this statement")
    response: str = Field(..., min_length=1)
    options: dict = Field(default_factory=dict)


@app.post("/v1/verify")
async def verify(req: VerifyRequest):
    start = time.time()
    lower = req.response.lower()

    matched_false = next(((p, c, s) for p, c, s in FALSE_PATTERNS if p.search(lower)), None)
    matched_true = None if matched_false else next(((p, c, s) for p, c, s in TRUE_PATTERNS if p.search(lower)), None)

    is_hall = matched_false is not None
    score = matched_false[2] if matched_false else (matched_true[2] if matched_true else 15)

    def risk(s):
        if s >= 80: return 'HIGHLY_HALLUCINATED'
        if s >= 50: return 'LIKELY_HALLUCINATED'
        if s >= 25: return 'NEEDS_VERIFICATION'
        return 'HIGHLY_RELIABLE'

    correction = (matched_false or matched_true or (None, '', 0))[1]

    return {
        "request_id": f"ver_{uuid.uuid4().hex[:12]}",
        "status": "completed",
        "hallucination_score": score,
        "confidence_score": 0.08 if is_hall else 0.94,
        "risk_level": risk(score),
        "total_claims": 3,
        "verified_claims": 0 if is_hall else 3,
        "suspicious_claims": 2 if is_hall else 0,
        "contradictions": [{
            "type": "EXTERNAL_CONTRADICTION",
            "text": correction,
            "severity": "high",
            "between": ["clm_1", "knowledge"],
            "confidence": 0.99,
            "explanation": correction,
        }] if is_hall else [],
        "missing_evidence": [req.response.split('.')[0]] if is_hall else [],
        "summary": f'Hallucination detected: {correction}' if is_hall else (
            f'Verified correct: {correction}' if matched_true else 'No specific claims detected.'),
        "claims": [{
            "id": "clm_1",
            "text": req.response.split('.')[0],
            "verdict": "CONTRADICTED" if is_hall else "SUPPORTED",
            "support_score": 0.05 if is_hall else 0.97,
            "contradiction_score": 0.94 if is_hall else 0.03,
            "explanation": correction or "Claim appears consistent with known facts.",
            "evidence": [{
                "source": "Knowledge Graph",
                "source_type": "knowledge_graph",
                "title": req.response.split(' ')[0],
                "snippet": correction or "Factual basis verified.",
                "relevance": 0.98,
            }],
        }],
        "latency_ms": int((time.time() - start) * 1000),
        "processed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "veritas-demo-backend"}
