// src/lib/api.js — API client for Common Read

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('cr_token');
}

export function setToken(token) {
  localStorage.setItem('cr_token', token);
}

export function clearToken() {
  localStorage.removeItem('cr_token');
}

export function getStoredUser() {
  const raw = localStorage.getItem('cr_user');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user) {
  localStorage.setItem('cr_user', JSON.stringify(user));
}

// Get today's date as YYYY-MM-DD in the user's local timezone
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

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

// Auth
export const auth = {
  register: (username, password, displayName) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    }),
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

// Groups — all group reads send local date for timezone-correct chapter calculation
export const groups = {
  list: () => request('/groups'),
  get: (id) => request(`/groups/${id}?today=${getLocalToday()}`),
  create: (data) =>
    request('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  join: (inviteCode) =>
    request('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),
  stats: (id) => request(`/groups/${id}/stats?today=${getLocalToday()}`),
  journal: (id) => request(`/groups/${id}/journal?today=${getLocalToday()}`),
};

// Reflections
export const reflections = {
  get: (groupId, chapter) =>
    request(`/reflections?groupId=${groupId}&chapter=${chapter}`),
  submit: (groupId, chapter, content) =>
    request('/reflections', {
      method: 'POST',
      body: JSON.stringify({ groupId, chapter, content }),
    }),
};

// Bible
export const bible = {
  getChapter: (bookId, chapter) =>
    request(`/bible/${bookId}/${chapter}`),
};
