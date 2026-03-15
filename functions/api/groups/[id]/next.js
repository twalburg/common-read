import { getUser, json, unauthorized } from '../../../lib/auth.js';

// POST /api/groups/:id/next — complete current book and start a new one
export async function onRequestPost({ params, request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const groupId = params.id;

  // Verify membership and ownership
  const group = await env.DB.prepare(
    'SELECT * FROM groups WHERE id = ?'
  ).bind(groupId).first();
  if (!group) return json({ error: 'Group not found' }, 404);
  if (group.created_by !== user.id) {
    return json({ error: 'Only the group creator can start the next book' }, 403);
  }

  const { book, bookLabel, totalChapters, startDate } = await request.json();
  if (!book || !bookLabel || !totalChapters || !startDate) {
    return json({ error: 'Missing required fields' }, 400);
  }

  // Mark current group as completed
  await env.DB.prepare(
    "UPDATE groups SET status = 'completed' WHERE id = ?"
  ).bind(groupId).run();

  // Create new group with same name and members
  const code = `${bookLabel.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;

  const result = await env.DB.prepare(`
    INSERT INTO groups (name, invite_code, book, book_label, total_chapters, start_date, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `).bind(group.name, code, book, bookLabel, totalChapters, startDate, user.id).run();

  const newGroupId = result.meta.last_row_id;

  // Copy all members to the new group
  const { results: members } = await env.DB.prepare(
    'SELECT user_id FROM group_members WHERE group_id = ?'
  ).bind(groupId).all();

  for (const m of members) {
    await env.DB.prepare(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)'
    ).bind(newGroupId, m.user_id).run();
  }

  return json({ newGroupId, inviteCode: code }, 201);
}
