import { getUser, json, unauthorized } from '../lib/auth.js';

// GET /api/replies?reflectionIds=1,2,3
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const idsParam = url.searchParams.get('reflectionIds');
  if (!idsParam) return json({ error: 'reflectionIds required' }, 400);

  const ids = idsParam.split(',').map(Number).filter(Boolean);
  if (ids.length === 0) return json({ replies: {} });

  const placeholders = ids.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT r.id, r.reflection_id, r.content, r.created_at, r.user_id, u.display_name
     FROM replies r JOIN users u ON u.id = r.user_id
     WHERE r.reflection_id IN (${placeholders})
     ORDER BY r.created_at ASC`
  ).bind(...ids).all();

  const grouped = {};
  results.forEach(r => {
    if (!grouped[r.reflection_id]) grouped[r.reflection_id] = [];
    grouped[r.reflection_id].push({
      id: r.id, userId: r.user_id, displayName: r.display_name,
      content: r.content, createdAt: r.created_at,
    });
  });

  return json({ replies: grouped });
}

// POST /api/replies
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { reflectionId, content } = await request.json();
  if (!reflectionId || !content?.trim()) return json({ error: 'reflectionId and content required' }, 400);

  const reflection = await env.DB.prepare('SELECT id, group_id FROM reflections WHERE id = ?').bind(reflectionId).first();
  if (!reflection) return json({ error: 'Reflection not found' }, 404);

  const membership = await env.DB.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').bind(reflection.group_id, user.id).first();
  if (!membership) return json({ error: 'Not a member' }, 403);

  const result = await env.DB.prepare('INSERT INTO replies (reflection_id, user_id, content) VALUES (?, ?, ?)').bind(reflectionId, user.id, content.trim()).run();

  return json({ id: result.meta.last_row_id, displayName: user.displayName, content: content.trim() }, 201);
}
