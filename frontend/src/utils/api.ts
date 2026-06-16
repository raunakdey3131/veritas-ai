import type { VerificationRequest, VerificationResponse, AnalyticsData } from '../types';

const API_BASE = '/v1';

export async function verifyResponse(request: VerificationRequest): Promise<VerificationResponse> {
  const res = await fetch(`${API_BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Verification failed: ${res.statusText}`);
  return res.json();
}

export async function getAnalytics(hours: number = 24): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/v1/analytics/dashboard?hours=${hours}`);
  if (!res.ok) throw new Error(`Analytics request failed: ${res.statusText}`);
  return res.json();
}
