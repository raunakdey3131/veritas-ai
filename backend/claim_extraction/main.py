"""
Veritas AI — Claim Extraction Service

Converts LLM responses into atomic, verifiable claims using
NER, dependency parsing, relation extraction, and segmentation.
"""

import re
import uuid
from typing import Optional

import spacy
from fastapi import FastAPI
from loguru import logger
from pydantic import BaseModel, Field

app = FastAPI(title="Veritas AI — Claim Extraction", version="1.0.0")

# Load spaCy model (en_core_web_trf for production)
try:
    nlp = spacy.load("en_core_web_trf")
except OSError:
    nlp = spacy.load("en_core_web_sm")

# ── Models ──────────────────────────────────────────────────────────────────

class ExtractionRequest(BaseModel):
    query: str = Field(..., max_length=10000)
    response: str = Field(..., max_length=50000)
    max_claims: int = Field(default=20, ge=1, le=100)

class Claim(BaseModel):
    id: str
    text: str
    normalized: str
    subject: Optional[str] = None
    predicate: Optional[str] = None
    obj: Optional[str] = None
    entity_type: Optional[str] = None
    confidence: float = 1.0
    citation: Optional[str] = None

class ExtractionResponse(BaseModel):
    claims: list[Claim]
    total: int
    model: str

# ── Claim Extraction Pipeline ──────────────────────────────────────────────

# Contradiction indicators
CONTRADICTION_WORDS = {
    "but", "however", "although", "nevertheless", "conversely",
    "on the other hand", "despite", "in contrast", "actually",
    "wait", "correction", "actually", "instead", "rather"
}

# Measurement patterns for numerical claims
MEASUREMENT_PATTERN = re.compile(
    r'(\d+[\.,]?\d*)\s*(million|billion|trillion|thousand|'
    r'km|km/s|m/s|mph|kg|tons|GB|TB|MHz|GHz|%|years|months|days)',
    re.IGNORECASE
)

DATE_PATTERN = re.compile(
    r'\b(19|20)\d{2}\b'
)

def extract_claims(response: str, max_claims: int = 20) -> list[Claim]:
    """Main extraction pipeline."""
    doc = nlp(response)
    claims = []

    for sent in doc.sents:
        sent_claims = _extract_from_sentence(sent)
        claims.extend(sent_claims)

        if len(claims) >= max_claims:
            break

    # Deduplicate
    seen = set()
    unique = []
    for c in claims:
        if c.normalized not in seen:
            seen.add(c.normalized)
            unique.append(c)

    return unique[:max_claims]

def _extract_from_sentence(sent) -> list[Claim]:
    """Extract atomic claims from a single sentence."""
    claims = []
    text = sent.text.strip()

    # Skip questions, greetings, and boilerplate
    if _is_boilerplate(text):
        return claims

    # Extract subject-verb-object triples
    triples = _extract_triples(sent)

    for triple in triples:
        subject, predicate, obj = triple
        if not subject or not predicate:
            continue

        claim_text = f"{subject} {predicate} {obj}".strip()
        if len(claim_text.split()) < 3:
            continue

        normalized = _normalize_claim(claim_text)

        # Get entity type
        entity_type = _get_entity_type(sent, subject)

        # Extract citations
        citation = _extract_citation(sent)

        claims.append(Claim(
            id=f"clm_{uuid.uuid4().hex[:12]}",
            text=claim_text,
            normalized=normalized,
            subject=subject,
            predicate=predicate,
            obj=obj,
            entity_type=entity_type,
            confidence=_estimate_claim_confidence(sent),
            citation=citation,
        ))

    # Also extract standalone numerical claims
    numerical = _extract_numerical_claims(text, sent)
    claims.extend(numerical)

    return claims

def _extract_triples(sent) -> list[tuple]:
    """Extract (subject, predicate, object) triples via dependency parsing."""
    triples = []
    doc = sent.as_doc() if hasattr(sent, 'as_doc') else sent.doc

    # Find main verb
    for token in sent:
        if token.dep_ == "ROOT" and token.pos_ == "VERB":
            # Subject
            subjects = [child for child in token.children if child.dep_ in ("nsubj", "nsubjpass")]
            # Objects
            objects = [child for child in token.children if child.dep_ in ("dobj", "pobj", "attr", "prep")]

            for subj in subjects:
                subj_phrase = _expand_phrase(subj)

                if objects:
                    for obj in objects:
                        obj_phrase = _expand_phrase(obj)
                        # For prepositional objects, include the preposition
                        if obj.pos_ == "ADP":
                            obj_children = [c for c in obj.children if c.dep_ == "pobj"]
                            if obj_children:
                                obj_phrase = f"{obj.text} {_expand_phrase(obj_children[0])}"

                        triples.append((subj_phrase, token.text, obj_phrase))
                else:
                    # Check for passive voice
                    if token.dep_ == "ROOT" and any(child.dep_ == "auxpass" for child in token.children):
                        triples.append((subj_phrase, f"was {token.text}", ""))

                    # Check for adjectival complement
                    adj_comp = [child for child in token.children if child.dep_ == "acomp"]
                    if adj_comp:
                        triples.append((subj_phrase, f"is {adj_comp[0].text}", ""))

            # Handle copular verbs (is/are/was/were)
            if not subjects and token.lemma_ in ("be", "become", "seem", "appear"):
                subj = [child for child in token.children if child.dep_ == "nsubj"]
                attr = [child for child in token.children if child.dep_ == "attr"]
                if subj and attr:
                    triples.append((
                        _expand_phrase(subj[0]),
                        token.text,
                        _expand_phrase(attr[0])
                    ))

    # Fallback: use NER for entity-relation extraction
    if not triples:
        triples = _extract_ner_triples(sent)

    return triples

def _extract_ner_triples(sent) -> list[tuple]:
    """Extract triples using named entities as fallback."""
    triples = []
    entities = list(sent.ents)

    for i in range(len(entities) - 1):
        e1 = entities[i]
        e2 = entities[i + 1]
        text_between = sent.text[e1.end:e2.start].strip()

        if text_between and len(text_between.split()) <= 5:
            triples.append((e1.text, text_between, e2.text))

    return triples

def _expand_phrase(token) -> str:
    """Expand a token to include its adjective modifiers, determiners, etc."""
    tokens = []
    # Include left modifiers
    for child in token.children:
        if child.dep_ in ("det", "amod", "nummod", "poss", "compound") and child.i < token.i:
            tokens.append((child.i, child.text))
    tokens.append((token.i, token.text))
    # Include right modifiers
    for child in token.children:
        if child.dep_ in ("amod", "nummod", "compound") and child.i > token.i:
            tokens.append((child.i, child.text))

    tokens.sort(key=lambda x: x[0])
    return " ".join(t[1] for t in tokens)

def _extract_numerical_claims(text: str, sent) -> list[Claim]:
    """Extract standalone numerical/factual claims."""
    claims = []
    matches = MEASUREMENT_PATTERN.findall(text)
    for value, unit in matches:
        # Find what this measurement refers to
        claim_text = f"{text}"
        claims.append(Claim(
            id=f"clm_{uuid.uuid4().hex[:12]}",
            text=claim_text,
            normalized=_normalize_claim(claim_text),
            confidence=0.8,
            entity_type="MEASUREMENT",
        ))

    # Date claims
    dates = DATE_PATTERN.findall(text)
    for date in dates:
        claims.append(Claim(
            id=f"clm_{uuid.uuid4().hex[:12]}",
            text=f"The year is {date}",
            normalized=f"year_{date}",
            confidence=0.7,
            entity_type="DATE",
        ))

    return claims

def _extract_citation(sent) -> Optional[str]:
    """Extract inline citations (e.g., [1], (Author, 2020))."""
    citation_patterns = [
        r'\[(\d+(?:,\s*\d+)*)\]',
        r'\(([A-Z][a-z]+(?:\s+et\s+al\.?)?,\s*\d{4}[a-z]?)\)',
        r'\(https?://[^\s)]+\)',
        r'\[https?://[^\]]+\]',
    ]
    for pattern in citation_patterns:
        match = re.search(pattern, sent.text)
        if match:
            return match.group(0)
    return None

def _normalize_claim(text: str) -> str:
    """Normalize claim to canonical form."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    # Remove leading articles
    text = re.sub(r'^(the|a|an)\s+', '', text)
    return text

def _get_entity_type(sent, subject: str) -> Optional[str]:
    """Get NER label for the subject entity."""
    for ent in sent.ents:
        if ent.text.lower() in subject.lower() or subject.lower() in ent.text.lower():
            return ent.label_
    return None

def _estimate_claim_confidence(sent) -> float:
    """Estimate confidence in this claim extraction."""
    score = 1.0
    # Penalize very short or very long sentences
    words = len(sent)
    if words < 5:
        score -= 0.2
    if words > 40:
        score -= 0.1
    # Penalize sentences with hedging
    hedges = {"might", "could", "possibly", "perhaps", "maybe", "seems", "appears"}
    if any(token.text.lower() in hedges for token in sent):
        score -= 0.15
    return max(0.5, min(1.0, score))

def _is_boilerplate(text: str) -> bool:
    """Detect boilerplate text."""
    boilerplate = {
        "i'm sorry", "i apologize", "i cannot", "i don't know",
        "as an ai", "as a language model", "thank you", "please note",
        "is there anything", "how can i", "let me know", "feel free",
        "for more information", "in conclusion", "to summarize",
    }
    return any(text.lower().startswith(b) for b in boilerplate)

# ── Routes ──────────────────────────────────────────────────────────────────

@app.post("/extract", response_model=ExtractionResponse)
async def extract(request: ExtractionRequest):
    """Extract atomic claims from an LLM response."""
    logger.info(f"Extracting claims from response ({len(request.response)} chars)")
    claims = extract_claims(request.response, request.max_claims)
    return ExtractionResponse(
        claims=claims,
        total=len(claims),
        model="en_core_web_trf",
    )

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "claim-extraction"}
