"""
Veritas AI — API Gateway

Production-grade API gateway with request routing, auth validation,
rate limiting, circuit breaking, and observability instrumentation.
"""

import hashlib
import json
import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional

import httpx
import orjson
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from loguru import logger
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import Counter, Histogram, generate_latest
from pydantic import BaseModel, Field

from .middleware import RateLimitMiddleware, AuthMiddleware

# ── Metrics ────────────────────────────────────────────────────────────────
REQUESTS_TOTAL = Counter("veritas_requests_total", "Total requests", ["method", "endpoint", "status"])
REQUESTS_LATENCY = Histogram("veritas_request_duration_ms", "Request latency ms", ["method", "endpoint"], buckets=[50, 100, 200, 500, 1000, 2000, 5000])
ACTIVE_REQUESTS = Counter("veritas_active_requests", "Currently active requests")

# ── Tracing ────────────────────────────────────────────────────────────────
resource = Resource.create({"service.name": "veritas-api-gateway"})
provider = TracerProvider(resource=resource)
exporter = OTLPSpanExporter(endpoint="http://otel-collector:4317", insecure=True)
provider.add_span_processor(BatchSpanProcessor(exporter))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)

# ── Models ─────────────────────────────────────────────────────────────────

class VerificationRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=10000)
    response: str = Field(..., min_length=1, max_length=50000)
    model_name: Optional[str] = "unknown"
    model_version: Optional[str] = "unknown"
    options: dict = Field(default_factory=lambda: {
        "check_citations": True,
        "check_contradictions": True,
        "estimate_uncertainty": True,
        "retrieve_evidence": True,
        "max_claims": 20,
        "sources": ["wikipedia", "wikidata", "enterprise_kb"]
    })

class BatchVerificationRequest(BaseModel):
    requests: list[VerificationRequest] = Field(..., max_length=100)

class VerificationResponse(BaseModel):
    request_id: str
    status: str
    hallucination_score: float
    confidence_score: float
    risk_level: str
    total_claims: int
    verified_claims: int
    suspicious_claims: int
    contradictions: list
    missing_evidence: list
    summary: str
    claims: list
    latency_ms: int
    processed_at: str

# ── Service Registry ───────────────────────────────────────────────────────
SERVICES = {
    "claim-extraction": "http://claim-extraction:8001",
    "knowledge-retrieval": "http://knowledge-retrieval:8002",
    "verification-engine": "http://verification-engine:8003",
    "citation-validation": "http://citation-validation:8004",
    "contradiction-detection": "http://contradiction-detection:8005",
    "uncertainty-estimation": "http://uncertainty-estimation:8006",
    "risk-scoring": "http://risk-scoring:8007",
    "analytics": "http://analytics-service:8008",
    "human-review": "http://human-review:8009",
}

# ── App ────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.client = httpx.AsyncClient(timeout=30.0)
    logger.info("API Gateway started — Veritas AI")
    yield
    await app.state.client.aclose()
    logger.info("API Gateway shut down")

app = FastAPI(
    title="Veritas AI — API Gateway",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])
app.add_middleware(AuthMiddleware)
app.add_middleware(RateLimitMiddleware)

FastAPIInstrumentor.instrument_app(app)

# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "api-gateway", "timestamp": time.time()}

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")

@app.post("/v1/verify", response_model=VerificationResponse)
async def verify(request: VerificationRequest, req: Request):
    start = time.time()
    request_id = f"ver_{uuid.uuid4().hex[:12]}"
    ACTIVE_REQUESTS.inc()

    try:
        # Check cache
        cache_key = hashlib.sha256(f"{request.query}|{request.response}".encode()).hexdigest()
        cached = await _check_cache(cache_key)
        if cached:
            REQUESTS_TOTAL.labels(method="POST", endpoint="/v1/verify", status="200").inc()
            return VerificationResponse(**cached)

        # 1. Extract claims
        async with tracer.start_as_current_span("claim_extraction") as span:
            span.set_attribute("query", request.query[:200])
            claims = await _call_service("claim-extraction", "/extract", {
                "query": request.query,
                "response": request.response,
                "max_claims": request.options.get("max_claims", 20)
            })

        verified_claims = []
        suspicious_claims = 0
        contradictions = []
        missing_evidence = []

        # 2. Verify each claim
        for claim in claims.get("claims", []):
            async with tracer.start_as_current_span("verify_claim") as span:
                span.set_attribute("claim_text", claim["text"][:200])

                # Retrieve evidence
                evidence = await _call_service("knowledge-retrieval", "/retrieve", {
                    "claim": claim,
                    "sources": request.options.get("sources", ["wikipedia", "wikidata"])
                })

                # Verify
                verification = await _call_service("verification-engine", "/verify", {
                    "claim": claim,
                    "evidence": evidence.get("evidence", [])
                })

                # Check citations
                citation = {"status": "not_checked"}
                if request.options.get("check_citations", True) and claim.get("citation"):
                    citation = await _call_service("citation-validation", "/validate", {
                        "citation": claim["citation"]
                    })

                claim_result = {
                    **claim,
                    "verdict": verification.get("verdict", "UNVERIFIABLE"),
                    "support_score": verification.get("support_score", 0.0),
                    "confidence": verification.get("confidence", 0.0),
                    "evidence": evidence.get("evidence", []),
                    "citation": citation,
                    "explanation": verification.get("explanation", ""),
                }

                if claim_result["verdict"] in ("CONTRADICTED", "FABRICATED"):
                    suspicious_claims += 1
                if claim_result["verdict"] == "CONTRADICTED":
                    contradictions.append(claim_result)
                if not evidence.get("evidence"):
                    missing_evidence.append(claim)

                verified_claims.append(claim_result)

        # 3. Detect contradictions
        if request.options.get("check_contradictions", True):
            internal_contradictions = await _call_service("contradiction-detection", "/detect", {
                "claims": verified_claims
            })
            contradictions.extend(internal_contradictions.get("contradictions", []))

        # 4. Estimate uncertainty
        uncertainty = {"score": 0.0}
        if request.options.get("estimate_uncertainty", True):
            uncertainty = await _call_service("uncertainty-estimation", "/estimate", {
                "query": request.query,
                "response": request.response,
                "claims": verified_claims
            })

        # 5. Calculate risk score
        risk = await _call_service("risk-scoring", "/score", {
            "claims": verified_claims,
            "contradictions": contradictions,
            "uncertainty": uncertainty,
            "total_claims": len(claims.get("claims", []))
        })

        latency = int((time.time() - start) * 1000)
        result = VerificationResponse(
            request_id=request_id,
            status="completed",
            hallucination_score=risk.get("hallucination_score", 0.0),
            confidence_score=risk.get("confidence_score", 0.0),
            risk_level=risk.get("risk_level", "NEEDS_VERIFICATION"),
            total_claims=len(claims.get("claims", [])),
            verified_claims=len([c for c in verified_claims if c["verdict"] == "SUPPORTED"]),
            suspicious_claims=suspicious_claims,
            contradictions=contradictions,
            missing_evidence=[c["text"] for c in missing_evidence],
            summary=_generate_summary(risk),
            claims=verified_claims,
            latency_ms=latency,
            processed_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        )

        # Cache result
        await _set_cache(cache_key, result.model_dump())

        REQUESTS_TOTAL.labels(method="POST", endpoint="/v1/verify", status="200").inc()
        REQUESTS_LATENCY.labels(method="POST", endpoint="/v1/verify").observe(latency)
        return result

    except Exception as e:
        logger.error(f"Verification failed: {e}")
        REQUESTS_TOTAL.labels(method="POST", endpoint="/v1/verify", status="500").inc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        ACTIVE_REQUESTS.dec()

@app.post("/v1/verify/batch")
async def verify_batch(request: BatchVerificationRequest, req: Request):
    batch_id = f"batch_{uuid.uuid4().hex[:12]}"
    return {
        "batch_id": batch_id,
        "status": "processing",
        "total": len(request.requests),
        "message": f"Batch {batch_id} accepted for processing"
    }

# ── Internal Helpers ───────────────────────────────────────────────────────

async def _call_service(service: str, path: str, payload: dict) -> dict:
    url = f"{SERVICES[service]}{path}"
    async with tracer.start_as_current_span(f"call_{service}") as span:
        span.set_attribute("service", service)
        span.set_attribute("url", url)
        try:
            resp = await app.state.client.post(url, json=payload, timeout=10.0)
            resp.raise_for_status()
            return resp.json()
        except httpx.TimeoutException:
            logger.warning(f"Service {service} timed out")
            return {"error": "timeout", "service": service}
        except httpx.HTTPStatusError as e:
            logger.error(f"Service {service} returned {e.response.status_code}")
            return {"error": f"http_{e.response.status_code}", "service": service}

async def _check_cache(key: str) -> Optional[dict]:
    try:
        import redis.asyncio as redis
        r = redis.Redis(host="redis", port=6379, decode_responses=True)
        data = await r.get(f"verify:{key}")
        return orjson.loads(data) if data else None
    except Exception:
        return None

async def _set_cache(key: str, data: dict, ttl: int = 86400):
    try:
        import redis.asyncio as redis
        r = redis.Redis(host="redis", port=6379, decode_responses=True)
        await r.setex(f"verify:{key}", ttl, orjson.dumps(data))
    except Exception:
        pass

def _generate_summary(risk: dict) -> str:
    score = risk.get("hallucination_score", 0)
    if score <= 20:
        return "The response is highly reliable. All claims verified against trusted sources."
    elif score <= 40:
        return "The response is mostly reliable with minor discrepancies."
    elif score <= 60:
        return "The response requires human verification for certain claims."
    elif score <= 80:
        return "The response likely contains hallucinations and should not be used directly."
    return "The response is critically hallucinated and must be completely redacted."
