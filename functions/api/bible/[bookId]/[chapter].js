import { getUser, json, unauthorized } from '../../../lib/auth.js';

// GET /api/bible/:bookId/:chapter — proxy to API.Bible for NIV text
// API.Bible NIV Bible ID: 06125adad2d5898a-01
const NIV_BIBLE_ID = '06125adad2d5898a-01';

export async function onRequestGet({ params, request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { bookId, chapter } = params;
  if (!bookId || !chapter) return json({ error: 'bookId and chapter required' }, 400);

  const chapterId = `${bookId}.${chapter}`;

  try {
    const response = await fetch(
      `https://api.scripture.api.bible/v1/bibles/${NIV_BIBLE_ID}/chapters/${chapterId}?content-type=html&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true`,
      {
        headers: {
          'api-key': env.BIBLE_API_KEY,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return json({ error: 'Bible API error', status: response.status, detail: errorText }, 502);
    }

    const data = await response.json();
    const chapterData = data.data;

    return json({
      reference: chapterData.reference,
      content: chapterData.content,       // HTML content
      copyright: chapterData.copyright,   // NIV copyright notice (must display)
    });
  } catch (err) {
    return json({ error: 'Failed to fetch scripture', detail: err.message }, 500);
  }
}
