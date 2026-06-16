"""
Veritas AI — Knowledge Retrieval Service

Hybrid retrieval pipeline combining dense (vector), sparse (BM25),
and knowledge graph retrieval with reciprocal rank fusion.
"""

import asyncio
import hashlib
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException
from loguru import logger
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

app = FastAPI(title="Veritas AI — Knowledge Retrieval", version="1.0.0")

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")

# ── Models ──────────────────────────────────────────────────────────────────

class Claim(BaseModel):
    id: str
    text: str
    normalized: str
    subject: Optional[str] = None
    predicate: Optional[str] = None
    obj: Optional[str] = None
    entity_type: Optional[str] = None
    confidence: float = 1.0

class RetrievalRequest(BaseModel):
    claim: Claim
    sources: list[str] = Field(default=["wikipedia", "wikidata", "enterprise_kb"])
    top_k: int = Field(default=5, ge=1, le=20)

class EvidenceItem(BaseModel):
    source: str
    source_type: str
    url: str
    title: str
    snippet: str
    relevance: float

class RetrievalResponse(BaseModel):
    evidence: list[EvidenceItem]
    total: int
    retrieval_time_ms: int
    method: str = "hybrid"

# ── Knowledge Graph (in-memory for demo) ────────────────────────────────────
# In production, this is Neo4j

KNOWLEDGE_GRAPH = {
    "Google": {
        "type": "ORGANIZATION",
        "founded": "1998",
        "founders": ["Larry Page", "Sergey Brin"],
        "ceo": "Sundar Pichai",
        "headquarters": "Mountain View, California",
        "description": "American multinational technology company",
        "products": ["Google Search", "Android", "YouTube", "Gmail", "Google Maps"],
    },
    "Python": {
        "type": "PROGRAMMING_LANGUAGE",
        "created_by": "Guido van Rossum",
        "created_in": "1991",
        "paradigm": ["object-oriented", "functional", "imperative"],
        "description": "High-level general-purpose programming language",
    },
    "Earth": {
        "type": "PLANET",
        "moons": ["Moon"],
        "distance_from_sun": "149.6 million km",
        "population": "8.1 billion",
        "description": "Third planet from the Sun",
    },
    "Larry Page": {
        "type": "PERSON",
        "known_for": ["Co-founding Google"],
        "birth_year": "1973",
        "net_worth": "100+ billion USD",
    },
    "Sergey Brin": {
        "type": "PERSON",
        "known_for": ["Co-founding Google"],
        "birth_year": "1973",
        "net_worth": "100+ billion USD",
    },
    "Sundar Pichai": {
        "type": "PERSON",
        "known_for": ["CEO of Google", "CEO of Alphabet"],
        "birth_year": "1972",
        "nationality": "Indian-American",
    },
    "Guido van Rossum": {
        "type": "PERSON",
        "known_for": ["Creating Python"],
        "birth_year": "1956",
        "nationality": "Dutch",
    },
}

# Wikipedia fallback snippets
WIKIPEDIA_SNIPPETS = {
    "Google": "Google LLC is an American multinational technology company focusing on online advertising, search engine technology, cloud computing, computer software, quantum computing, e-commerce, and artificial intelligence. It was founded on September 4, 1998, by Larry Page and Sergey Brin.",
    "Python": "Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation. It was first released in 1991 by Guido van Rossum.",
    "Earth": "Earth is the third planet from the Sun and the only astronomical object known to harbor life. It has one natural satellite, the Moon.",
    "Larry Page": "Lawrence Edward Page is an American businessman, computer scientist and internet entrepreneur best known for co-founding Google with Sergey Brin.",
    "Sergey Brin": "Sergey Mikhailovich Brin is an American businessman and computer scientist who co-founded Google with Larry Page.",
}

# ── Retrieval Pipeline ──────────────────────────────────────────────────────

async def _dense_retrieval(claim: Claim, top_k: int) -> list[EvidenceItem]:
    """Dense retrieval using vector similarity."""
    query_embedding = model.encode(claim.normalized)
    results = []

    for entity, data in KNOWLEDGE_GRAPH.items():
        entity_text = f"{entity}: {data.get('description', '')}"
        entity_embedding = model.encode(entity_text)
        similarity = float(query_embedding @ entity_embedding) / (
            float(sum(q * q for q in query_embedding) ** 0.5) *
            float(sum(e * e for e in entity_embedding) ** 0.5) + 1e-10
        )

        if similarity > 0.3:
            snippet = WIKIPEDIA_SNIPPETS.get(entity, entity_text)
            results.append(EvidenceItem(
                source=entity,
                source_type="knowledge_graph",
                url=f"https://en.wikipedia.org/wiki/{entity.replace(' ', '_')}",
                title=entity,
                snippet=snippet[:500],
                relevance=float(similarity),
            ))

    results.sort(key=lambda x: x.relevance, reverse=True)
    return results[:top_k]

async def _sparse_retrieval(claim: Claim, top_k: int) -> list[EvidenceItem]:
    """Sparse retrieval using keyword matching (BM25-like)."""
    query_terms = set(claim.normalized.lower().split())
    results = []

    for entity, data in KNOWLEDGE_GRAPH.items():
        entity_text = f"{entity} {' '.join(str(v) for v in data.values() if isinstance(v, str))} {' '.join(str(v) for v in data.values() if isinstance(v, list))}".lower()

        matches = sum(1 for term in query_terms if term in entity_text)
        if len(query_terms) > 0:
            score = matches / len(query_terms)
        else:
            score = 0

        if score > 0:
            snippet = WIKIPEDIA_SNIPPETS.get(entity, entity_text[:500])
            results.append(EvidenceItem(
                source=entity,
                source_type="sparse_match",
                url=f"https://en.wikipedia.org/wiki/{entity.replace(' ', '_')}",
                title=entity,
                snippet=snippet[:500],
                relevance=float(score),
            ))

    results.sort(key=lambda x: x.relevance, reverse=True)
    return results[:top_k]

async def _graph_retrieval(claim: Claim, top_k: int) -> list[EvidenceItem]:
    """Graph-based retrieval by traversing entity relationships."""
    results = []

    for entity_name in claim.subject, claim.obj:
        if not entity_name:
            continue
        data = KNOWLEDGE_GRAPH.get(entity_name)
        if not data:
            continue

        snippet = WIKIPEDIA_SNIPPETS.get(entity_name, str(data)[:500])
        results.append(EvidenceItem(
            source=entity_name,
            source_type="graph_entity",
            url=f"https://en.wikipedia.org/wiki/{entity_name.replace(' ', '_')}",
            title=entity_name,
            snippet=snippet[:500],
            relevance=0.9,
        ))

        # Related entities
        for key, value in data.items():
            if isinstance(value, str) and len(value) > 3:
                snippet = WIKIPEDIA_SNIPPETS.get(value, f"{entity_name} {key}: {value}")
                results.append(EvidenceItem(
                    source=value,
                    source_type="graph_relation",
                    url=f"https://en.wikipedia.org/wiki/{value.replace(' ', '_')}",
                    title=value,
                    snippet=snippet[:500],
                    relevance=0.7,
                ))
            elif isinstance(value, list):
                for item in value[:3]:
                    snippet = WIKIPEDIA_SNIPPETS.get(item, f"{entity_name} {key}: {item}")
                    results.append(EvidenceItem(
                        source=item,
                        source_type="graph_relation",
                        url=f"https://en.wikipedia.org/wiki/{item.replace(' ', '_')}",
                        title=item,
                        snippet=snippet[:500],
                        relevance=0.6,
                    ))

    return results[:top_k]

def _reciprocal_rank_fusion(
    dense: list[EvidenceItem],
    sparse: list[EvidenceItem],
    graph: list[EvidenceItem],
    top_k: int,
    k: int = 60,
) -> list[EvidenceItem]:
    """Fuse multiple ranked lists using Reciprocal Rank Fusion."""
    scores = {}

    for rank, item in enumerate(dense):
        scores[item.source] = scores.get(item.source, 0) + 1 / (k + rank + 1)

    for rank, item in enumerate(sparse):
        scores[item.source] = scores.get(item.source, 0) + 1 / (k + rank + 1)

    for rank, item in enumerate(graph):
        scores[item.source] = scores.get(item.source, 0) + 1 / (k + rank + 1)

    all_items = {}
    for items in [dense, sparse, graph]:
        for item in items:
            if item.source not in all_items:
                all_items[item.source] = item

    ranked = sorted(all_items.values(), key=lambda x: scores.get(x.source, 0), reverse=True)
    return ranked[:top_k]

# ── Routes ──────────────────────────────────────────────────────────────────

@app.post("/retrieve", response_model=RetrievalResponse)
async def retrieve(request: RetrievalRequest):
    """Hybrid retrieval for a given claim."""
    import time
    start = time.time()

    dense_task = _dense_retrieval(request.claim, request.top_k)
    sparse_task = _sparse_retrieval(request.claim, request.top_k)
    graph_task = _graph_retrieval(request.claim, request.top_k)

    dense, sparse, graph = await asyncio.gather(dense_task, sparse_task, graph_task)

    fused = _reciprocal_rank_fusion(dense, sparse, graph, request.top_k)

    elapsed = int((time.time() - start) * 1000)
    logger.info(f"Retrieved {len(fused)} items for claim '{request.claim.text[:50]}' in {elapsed}ms")

    return RetrievalResponse(
        evidence=fused,
        total=len(fused),
        retrieval_time_ms=elapsed,
        method="hybrid_rrf",
    )

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "knowledge-retrieval"}
