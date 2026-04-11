import { getUser, json, unauthorized } from '../../../lib/auth.js';

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

// Allowed translations — prevents arbitrary API calls
const ALLOWED_TRANSLATIONS = new Set([
  'BSB', 'NIV', 'NIV2011', 'ESV', 'KJV', 'NKJV', 'NLT', 'NASB', 'CSB17',
  'MSG', 'AMP', 'NVI', 'NTV', 'RV1960', 'LBLA', 'LSB', 'MEV', 'CEB',
  'NET', 'WEB', 'RSV', 'TLV', 'CJB',
]);

const TRANSLATION_LABELS = {
  BSB: 'Berean Standard Bible', NIV: 'NIV (1984)', NIV2011: 'NIV (2011)',
  ESV: 'ESV', KJV: 'KJV', NKJV: 'NKJV', NLT: 'NLT', NASB: 'NASB (1995)',
  CSB17: 'CSB', MSG: 'The Message', AMP: 'Amplified', NVI: 'NVI (Español)',
  NTV: 'NTV (Español)', RV1960: 'Reina-Valera 1960', LBLA: 'LBLA (Español)',
  LSB: 'Legacy Standard Bible', MEV: 'MEV', CEB: 'Common English Bible',
  NET: 'NET', WEB: 'World English Bible', RSV: 'RSV', TLV: 'Tree of Life',
  CJB: 'Complete Jewish Bible',
};

const COPYRIGHT_NOTICES = {
  BSB: 'Berean Standard Bible · Public Domain · berean.bible',
  NIV: 'Holy Bible, New International Version®, NIV® Copyright ©1973, 1978, 1984 by Biblica, Inc.®',
  NIV2011: 'Holy Bible, New International Version®, NIV® Copyright ©1973, 1978, 1984, 2011 by Biblica, Inc.®',
  ESV: 'ESV® Bible, copyright © 2001 by Crossway',
  KJV: 'King James Version · Public Domain',
  NKJV: 'New King James Version®. Copyright © 1982 by Thomas Nelson',
  NLT: 'Holy Bible, New Living Translation, copyright © 1996, 2004, 2015 by Tyndale House Foundation',
  NASB: 'New American Standard Bible®, Copyright © 1960, 1995 by The Lockman Foundation',
  CSB17: 'Christian Standard Bible®, Copyright © 2017 by Holman Bible Publishers',
  MSG: 'The Message, Copyright © 1993, 2002, 2018 by Eugene H. Peterson',
  AMP: 'Amplified® Bible, Copyright © 2015 by The Lockman Foundation',
  NVI: 'Nueva Versión Internacional® NVI® Copyright © 1999, 2015 by Biblica, Inc.®',
  NTV: 'Nueva Traducción Viviente, © 2009 Tyndale House Foundation',
  RV1960: 'Reina-Valera 1960 ® © Sociedades Bíblicas en América Latina, 1960',
  LBLA: 'La Biblia de las Américas © Copyright 1986, 1995, 1997 by The Lockman Foundation',
};

// GET /api/bible/:bookId/:chapter?translation=BSB
export async function onRequestGet({ params, request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { bookId, chapter } = params;
  if (!bookId || !chapter) return json({ error: 'bookId and chapter required' }, 400);

  const url = new URL(request.url);
  const translation = url.searchParams.get('translation') || 'BSB';

  if (!ALLOWED_TRANSLATIONS.has(translation)) {
    return json({ error: `Translation "${translation}" is not available` }, 400);
  }

  const bookNum = BOOK_NUMBERS[bookId.toUpperCase()];
  if (!bookNum) return json({ error: `Unknown book: ${bookId}` }, 400);

  try {
    const response = await fetch(
      `https://bolls.life/get-chapter/${translation}/${bookNum}/${chapter}/`
    );

    if (!response.ok) {
      return json({ error: 'Bible API error', status: response.status }, 502);
    }

    const verses = await response.json();
    const html = verses.map(v => `<span class="v">${v.verse}</span> ${v.text}`).join(' ');

    const label = TRANSLATION_LABELS[translation] || translation;
    const copyright = COPYRIGHT_NOTICES[translation] || `${label} · via bolls.life`;

    return json({
      reference: `${bookId} ${chapter} (${label})`,
      content: `<p>${html}</p>`,
      copyright,
      translation,
    });
  } catch (err) {
    return json({ error: 'Failed to fetch scripture', detail: err.message }, 500);
  }
}
