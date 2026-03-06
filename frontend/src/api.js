const BASE = "http://localhost:5000";

function headers(token) {
  const h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function request(method, path, body, token) {
  const opts = { method, headers: headers(token) };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

// ── Auth ──
export const login = (username, password) =>
  request("POST", "/auth/login", { username, password });

export const register = (data) =>
  request("POST", "/auth/register", data);

export const getMe = (token) =>
  request("GET", "/auth/me", null, token);

// ── Dashboard / Ranking (EP6) ──
export const globalRanking = (token) =>
  request("GET", "/dashboard/ranking", null, token);

// ── Memoretos CRUD ──
export const getMyMemoretos = (token) =>
  request("GET", "/memoretos/mine", null, token);

export const getMemoreto = (id, token) =>
  request("GET", `/memoretos/${id}`, null, token);

export const createMemoreto = (body, token) =>
  request("POST", "/memoretos/", body, token);

export const updateMemoreto = (id, body, token) =>
  request("PUT", `/memoretos/${id}`, body, token);

export const deleteMemoreto = (id, token) =>
  request("DELETE", `/memoretos/${id}`, null, token);

// ── Grupos ──
export const getMyGroups = (token) =>
  request("GET", "/groups/mine", null, token);

export const createGroup = (name, token) =>
  request("POST", "/groups/", { name }, token);

export const getGroup = (id, token) =>
  request("GET", `/groups/${id}`, null, token);

export const getGroupStudents = (id, token) =>
  request("GET", `/groups/${id}/students`, null, token);

export const getGroupMemoretos = (id, token) =>
  request("GET", `/groups/${id}/memoretos`, null, token);

export const assignMemoreto = (groupId, memoreto_id, token) =>
  request("POST", `/groups/${groupId}/memoretos`, { memoreto_id }, token);

export const removeMemoretoFromGroup = (groupId, memoId, token) =>
  request("DELETE", `/groups/${groupId}/memoretos/${memoId}`, null, token);
