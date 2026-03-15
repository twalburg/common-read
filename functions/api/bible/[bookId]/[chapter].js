import { getUser, json, unauthorized } from '../../../lib/auth.js';

// Book ID to Bolls Bible book number mapping
const BOOK_NUMBERS = {
  GEN: 1, EXO: 2, LEV: 3, NUM: 4, DEU: 5, JOS: 6, JDG: 7, RUT: 8,
  '1SA': 9, '2SA': 10, '1KI': 11, '2KI': 12, '1CH': 13, '2CH': 14,
  EZR: 15, NEH: 16, EST: 17, JOB: 18, PSA: 19, PRO: 20, ECC: 21,
  SNG: 22, ISA: 23, JER: 24, LAM: 25, EZK: 26, DAN: 27, HOS: 28,
  JOL: 29, AMO: 30, OBA: 31, JON: 32, MIC: 33, NAM: 34, HAB: 35,
  ZEP: 36, HAG: 37, ZEC: 38, MAL: 39, MAT: 40, MRK: 41, LUK: 42,
  JHN: 43, ACT: 44, ROM: 45, '1CO': 46, '2CO': 47, GAL: 48, EPH: 49,
  PHP: 50, COL: 51, '1TH': 52, '2TH': 53, '1TI': 54, '2TI': 55,
  TIT: 56, PHM: 57, HEB: 58, JAS: 59, '1PE': 60, '2PE': 61,
  '1JN': 62, '2JN': 63, '3JN': 64, JUD: 65, REV: 66,
};

// GET /api/bible/:bookId/:chapter — fetch BSB text from Bolls Bible API
export async function onRequestGet({ params, request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { bookId, chapter } = params;
  if (!bookId || !chapter) return json({ error: 'bookId and chapter required' }, 400);

  const bookNum = BOOK_NUMBERS[bookId.toUpperCase()];
  if (!bookNum) return json({ error: `Unknown book: ${bookId}` }, 400);

  try {
    const response = await fetch(
      `https://bolls.life/get-chapter/BSB/${bookNum}/${chapter}/`
    );

    if (!response.ok) {
      return json({ error: 'Bible API error', status: response.status }, 502);
    }

    const verses = await response.json();

    // Convert verse array to HTML for display
    const html = verses
      .map(v => `<span class="v">${v.verse}</span> ${v.text}`)
      .join(' ');

    const content = `<p>${html}</p>`;

    return json({
      reference: `${bookId} ${chapter} (BSB)`,
      content,
      copyright: 'Berean Standard Bible · Public Domain · berean.bible',
    });
  } catch (err) {
    return json({ error: 'Failed to fetch scripture', detail: err.message }, 500);
  }
}
