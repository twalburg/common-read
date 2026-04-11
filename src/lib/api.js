// src/lib/api.js — API client for Common Read

const API_BASE = '/api';

function getToken() { return localStorage.getItem('cr_token'); }
export function setToken(token) { localStorage.setItem('cr_token', token); }
export function clearToken() { localStorage.removeItem('cr_token'); }
export function getStoredUser() { const raw = localStorage.getItem('cr_user'); return raw ? JSON.parse(raw) : null; }
export function setStoredUser(user) { localStorage.setItem('cr_user', JSON.stringify(user)); }

function getLocalToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const auth = {
  register: (username, password, displayName) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, displayName }) }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
};

export const groups = {
  list: () => request('/groups'),
  get: (id) => request(`/groups/${id}?today=${getLocalToday()}`),
  create: (data) => request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  join: (inviteCode) => request('/groups/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  stats: (id) => request(`/groups/${id}/stats?today=${getLocalToday()}`),
  journal: (id) => request(`/groups/${id}/journal?today=${getLocalToday()}`),
  celebration: (id) => request(`/groups/${id}/celebration`),
  startNextBook: (id, data) => request(`/groups/${id}/next`, { method: 'POST', body: JSON.stringify(data) }),
};

export const reflections = {
  get: (groupId, chapter) => request(`/reflections?groupId=${groupId}&chapter=${chapter}`),
  submit: (groupId, chapter, content) =>
    request('/reflections', { method: 'POST', body: JSON.stringify({ groupId, chapter, content }) }),
};

export const reactions = {
  getForReflections: (reflectionIds) => request(`/reactions?reflectionIds=${reflectionIds.join(',')}`),
  toggle: (reflectionId, emoji) =>
    request('/reactions', { method: 'POST', body: JSON.stringify({ reflectionId, emoji }) }),
};

export const replies = {
  getForReflections: (reflectionIds) => request(`/replies?reflectionIds=${reflectionIds.join(',')}`),
  add: (reflectionId, content) =>
    request('/replies', { method: 'POST', body: JSON.stringify({ reflectionId, content }) }),
};

export const bible = {
  getChapter: (bookId, chapter, translation = 'BSB') =>
    request(`/bible/${bookId}/${chapter}?translation=${translation}`),
};
