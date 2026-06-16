"""Veritas AI — Citation Validation Service"""

import re
import asyncio
from typing import Optional
from fastapi import FastAPI
from loguru import logger
from pydantic import BaseModel
import httpx

app = FastAPI(title="Veritas AI — Citation Validation", version="1.0.0")

class CitationRequest(BaseModel):
    citation: str

class CitationResponse(BaseModel):
    status: str
    citation_type: str
    details: dict
    confidence: float

URL_PATTERN = re.compile(r'https?://[^\s)\]]+')
DOI_PATTERN = re.compile(r'(10\.\d{4,}/[^\s)\]]+)')
AUTHOR_PATTERN = re.compile(r'([A-Z][a-z]+(?:\s+et\s+al\.?)?),\s*(\d{4})')

@app.post("/validate", response_model=CitationResponse)
async def validate_citation(request: CitationRequest):
    cit = request.citation

    if URL_PATTERN.search(cit):
        url = URL_PATTERN.search(cit).group()
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.head(url, follow_redirects=True)
                if resp.status_code == 200:
                    return CitationResponse(status="VALID", citation_type="url", details={"url": url, "status": 200}, confidence=0.95)
                elif resp.status_code == 404:
                    return CitationResponse(status="INVALID", citation_type="url", details={"url": url, "status": 404}, confidence=0.9)
                else:
                    return CitationResponse(status="SUSPICIOUS", citation_type="url", details={"url": url, "status": resp.status_code}, confidence=0.5)
        except Exception:
            return CitationResponse(status="SUSPICIOUS", citation_type="url", details={"url": url, "error": "unreachable"}, confidence=0.3)

    if DOI_PATTERN.search(cit):
        doi = DOI_PATTERN.search(cit).group()
        return CitationResponse(status="VALID", citation_type="doi", details={"doi": doi}, confidence=0.8)

    if AUTHOR_PATTERN.search(cit):
        return CitationResponse(status="SUSPICIOUS", citation_type="author", details={"message": "Author reference needs manual verification"}, confidence=0.4)

    return CitationResponse(status="UNVERIFIABLE", citation_type="unknown", details={}, confidence=0.1)

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "citation-validation"}
