import { getUser, json, unauthorized } from '../../lib/auth.js';

// GET /api/groups — list groups the user belongs to
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { results } = await env.DB.prepare(`
    SELECT g.id, g.name, g.book, g.book_label, g.total_chapters, g.start_date, g.invite_code, g.created_by,
           COALESCE(g.status, 'active') as status
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE gm.user_id = ?
    ORDER BY
      CASE WHEN COALESCE(g.status, 'active') = 'active' THEN 0 ELSE 1 END,
      g.created_at DESC
  `).bind(user.id).all();

  return json({ groups: results });
}

// POST /api/groups — create a new group
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { name, book, bookLabel, totalChapters, startDate } = await request.json();
  if (!name || !book || !bookLabel || !totalChapters || !startDate) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const code = `${bookLabel.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;

  const result = await env.DB.prepare(`
    INSERT INTO groups (name, invite_code, book, book_label, total_chapters, start_date, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `).bind(name, code, book, bookLabel, totalChapters, startDate, user.id).run();

  const groupId = result.meta.last_row_id;

  await env.DB.prepare(
    'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)'
  ).bind(groupId, user.id).run();

  return json({ id: groupId, inviteCode: code }, 201);
}
