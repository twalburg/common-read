import { getUser, json, unauthorized } from '../../lib/auth.js';

function getCurrentChapter(startDate, totalChapters, todayStr) {
  // Parse both as plain date strings to avoid timezone issues
  const start = new Date(startDate + 'T12:00:00Z');
  const today = todayStr
    ? new Date(todayStr + 'T12:00:00Z')
    : new Date();

  const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(daysSinceStart + 1, 1), totalChapters);
}

// GET /api/groups/:id — get group details + members + today's info
export async function onRequestGet({ params, request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const groupId = params.id;
  const url = new URL(request.url);
  const todayStr = url.searchParams.get('today'); // e.g. "2026-03-13"

  // Verify membership
  const membership = await env.DB.prepare(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(groupId, user.id).first();
  if (!membership) return json({ error: 'Not a member of this group' }, 403);

  const group = await env.DB.prepare(
    'SELECT * FROM groups WHERE id = ?'
  ).bind(groupId).first();
  if (!group) return json({ error: 'Group not found' }, 404);

  // Get members
  const { results: members } = await env.DB.prepare(`
    SELECT u.id, u.display_name
    FROM users u
    JOIN group_members gm ON gm.user_id = u.id
    WHERE gm.group_id = ?
  `).bind(groupId).all();

  const currentChapter = getCurrentChapter(group.start_date, group.total_chapters, todayStr);
  const planComplete = currentChapter >= group.total_chapters;

  return json({
    group: {
      id: group.id,
      name: group.name,
      inviteCode: group.invite_code,
      book: group.book,
      bookLabel: group.book_label,
      totalChapters: group.total_chapters,
      startDate: group.start_date,
    },
    members,
    currentChapter,
    planComplete,
  });
}
