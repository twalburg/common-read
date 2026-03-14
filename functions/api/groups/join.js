import { getUser, json, unauthorized } from '../../lib/auth.js';

// POST /api/groups/join — join a group via invite code
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { inviteCode } = await request.json();
  if (!inviteCode) return json({ error: 'Invite code is required' }, 400);

  const group = await env.DB.prepare(
    'SELECT id, name, book_label FROM groups WHERE invite_code = ?'
  ).bind(inviteCode.trim().toLowerCase()).first();

  if (!group) return json({ error: 'Invalid invite code' }, 404);

  // Check if already a member
  const existing = await env.DB.prepare(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(group.id, user.id).first();

  if (existing) return json({ error: 'Already a member of this group' }, 409);

  await env.DB.prepare(
    'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)'
  ).bind(group.id, user.id).run();

  return json({ groupId: group.id, name: group.name, bookLabel: group.book_label });
}
