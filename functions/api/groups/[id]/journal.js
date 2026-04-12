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

  const group = await env.DB.prepare('SELECT book_label, start_date, total_chapters, rest_days FROM groups WHERE id = ?').bind(groupId).first();
  if (!group) return json({ error: 'Group not found' }, 404);

  const restDays = parseRestDays(group.rest_days);
  const { currentChapter } = calculateChapter(group.start_date, group.total_chapters, restDays, todayStr);
  const start = new Date(group.start_date + 'T12:00:00Z');

  const { results } = await env.DB.prepare(`
    SELECT r.chapter, r.content, r.created_at, r.user_id, u.display_name
    FROM reflections r JOIN users u ON u.id = r.user_id
    WHERE r.group_id = ? AND r.chapter <= ? ORDER BY r.chapter DESC, r.created_at ASC
  `).bind(groupId, currentChapter).all();

  // Map chapter numbers to calendar dates accounting for rest days
  const chapterDates = {};
  let ch = 0;
  const d = new Date(start);
  while (ch < group.total_chapters) {
    const dow = d.getUTCDay();
    if (!restDays.includes(dow)) {
      ch++;
      chapterDates[ch] = d.toISOString().split('T')[0];
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }

  const chapters = {};
  for (let c = currentChapter; c >= 1; c--) {
    chapters[c] = {
      chapter: c, label: `${group.book_label} ${c}`,
      date: chapterDates[c] || '', reflections: [],
    };
  }

  results.forEach(r => { if (chapters[r.chapter]) chapters[r.chapter].reflections.push({ userId: r.user_id, displayName: r.display_name, content: r.content, createdAt: r.created_at }); });

  return json({ bookLabel: group.book_label, currentChapter, entries: Object.values(chapters).sort((a, b) => b.chapter - a.chapter) });
}
