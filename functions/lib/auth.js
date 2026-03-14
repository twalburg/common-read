// functions/lib/auth.js — JWT + password helpers for Workers runtime

// --- Password hashing (SHA-256 + salt, Workers-compatible) ---
// Note: Workers don't have bcrypt. We use PBKDF2 which is available via Web Crypto.

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  const saltHex = [...salt].map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex, expectedHash] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  const hashHex = [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expectedHash;
}

// --- JWT (HMAC-SHA256, Workers Web Crypto) ---

function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function getSigningKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createToken(payload, secret, expiresInHours = 168) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInHours * 3600 };

  const encodedHeader = base64url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64url(new TextEncoder().encode(JSON.stringify(body)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await getSigningKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${base64url(sig)}`;
}

export async function verifyToken(token, secret) {
  try {
    const [header, payload, sig] = token.split('.');
    const key = await getSigningKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64urlDecode(sig),
      new TextEncoder().encode(`${header}.${payload}`)
    );
    if (!valid) return null;
    const body = JSON.parse(new TextDecoder().decode(base64urlDecode(payload)));
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}

// --- Auth middleware helper ---

export async function getUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const payload = await verifyToken(token, env.JWT_SECRET);
  if (!payload) return null;
  return { id: payload.sub, username: payload.username, displayName: payload.displayName };
}

// --- Response helpers ---

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function unauthorized() {
  return json({ error: 'Unauthorized' }, 401);
}
