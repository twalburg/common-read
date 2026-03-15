import { getUser, json, unauthorized } from '../../../lib/auth.js';

// GET /api/groups/:id/celebration — stats summary for a completed book
export async function onRequestGet({ params, request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const groupId = params.id;

  const membership = await env.DB.prepare(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(groupId, user.id).first();
  if (!membership) return json({ error: 'Not a member' }, 403);

  const group = await env.DB.prepare(
    'SELECT * FROM groups WHERE id = ?'
  ).bind(groupId).first();
  if (!group) return json({ error: 'Group not found' }, 404);

  // Get all members
  const { results: members } = await env.DB.prepare(`
    SELECT u.id, u.display_name
    FROM users u
    JOIN group_members gm ON gm.user_id = u.id
    WHERE gm.group_id = ?
  `).bind(groupId).all();

  // Get reflection stats per member
  const { results: allReflections } = await env.DB.prepare(`
    SELECT user_id, chapter, content, created_at FROM reflections
    WHERE group_id = ?
    ORDER BY chapter ASC
  `).bind(groupId).all();

  // Build per-member stats
  const memberMap = {};
  members.forEach(m => {
    memberMap[m.id] = {
      userId: m.id,
      displayName: m.display_name,
      totalReflections: 0,
      chapters: new Set(),
      longestStreak: 0,
      wordCount: 0,
    };
  });

  allReflections.forEach(r => {
    if (memberMap[r.user_id]) {
      const m = memberMap[r.user_id];
      m.totalReflections++;
      m.chapters.add(r.chapter);
      m.wordCount += (r.content || '').split(/\s+/).filter(Boolean).length;
    }
  });

  // Calculate longest streak per member
  Object.values(memberMap).forEach(m => {
    let streak = 0;
    let maxStreak = 0;
    for (let ch = 1; ch <= group.total_chapters; ch++) {
      if (m.chapters.has(ch)) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }
    m.longestStreak = maxStreak;
    m.chaptersCompleted = m.chapters.size;
    delete m.chapters; // Don't send the Set
  });

  const memberStats = Object.values(memberMap);

  // Group-level stats
  const totalReflections = allReflections.length;
  const totalWords = memberStats.reduce((sum, m) => sum + m.wordCount, 0);
  const daysToComplete = group.total_chapters;
  const startDate = group.start_date;
  const endDate = (() => {
    const d = new Date(startDate + 'T12:00:00Z');
    d.setDate(d.getDate() + daysToComplete - 1);
    return d.toISOString().split('T')[0];
  })();

  // Find MVP — most reflections
  const mvp = memberStats.reduce((best, m) =>
    m.totalReflections > (best?.totalReflections || 0) ? m : best
  , null);

  // Find longest streak holder
  const streakChamp = memberStats.reduce((best, m) =>
    m.longestStreak > (best?.longestStreak || 0) ? m : best
  , null);

  return json({
    bookLabel: group.book_label,
    totalChapters: group.total_chapters,
    startDate,
    endDate,
    totalReflections,
    totalWords,
    memberCount: members.length,
    mvp: mvp ? { displayName: mvp.displayName, totalReflections: mvp.totalReflections } : null,
    streakChamp: streakChamp ? { displayName: streakChamp.displayName, longestStreak: streakChamp.longestStreak } : null,
    members: memberStats,
  });
}
