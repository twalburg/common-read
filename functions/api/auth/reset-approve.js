import { getUser, json, unauthorized } from '../../lib/auth.js';

// POST /api/auth/reset-approve — approve or deny a reset request
export async function onRequestPost({ request, env }) {
  const admin = await getUser(request, env);
  if (!admin) return unauthorized();

  const { requestId, action } = await request.json();
  if (!requestId || !['approve', 'deny'].includes(action)) {
    return json({ error: 'requestId and action (approve/deny) required' }, 400);
  }

  // Get the reset request
  const resetReq = await env.DB.prepare(
    "SELECT * FROM reset_requests WHERE id = ? AND status = 'pending'"
  ).bind(requestId).first();
  if (!resetReq) return json({ error: 'Request not found or already processed' }, 404);

  // Verify admin has authority (is creator of a group the user belongs to)
  const authority = await env.DB.prepare(`
    SELECT g.id FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE g.created_by = ? AND gm.user_id = ?
    LIMIT 1
  `).bind(admin.id, resetReq.user_id).first();
  if (!authority) return json({ error: 'You are not a group leader for this user' }, 403);

  if (action === 'approve') {
    // Update the user's password with the pre-hashed new password
    await env.DB.prepare('UPDATE users SET password = ? WHERE id = ?')
      .bind(resetReq.new_password, resetReq.user_id).run();
    await env.DB.prepare("UPDATE reset_requests SET status = 'approved' WHERE id = ?")
      .bind(requestId).run();
    return json({ message: 'Password reset approved' });
  } else {
    await env.DB.prepare("UPDATE reset_requests SET status = 'denied' WHERE id = ?")
      .bind(requestId).run();
    return json({ message: 'Password reset denied' });
  }
}
