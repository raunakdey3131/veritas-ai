import type { VerificationRequest, VerificationResponse, AnalyticsData } from '../types';

const API_BASE = '/api';

export async function verifyResponse(request: VerificationRequest): Promise<VerificationResponse> {
  const res = await fetch(`${API_BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Verification failed: ${res.statusText}`);
  return res.json();
}
