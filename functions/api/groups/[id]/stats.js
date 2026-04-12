import { getUser, json, unauthorized } from '../../../lib/auth.js';
import { calculateChapter, parseRestDays } from '../../../lib/chapters.js';

export async function onRequestGet({ params, request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const groupId = params.id;
  const url = new URL(request.url);
  const todayStr = url.searchParams.get('today');

  const membership = await env.DB.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').bind(groupId, user.id).first();
  if (!membership) return json({ error: 'Not a member' }, 403);

  const group = await env.DB.prepare('SELECT start_date, total_chapters, rest_days FROM groups WHERE id = ?').bind(groupId).first();
  if (!group) return json({ error: 'Group not found' }, 404);

  const restDays = parseRestDays(group.rest_days);
  const { currentChapter } = calculateChapter(group.start_date, group.total_chapters, restDays, todayStr);

  const { results: members } = await env.DB.prepare('SELECT u.id, u.display_name FROM users u JOIN group_members gm ON gm.user_id = u.id WHERE gm.group_id = ?').bind(groupId).all();
  const { results: reflectionCounts } = await env.DB.prepare('SELECT user_id, COUNT(*) as count FROM reflections WHERE group_id = ? GROUP BY user_id').bind(groupId).all();
  const countMap = {}; reflectionCounts.forEach(r => { countMap[r.user_id] = r.count; });

  const { results: todayReflections } = await env.DB.prepare('SELECT user_id FROM reflections WHERE group_id = ? AND chapter = ?').bind(groupId, currentChapter).all();
  const todayComplete = new Set(todayReflections.map(r => r.user_id));

  const { results: allReflections } = await env.DB.prepare('SELECT user_id, chapter FROM reflections WHERE group_id = ? ORDER BY chapter ASC').bind(groupId).all();
  const chaptersByUser = {};
  allReflections.forEach(r => { if (!chaptersByUser[r.user_id]) chaptersByUser[r.user_id] = new Set(); chaptersByUser[r.user_id].add(r.chapter); });

  const memberStats = members.map(m => {
    const chapters = chaptersByUser[m.id] || new Set();
    let streak = 0;
    for (let ch = currentChapter; ch >= 1; ch--) { if (chapters.has(ch)) streak++; else break; }
    return { userId: m.id, displayName: m.display_name, totalReflections: countMap[m.id] || 0, completedToday: todayComplete.has(m.id), currentStreak: streak };
  });

  return json({ currentChapter, totalChapters: group.total_chapters, todayCompleted: todayComplete.size, totalMembers: members.length, members: memberStats });
}
