import { API_BASE_URL } from './config';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  listIncidents: (status?: string) =>
    request<{ incidents: unknown[]; total: number }>(
      `/incidents${status ? `?status=${encodeURIComponent(status)}` : ''}`,
    ),
  getIncident: (id: string) => request<Record<string, unknown>>(`/incidents/${id}`),
  updateIncident: (id: string, patch: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteIncident: (id: string) =>
    request<{ deleted: boolean; incidentId: string }>(`/incidents/${id}`, {
      method: 'DELETE',
    }),
  ingest: (body: Record<string, unknown>) =>
    request<Record<string, unknown>>('/ingest', { method: 'POST', body: JSON.stringify(body) }),
  plan: (body: Record<string, unknown> = { planMode: 'full' }) =>
    request<Record<string, unknown>>('/plan', { method: 'POST', body: JSON.stringify(body) }),
  planBaseline: () =>
    request<Record<string, unknown>>('/plan?mode=baseline', {
      method: 'POST',
      body: JSON.stringify({ planMode: 'full' }),
    }),
  simulate: (planId: string, forceApiFailure = false) =>
    request<Record<string, unknown>>('/simulate', {
      method: 'POST',
      body: JSON.stringify({
        planId,
        overrides: forceApiFailure ? { forceApiFailure: true } : {},
      }),
    }),
  trace: (planId: string) =>
    request<Record<string, unknown>>(`/trace?planId=${encodeURIComponent(planId)}&includeSimTrace=true`),
};
