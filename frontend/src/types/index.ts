export interface VerificationRequest {
  query: string;
  response: string;
  model_name?: string;
  model_version?: string;
  options?: {
    check_citations?: boolean;
    check_contradictions?: boolean;
    estimate_uncertainty?: boolean;
    retrieve_evidence?: boolean;
    max_claims?: number;
    sources?: string[];
  };
}

export interface Claim {
  id: string;
  text: string;
  normalized: string;
  subject: string | null;
  predicate: string | null;
  obj: string | null;
  entity_type: string | null;
  confidence: number;
  citation: string | null;
  verdict: string;
  support_score: number;
  contradiction_score: number;
  explanation: string;
  evidence: EvidenceItem[];
}

export interface EvidenceItem {
  source: string;
  source_type: string;
  url: string;
  title: string;
  snippet: string;
  relevance: number;
}

export interface Contradiction {
  type: string;
  text: string;
  severity: string;
  between: string[];
  confidence: number;
  explanation: string;
}

export interface VerificationResponse {
  request_id: string;
  status: string;
  hallucination_score: number;
  confidence_score: number;
  risk_level: RiskLevel;
  total_claims: number;
  verified_claims: number;
  suspicious_claims: number;
  contradictions: Contradiction[];
  missing_evidence: string[];
  summary: string;
  claims: Claim[];
  latency_ms: number;
  processed_at: string;
}

export type RiskLevel =
  | 'HIGHLY_RELIABLE'
  | 'MOSTLY_RELIABLE'
  | 'NEEDS_VERIFICATION'
  | 'LIKELY_HALLUCINATED'
  | 'HIGHLY_HALLUCINATED';

export interface AnalyticsData {
  total_verifications: number;
  hallucination_rate: number;
  avg_confidence: number;
  risk_distribution: Record<RiskLevel, number>;
  top_topics: { topic: string; count: number; hallucination_rate: number }[];
  latency_p50: number;
  latency_p99: number;
  trend: { date: string; hallucination_rate: number; total_verifications: number; avg_latency_ms: number }[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  targetX?: number;
  targetY?: number;
}
