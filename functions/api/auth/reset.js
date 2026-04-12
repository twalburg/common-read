import { hashPassword, getUser, json, unauthorized } from '../../lib/auth.js';

// POST /api/auth/reset — submit a reset request (unauthenticated)
export async function onRequestPost({ request, env }) {
  const { username, newPassword } = await request.json();
  if (!username || !newPassword) return json({ error: 'Username and new password required' }, 400);
  if (newPassword.length < 6) return json({ error: 'Password must be 6+ characters' }, 400);

  const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?')
    .bind(username.toLowerCase()).first();
  if (!user) return json({ error: 'Username not found' }, 404);

  // Check for existing pending request
  const existing = await env.DB.prepare(
    "SELECT id FROM reset_requests WHERE user_id = ? AND status = 'pending'"
  ).bind(user.id).first();
  if (existing) return json({ error: 'A reset request is already pending. Contact your group leader.' }, 409);

  // Hash the new password now so approval is instant
  const hashedPw = await hashPassword(newPassword);

  await env.DB.prepare(
    'INSERT INTO reset_requests (user_id, new_password) VALUES (?, ?)'
  ).bind(user.id, hashedPw).run();

  return json({ message: 'Reset request submitted. Ask your group leader to approve it.' }, 201);
}

// GET /api/auth/reset — list pending requests (for group creators only)
export async function onRequestGet({ request, env }) {
  const admin = await getUser(request, env);
  if (!admin) return unauthorized();

  // Find users who are in groups created by this admin
  const { results } = await env.DB.prepare(`
    SELECT DISTINCT rr.id, rr.user_id, rr.created_at, u.username, u.display_name
    FROM reset_requests rr
    JOIN users u ON u.id = rr.user_id
    WHERE rr.status = 'pending'
    AND rr.user_id IN (
      SELECT gm.user_id FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      WHERE g.created_by = ?
    )
    ORDER BY rr.created_at DESC
  `).bind(admin.id).all();

  return json({ requests: results });
}
