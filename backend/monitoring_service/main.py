"""Veritas AI — Monitoring Service"""

import time
import random
from fastapi import FastAPI
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import Response

app = FastAPI(title="Veritas AI — Monitoring", version="1.0.0")

HALLUCINATION_SCORE = Gauge("veritas_hallucination_score", "Current hallucination score")
VERIFICATION_LATENCY = Histogram("veritas_verification_latency_ms", "Verification latency", buckets=[50, 100, 200, 500, 1000, 2000])
TOTAL_VERIFIED = Counter("veritas_total_verified", "Total verifications")
FALSE_POSITIVES = Counter("veritas_false_positives", "False positive count")
FALSE_NEGATIVES = Counter("veritas_false_negatives", "False negative count")

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "monitoring"}
