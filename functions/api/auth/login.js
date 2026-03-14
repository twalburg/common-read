import { verifyPassword, createToken, json } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return json({ error: 'Username and password are required' }, 400);
    }

    const user = await env.DB.prepare(
      'SELECT id, username, password, display_name FROM users WHERE username = ?'
    ).bind(username.toLowerCase()).first();

    if (!user || !(await verifyPassword(password, user.password))) {
      return json({ error: 'Invalid username or password' }, 401);
    }

    const token = await createToken(
      { sub: user.id, username: user.username, displayName: user.display_name },
      env.JWT_SECRET
    );

    return json({ token, user: { id: user.id, username: user.username, displayName: user.display_name } });
  } catch (err) {
    return json({ error: 'Login failed', detail: err.message }, 500);
  }
}
