-- Veritas AI — PostgreSQL Schema
-- Production schema for verification platform

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users & Auth ───────────────────────────────────────────────────────────

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    organization VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'api',
    is_active BOOLEAN DEFAULT TRUE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Verification Requests ──────────────────────────────────────────────────

CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    hallucination_score FLOAT,
    confidence_score FLOAT,
    risk_level VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    source_ip INET,
    user_agent TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    shard_id INTEGER GENERATED ALWAYS AS (id::text::bigint % 64) STORED
) PARTITION BY LIST (shard_id);

-- Create partitions (0-63)
SELECT partman.create_parent('public.verification_requests', 'shard_id', 'native', 'list');

-- ── Claims ─────────────────────────────────────────────────────────────────

CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES verification_requests(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    normalized_claim TEXT,
    subject TEXT,
    predicate TEXT,
    object TEXT,
    entity_type VARCHAR(50),
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claims_request ON claims(request_id);
CREATE INDEX idx_claims_normalized ON claims(normalized_claim);
CREATE INDEX idx_claims_entity ON claims(entity_type) WHERE entity_type IS NOT NULL;

-- ── Evidence ───────────────────────────────────────────────────────────────

CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    source_type VARCHAR(100),
    source_url TEXT,
    source_title TEXT,
    snippet TEXT,
    relevance_score FLOAT,
    retrieved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_claim ON evidence(claim_id);
CREATE INDEX idx_evidence_source ON evidence(source_type);

-- ── Verification Results ───────────────────────────────────────────────────

CREATE TABLE verification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    verdict VARCHAR(50) NOT NULL,
    support_score FLOAT,
    contradiction_score FLOAT,
    neutral_score FLOAT,
    confidence FLOAT,
    model_used VARCHAR(100),
    explanation TEXT,
    evidence_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_claim ON verification_results(claim_id);
CREATE INDEX idx_verification_verdict ON verification_results(verdict);

-- ── Citation Validations ───────────────────────────────────────────────────

CREATE TABLE citation_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES claims(id),
    citation_text TEXT,
    citation_type VARCHAR(50),
    status VARCHAR(50),
    validation_details JSONB,
    confidence FLOAT,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Contradictions ─────────────────────────────────────────────────────────

CREATE TABLE contradictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES verification_requests(id),
    type VARCHAR(50),
    severity VARCHAR(20),
    text TEXT,
    claim_ids UUID[],
    confidence FLOAT,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Risk Scores ────────────────────────────────────────────────────────────

CREATE TABLE risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES verification_requests(id) UNIQUE,
    hallucination_score FLOAT,
    confidence_score FLOAT,
    risk_level VARCHAR(50),
    breakdown JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Human Reviews ──────────────────────────────────────────────────────────

CREATE TABLE human_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID REFERENCES verification_requests(id),
    claim_id UUID REFERENCES claims(id),
    reviewer_id UUID REFERENCES users(id),
    action VARCHAR(50),
    notes TEXT,
    corrected_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Audit Log ──────────────────────────────────────────────────────────────

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Monthly partitions for audit_log
SELECT partman.create_parent('public.audit_log', 'created_at', 'native', 'monthly');

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ── Analytics Materialized Views ───────────────────────────────────────────

CREATE MATERIALIZED VIEW mv_daily_stats AS
SELECT
    DATE(created_at) AS date,
    COUNT(*) AS total_verifications,
    AVG(hallucination_score) AS avg_hallucination_score,
    AVG(confidence_score) AS avg_confidence,
    COUNT(*) FILTER (WHERE risk_level IN ('LIKELY_HALLUCINATED', 'HIGHLY_HALLUCINATED')) AS hallucinated_count,
    AVG(latency_ms) AS avg_latency_ms
FROM verification_requests
WHERE completed_at IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE MATERIALIZED VIEW mv_model_performance AS
SELECT
    model_name,
    model_version,
    COUNT(*) AS total,
    AVG(hallucination_score) AS avg_hallucination_score,
    AVG(confidence_score) AS avg_confidence,
    AVG(latency_ms) AS avg_latency_ms
FROM verification_requests
WHERE model_name IS NOT NULL
GROUP BY model_name, model_version;

-- ── Functions ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
