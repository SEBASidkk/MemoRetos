import { Injectable } from '@angular/core';

const BASE = '';

async function request(method: string, path: string, body?: any, token?: string) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  const opts: RequestInit = { method, headers: h };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  // ── Auth ──
  login(username: string, password: string) {
    return request('POST', '/auth/login', { username, password });
  }
  register(data: any) {
    return request('POST', '/auth/register', data);
  }
  getMe(token: string) {
    return request('GET', '/auth/me', null, token);
  }

  // ── Dashboard / Ranking ──
  globalRanking(token: string) {
    return request('GET', '/dashboard/ranking', null, token);
  }

  // ── Memoretos CRUD ──
  getMyMemoretos(token: string) {
    return request('GET', '/memoretos/mine', null, token);
  }
  getMemoreto(id: string | number, token: string) {
    return request('GET', `/memoretos/${id}`, null, token);
  }
  createMemoreto(body: any, token: string) {
    return request('POST', '/memoretos/', body, token);
  }
  updateMemoreto(id: string | number, body: any, token: string) {
    return request('PUT', `/memoretos/${id}`, body, token);
  }
  deleteMemoreto(id: string | number, token: string) {
    return request('DELETE', `/memoretos/${id}`, null, token);
  }

  // ── Grupos ──
  getMyGroups(token: string) {
    return request('GET', '/groups/mine', null, token);
  }
  createGroup(name: string, token: string) {
    return request('POST', '/groups/', { name }, token);
  }
  getGroup(id: string | number, token: string) {
    return request('GET', `/groups/${id}`, null, token);
  }
  getGroupStudents(id: string | number, token: string) {
    return request('GET', `/groups/${id}/students`, null, token);
  }
  getGroupMemoretos(id: string | number, token: string) {
    return request('GET', `/groups/${id}/memoretos`, null, token);
  }
  assignMemoreto(groupId: string | number, memoreto_id: number, token: string) {
    return request('POST', `/groups/${groupId}/memoretos`, { memoreto_id }, token);
  }
  removeMemoretoFromGroup(groupId: string | number, memoId: number, token: string) {
    return request('DELETE', `/groups/${groupId}/memoretos/${memoId}`, null, token);
  }
}
