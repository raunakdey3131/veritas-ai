"""Veritas AI — Analytics Service"""

import random
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Query
from loguru import logger
from pydantic import BaseModel

app = FastAPI(title="Veritas AI — Analytics", version="1.0.0")

class AnalyticsResponse(BaseModel):
    total_verifications: int
    hallucination_rate: float
    avg_confidence: float
    risk_distribution: dict
    top_topics: list[dict]
    latency_p50: float
    latency_p99: float
    trend: list[dict]

@app.get("/dashboard", response_model=AnalyticsResponse)
async def get_dashboard(hours: int = Query(24, ge=1, le=720)):
    # Simulated analytics data
    days = max(1, hours // 24)
    trend = []
    for d in range(days):
        date = (datetime.now() - timedelta(days=d)).strftime("%Y-%m-%d")
        trend.append({
            "date": date,
            "hallucination_rate": round(random.uniform(0.03, 0.15), 4),
            "total_verifications": random.randint(100000, 500000),
            "avg_latency_ms": random.randint(150, 400),
        })
    trend.reverse()

    return AnalyticsResponse(
        total_verifications=random.randint(10000000, 50000000),
        hallucination_rate=round(random.uniform(0.03, 0.12), 4),
        avg_confidence=round(random.uniform(0.88, 0.97), 4),
        risk_distribution={
            "HIGHLY_RELIABLE": random.randint(40, 60),
            "MOSTLY_RELIABLE": random.randint(15, 25),
            "NEEDS_VERIFICATION": random.randint(8, 15),
            "LIKELY_HALLUCINATED": random.randint(3, 8),
            "HIGHLY_HALLUCINATED": random.randint(1, 5),
        },
        top_topics=[
            {"topic": "Historical dates", "count": random.randint(5000, 15000), "hallucination_rate": round(random.uniform(0.05, 0.2), 4)},
            {"topic": "Scientific facts", "count": random.randint(3000, 10000), "hallucination_rate": round(random.uniform(0.02, 0.1), 4)},
            {"topic": "Biographical info", "count": random.randint(2000, 8000), "hallucination_rate": round(random.uniform(0.08, 0.25), 4)},
            {"topic": "Statistics", "count": random.randint(1500, 5000), "hallucination_rate": round(random.uniform(0.1, 0.3), 4)},
            {"topic": "Legal references", "count": random.randint(500, 3000), "hallucination_rate": round(random.uniform(0.15, 0.35), 4)},
        ],
        latency_p50=round(random.uniform(120, 250)),
        latency_p99=round(random.uniform(400, 900)),
        trend=trend,
    )

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "analytics"}
