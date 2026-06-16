"""Veritas AI — Human Review Service"""

import uuid
from datetime import datetime
from typing import Optional
from fastapi import FastAPI
from loguru import logger
from pydantic import BaseModel, Field

app = FastAPI(title="Veritas AI — Human Review", version="1.0.0")

class ReviewRequest(BaseModel):
    verification_id: str
    claim_id: str
    reviewer_action: str = Field(..., pattern="^(accept|reject|flag)$")
    reviewer_notes: Optional[str] = None
    corrected_text: Optional[str] = None

class ReviewItem(BaseModel):
    id: str
    verification_id: str
    claim_text: str
    verdict: str
    confidence: float
    reviewer_action: Optional[str] = None
    status: str = "pending"
    created_at: str

class ReviewResponse(BaseModel):
    id: str
    status: str
    message: str

reviews_db: dict = {}

@app.post("/review", response_model=ReviewResponse)
async def submit_review(request: ReviewRequest):
    review_id = f"rev_{uuid.uuid4().hex[:12]}"
    reviews_db[review_id] = {
        "id": review_id,
        **request.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
    }
    logger.info(f"Human review submitted: {review_id} -> {request.reviewer_action}")
    return ReviewResponse(id=review_id, status="accepted", message=f"Review {request.reviewer_action} recorded")

@app.get("/reviews/pending")
async def get_pending_reviews():
    pending = [v for v in reviews_db.values() if v.get("status") == "pending"]
    return {"total": len(pending), "reviews": pending[:50]}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "human-review"}
