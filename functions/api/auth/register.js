import { hashPassword, createToken, json } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password, displayName } = await request.json();

    if (!username || !password || !displayName) {
      return json({ error: 'Username, password, and display name are required' }, 400);
    }
    if (username.length < 3 || password.length < 6) {
      return json({ error: 'Username must be 3+ chars, password 6+ chars' }, 400);
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username.toLowerCase()).first();
    if (existing) {
      return json({ error: 'Username already taken' }, 409);
    }

    const hashedPw = await hashPassword(password);
    const result = await env.DB.prepare(
      'INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)'
    ).bind(username.toLowerCase(), hashedPw, displayName).run();

    const userId = result.meta.last_row_id;
    const token = await createToken(
      { sub: userId, username: username.toLowerCase(), displayName },
      env.JWT_SECRET
    );

    return json({ token, user: { id: userId, username: username.toLowerCase(), displayName } }, 201);
  } catch (err) {
    return json({ error: 'Registration failed', detail: err.message }, 500);
  }
}
