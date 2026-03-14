import { getUser, json, unauthorized } from '../../../lib/auth.js';

// GET /api/groups/:id/journal — all reflections grouped by chapter for journal view
export async function onRequestGet({ params, request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const groupId = params.id;

  // Verify membership
  const membership = await env.DB.prepare(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(groupId, user.id).first();
  if (!membership) return json({ error: 'Not a member' }, 403);

  // Get group info
  const group = await env.DB.prepare(
    'SELECT book_label, start_date, total_chapters FROM groups WHERE id = ?'
  ).bind(groupId).first();
  if (!group) return json({ error: 'Group not found' }, 404);

  // Calculate current chapter
  const start = new Date(group.start_date + 'T00:00:00Z');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const currentChapter = Math.min(Math.max(daysSinceStart + 1, 1), group.total_chapters);

  // Get all reflections up to current chapter
  const { results } = await env.DB.prepare(`
    SELECT r.chapter, r.content, r.created_at, r.user_id, u.display_name
    FROM reflections r
    JOIN users u ON u.id = r.user_id
    WHERE r.group_id = ? AND r.chapter <= ?
    ORDER BY r.chapter DESC, r.created_at ASC
  `).bind(groupId, currentChapter).all();

  // Group by chapter
  const chapters = {};
  for (let ch = currentChapter; ch >= 1; ch--) {
    chapters[ch] = {
      chapter: ch,
      label: `${group.book_label} ${ch}`,
      date: (() => {
        const d = new Date(start);
        d.setDate(d.getDate() + ch - 1);
        return d.toISOString().split('T')[0];
      })(),
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

  // Return as array sorted by chapter descending (most recent first)
  const journalEntries = Object.values(chapters).sort((a, b) => b.chapter - a.chapter);

  return json({
    bookLabel: group.book_label,
    currentChapter,
    entries: journalEntries,
  });
}
