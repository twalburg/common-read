import { getUser, json, unauthorized } from '../lib/auth.js';

// POST /api/reactions — toggle a reaction on a reflection
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { reflectionId, emoji } = await request.json();
  if (!reflectionId || !emoji) {
    return json({ error: 'reflectionId and emoji are required' }, 400);
  }

  // Verify the reflection exists and user is in the group
  const reflection = await env.DB.prepare(
    'SELECT id, group_id FROM reflections WHERE id = ?'
  ).bind(reflectionId).first();
  if (!reflection) return json({ error: 'Reflection not found' }, 404);

  const membership = await env.DB.prepare(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(reflection.group_id, user.id).first();
  if (!membership) return json({ error: 'Not a member' }, 403);

  // Toggle — if exists, remove; if not, add
  const existing = await env.DB.prepare(
    'SELECT id FROM reactions WHERE reflection_id = ? AND user_id = ? AND emoji = ?'
  ).bind(reflectionId, user.id, emoji).first();

  if (existing) {
    await env.DB.prepare('DELETE FROM reactions WHERE id = ?').bind(existing.id).run();
    return json({ action: 'removed', emoji });
  } else {
    await env.DB.prepare(
      'INSERT INTO reactions (reflection_id, user_id, emoji) VALUES (?, ?, ?)'
    ).bind(reflectionId, user.id, emoji).run();
    return json({ action: 'added', emoji });
  }
}

// GET /api/reactions?reflectionIds=1,2,3 — get reactions for multiple reflections
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const idsParam = url.searchParams.get('reflectionIds');
  if (!idsParam) return json({ error: 'reflectionIds required' }, 400);

  const ids = idsParam.split(',').map(Number).filter(Boolean);
  if (ids.length === 0) return json({ reactions: {} });

  // D1 doesn't support IN with bindings well, so we build it carefully
  const placeholders = ids.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT r.reflection_id, r.emoji, r.user_id, u.display_name
     FROM reactions r
     JOIN users u ON u.id = r.user_id
     WHERE r.reflection_id IN (${placeholders})
     ORDER BY r.created_at ASC`
  ).bind(...ids).all();

  // Group by reflection_id -> emoji -> list of users
  const grouped = {};
  results.forEach(r => {
    if (!grouped[r.reflection_id]) grouped[r.reflection_id] = {};
    if (!grouped[r.reflection_id][r.emoji]) grouped[r.reflection_id][r.emoji] = [];
    grouped[r.reflection_id][r.emoji].push({
      userId: r.user_id,
      displayName: r.display_name,
    });
  });

  return json({ reactions: grouped });
}
