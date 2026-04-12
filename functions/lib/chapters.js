// functions/lib/chapters.js — Shared chapter calculation with rest days

/**
 * Calculate the current chapter accounting for rest days.
 * @param {string} startDate - ISO date string "2026-03-15"
 * @param {number} totalChapters - Total chapters in the book
 * @param {number[]} restDays - Array of day-of-week numbers to skip (0=Sun, 6=Sat)
 * @param {string|null} todayStr - Optional ISO date string for "today"
 * @returns {{ currentChapter: number, isRestDay: boolean, planComplete: boolean }}
 */
export function calculateChapter(startDate, totalChapters, restDays = [], todayStr = null) {
  const start = new Date(startDate + 'T12:00:00Z');
  const today = todayStr ? new Date(todayStr + 'T12:00:00Z') : new Date();

  // If today is before start date
  if (today < start) {
    return { currentChapter: 1, isRestDay: false, planComplete: false };
  }

  let readingDays = 0;
  const d = new Date(start);

  while (d <= today) {
    const dow = d.getUTCDay();
    if (!restDays.includes(dow)) {
      readingDays++;
    }
    // Move to next day (but don't go past today)
    if (d.toISOString().split('T')[0] === today.toISOString().split('T')[0]) break;
    d.setUTCDate(d.getUTCDate() + 1);
  }

  const todayDOW = today.getUTCDay();
  const isRestDay = restDays.includes(todayDOW);
  const currentChapter = Math.min(Math.max(readingDays, 1), totalChapters);
  const planComplete = readingDays > totalChapters;

  return { currentChapter, isRestDay, planComplete };
}

/**
 * Calculate the end date for a reading plan accounting for rest days.
 * @param {string} startDate - ISO date string
 * @param {number} totalChapters - Total chapters
 * @param {number[]} restDays - Days to skip
 * @returns {string} ISO date string of the last reading day
 */
export function calculateEndDate(startDate, totalChapters, restDays = []) {
  const d = new Date(startDate + 'T12:00:00Z');
  let readingDays = 0;

  while (readingDays < totalChapters) {
    const dow = d.getUTCDay();
    if (!restDays.includes(dow)) {
      readingDays++;
    }
    if (readingDays < totalChapters) {
      d.setUTCDate(d.getUTCDate() + 1);
    }
  }

  return d.toISOString().split('T')[0];
}

/**
 * Parse rest_days from DB (stored as JSON string) to array.
 */
export function parseRestDays(restDaysStr) {
  if (!restDaysStr) return [];
  try { return JSON.parse(restDaysStr); }
  catch { return []; }
}
