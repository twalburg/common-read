import { getUser, json, unauthorized } from '../lib/auth.js';

// GET /api/reflections?groupId=X&chapter=Y — get all reflections for a chapter
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const groupId = url.searchParams.get('groupId');
  const chapter = url.searchParams.get('chapter');
  if (!groupId || !chapter) return json({ error: 'groupId and chapter required' }, 400);

  // Verify membership
  const membership = await env.DB.prepare(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(groupId, user.id).first();
  if (!membership) return json({ error: 'Not a member' }, 403);

  const { results } = await env.DB.prepare(`
    SELECT r.id, r.content, r.created_at, r.user_id, u.display_name
    FROM reflections r
    JOIN users u ON u.id = r.user_id
    WHERE r.group_id = ? AND r.chapter = ?
    ORDER BY r.created_at ASC
  `).bind(groupId, parseInt(chapter)).all();

  return json({ reflections: results });
}

// POST /api/reflections — submit a reflection
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { groupId, chapter, content } = await request.json();
  if (!groupId || !chapter || !content?.trim()) {
    return json({ error: 'groupId, chapter, and content are required' }, 400);
  }

  // Verify membership
  const membership = await env.DB.prepare(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(groupId, user.id).first();
  if (!membership) return json({ error: 'Not a member' }, 403);

  // Upsert — allow editing your own reflection
  const existing = await env.DB.prepare(
    'SELECT id FROM reflections WHERE group_id = ? AND user_id = ? AND chapter = ?'
  ).bind(groupId, user.id, chapter).first();

  if (existing) {
    await env.DB.prepare(
      'UPDATE reflections SET content = ?, created_at = datetime("now") WHERE id = ?'
    ).bind(content.trim(), existing.id).run();
    return json({ updated: true });
  }

  await env.DB.prepare(
    'INSERT INTO reflections (group_id, user_id, chapter, content) VALUES (?, ?, ?, ?)'
  ).bind(groupId, user.id, chapter, content.trim()).run();

  return json({ created: true }, 201);
}
