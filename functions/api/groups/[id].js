import { getUser, json, unauthorized } from '../../lib/auth.js';
import { calculateChapter, parseRestDays } from '../../lib/chapters.js';

export async function onRequestGet({ params, request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const groupId = params.id;
  const url = new URL(request.url);
  const todayStr = url.searchParams.get('today');

  const membership = await env.DB.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').bind(groupId, user.id).first();
  if (!membership) return json({ error: 'Not a member of this group' }, 403);

  const group = await env.DB.prepare('SELECT * FROM groups WHERE id = ?').bind(groupId).first();
  if (!group) return json({ error: 'Group not found' }, 404);

  const { results: members } = await env.DB.prepare(`
    SELECT u.id, u.display_name FROM users u JOIN group_members gm ON gm.user_id = u.id WHERE gm.group_id = ?
  `).bind(groupId).all();

  const restDays = parseRestDays(group.rest_days);
  const status = group.status || 'active';
  const { currentChapter, isRestDay, planComplete: calcComplete } = calculateChapter(group.start_date, group.total_chapters, restDays, todayStr);
  const planComplete = status === 'completed' || calcComplete;

  return json({
    group: {
      id: group.id, name: group.name, inviteCode: group.invite_code,
      book: group.book, bookLabel: group.book_label, totalChapters: group.total_chapters,
      startDate: group.start_date, createdBy: group.created_by, status,
      restDays,
    },
    members, currentChapter, isRestDay, planComplete,
  });
}
