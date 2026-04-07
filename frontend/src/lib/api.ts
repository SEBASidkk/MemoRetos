const BACKEND = 'http://localhost:5000';

export interface ApiResponse {
  status: number;
  data: unknown;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<ApiResponse> {
  try {
    const res = await fetch(`${BACKEND}${path}`, options);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch {
    return { status: 503, data: {} };
  }
}

function authHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export function login(username: string, password: string): Promise<ApiResponse> {
  return apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export function getMe(token?: string): Promise<ApiResponse> {
  return apiFetch('/auth/me', { headers: authHeaders(token) });
}

// ── Memoretos ─────────────────────────────────────────────────────────────────

export function getMyMemoretos(token?: string): Promise<ApiResponse> {
  return apiFetch('/memoretos/mine', { headers: authHeaders(token) });
}

export function getMemoreto(id: string, token?: string): Promise<ApiResponse> {
  return apiFetch(`/memoretos/${id}`, { headers: authHeaders(token) });
}

// ── Dashboard / Stats ─────────────────────────────────────────────────────────

export function globalRanking(token?: string): Promise<ApiResponse> {
  return apiFetch('/dashboard/ranking', { headers: authHeaders(token) });
}

export function dashboardScatter(token?: string): Promise<ApiResponse> {
  return apiFetch('/dashboard/stats/scatter', { headers: authHeaders(token) });
}

export function dashboardProgreso(token?: string): Promise<ApiResponse> {
  return apiFetch('/dashboard/stats/progreso', { headers: authHeaders(token) });
}

// ── Groups ────────────────────────────────────────────────────────────────────

export function getMyGroups(token?: string): Promise<ApiResponse> {
  return apiFetch('/groups/mine', { headers: authHeaders(token) });
}

export function getGroup(id: string, token?: string): Promise<ApiResponse> {
  return apiFetch(`/groups/${id}`, { headers: authHeaders(token) });
}

export function getGroupStudents(id: string, token?: string): Promise<ApiResponse> {
  return apiFetch(`/groups/${id}/students`, { headers: authHeaders(token) });
}

export function getGroupMemoretos(id: string, token?: string): Promise<ApiResponse> {
  return apiFetch(`/groups/${id}/memoretos`, { headers: authHeaders(token) });
}
