import { getUser, json, unauthorized } from '../../../lib/auth.js';

function getCurrentChapter(startDate, totalChapters, todayStr) {
  const start = new Date(startDate + 'T12:00:00Z');
  const today = todayStr
    ? new Date(todayStr + 'T12:00:00Z')
    : new Date();
  const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(daysSinceStart + 1, 1), totalChapters);
}

// GET /api/groups/:id/journal
export async function onRequestGet({ params, request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const groupId = params.id;
  const url = new URL(request.url);
  const todayStr = url.searchParams.get('today');

  const membership = await env.DB.prepare(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(groupId, user.id).first();
  if (!membership) return json({ error: 'Not a member' }, 403);

  const group = await env.DB.prepare(
    'SELECT book_label, start_date, total_chapters FROM groups WHERE id = ?'
  ).bind(groupId).first();
  if (!group) return json({ error: 'Group not found' }, 404);

  const currentChapter = getCurrentChapter(group.start_date, group.total_chapters, todayStr);

  const start = new Date(group.start_date + 'T12:00:00Z');

  const { results } = await env.DB.prepare(`
    SELECT r.chapter, r.content, r.created_at, r.user_id, u.display_name
    FROM reflections r
    JOIN users u ON u.id = r.user_id
    WHERE r.group_id = ? AND r.chapter <= ?
    ORDER BY r.chapter DESC, r.created_at ASC
  `).bind(groupId, currentChapter).all();

  const chapters = {};
  for (let ch = currentChapter; ch >= 1; ch--) {
    const d = new Date(start);
    d.setDate(d.getDate() + ch - 1);
    chapters[ch] = {
      chapter: ch,
      label: `${group.book_label} ${ch}`,
      date: d.toISOString().split('T')[0],
      reflections: [],
    };
  }

  results.forEach(r => {
    if (chapters[r.chapter]) {
      chapters[r.chapter].reflections.push({
        userId: r.user_id,
        displayName: r.display_name,
        content: r.content,
        createdAt: r.created_at,
      });
    }
  });

  const journalEntries = Object.values(chapters).sort((a, b) => b.chapter - a.chapter);

  return json({
    bookLabel: group.book_label,
    currentChapter,
    entries: journalEntries,
  });
}
