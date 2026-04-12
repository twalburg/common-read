import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groups, bible, reflections, reactions as reactionsApi, replies as repliesApi } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import { getReflectionQuestion, getCenteringPrompt } from '../lib/prompts.js';
import { BIBLE_BOOKS } from '../lib/books.js';
import { TRANSLATIONS, getSavedTranslation, saveTranslation } from '../lib/translations.js';
import ReactionBar from '../components/ReactionBar.jsx';
import ReplyThread from '../components/ReplyThread.jsx';

const FONT_SIZES = [
  { label: 'S', size: '1rem', lineHeight: '1.8' },
  { label: 'M', size: '1.2rem', lineHeight: '2' },
  { label: 'L', size: '1.4rem', lineHeight: '2.1' },
  { label: 'XL', size: '1.6rem', lineHeight: '2.2' },
];

function getSavedFontSize() {
  const saved = localStorage.getItem('cr_font_size');
  return saved ? parseInt(saved) : 1; // default M
}

function saveFontSize(index) {
  localStorage.setItem('cr_font_size', index.toString());
}

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [planComplete, setPlanComplete] = useState(false);
  const [viewingChapter, setViewingChapter] = useState(null);
  const [scripture, setScripture] = useState(null);
  const [chapterReflections, setChapterReflections] = useState([]);
  const [myReflection, setMyReflection] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scriptureLoading, setScriptureLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('read');
  const [showCopied, setShowCopied] = useState(false);
  const [centeringDismissed, setCenteringDismissed] = useState(false);
  const [stats, setStats] = useState(null);
  const [journal, setJournal] = useState(null);
  const [journalLoading, setJournalLoading] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [celebrationLoading, setCelebrationLoading] = useState(false);
  const [showNextBook, setShowNextBook] = useState(false);
  const [reactionsData, setReactionsData] = useState({});
  const [repliesData, setRepliesData] = useState({});
  const [translation, setTranslation] = useState(getSavedTranslation);
  const [fontSizeIdx, setFontSizeIdx] = useState(getSavedFontSize);

  function handleTranslationChange(code) { saveTranslation(code); setTranslation(code); }
  function handleFontSizeChange(idx) { saveFontSize(idx); setFontSizeIdx(idx); }

  const loadReactions = useCallback(async (refls) => {
    const ids = refls.map(r => r.id).filter(Boolean);
    if (!ids.length) { setReactionsData({}); return; }
    try { setReactionsData((await reactionsApi.getForReflections(ids)).reactions || {}); } catch {}
  }, []);

  const loadReplies = useCallback(async (refls) => {
    const ids = refls.map(r => r.id).filter(Boolean);
    if (!ids.length) { setRepliesData({}); return; }
    try { setRepliesData((await repliesApi.getForReflections(ids)).replies || {}); } catch {}
  }, []);

  useEffect(() => {
    groups.get(groupId).then(data => {
      setGroup(data.group); setMembers(data.members);
      setCurrentChapter(data.currentChapter); setPlanComplete(data.planComplete);
      setViewingChapter(data.currentChapter);
      if (data.planComplete) setTab('celebrate');
    }).catch(console.error).finally(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    if (tab !== 'celebrate' || !group || !planComplete || celebration) return;
    setCelebrationLoading(true);
    groups.celebration(groupId).then(setCelebration).catch(console.error).finally(() => setCelebrationLoading(false));
  }, [tab, group, planComplete, groupId, celebration]);

  useEffect(() => {
    if (!group || !viewingChapter) return;
    setCenteringDismissed(false); setScriptureLoading(true);
    bible.getChapter(group.book, viewingChapter, translation)
      .then(setScripture)
      .catch(() => setScripture({ content: '<p>Failed to load scripture.</p>', reference: '', copyright: '' }))
      .finally(() => setScriptureLoading(false));
  }, [group, viewingChapter, translation]);

  useEffect(() => {
    if (!group || !viewingChapter) return;
    reflections.get(groupId, viewingChapter).then(async data => {
      setChapterReflections(data.reflections);
      const mine = data.reflections.find(r => r.user_id === user.id);
      if (mine) { setMyReflection(mine.content); setHasSubmitted(true); }
      else { setMyReflection(''); setHasSubmitted(false); }
      await Promise.all([loadReactions(data.reflections), loadReplies(data.reflections)]);
    }).catch(console.error);
  }, [group, viewingChapter, groupId, user.id, loadReactions, loadReplies]);

  useEffect(() => { if (tab === 'community' && group) groups.stats(groupId).then(setStats).catch(console.error); }, [tab, group, groupId]);
  useEffect(() => { if (tab === 'journal' && group) { setJournalLoading(true); groups.journal(groupId).then(setJournal).catch(console.error).finally(() => setJournalLoading(false)); } }, [tab, group, groupId]);

  async function submitReflection() {
    if (!myReflection.trim()) return; setSubmitting(true);
    try {
      await reflections.submit(groupId, viewingChapter, myReflection); setHasSubmitted(true);
      const data = await reflections.get(groupId, viewingChapter);
      setChapterReflections(data.reflections);
      await Promise.all([loadReactions(data.reflections), loadReplies(data.reflections)]);
    } catch {} finally { setSubmitting(false); }
  }

  function handleReactionChange() { loadReactions(chapterReflections); }
  function handleReplyAdded() { loadReplies(chapterReflections); }
  function copyInviteCode() { navigator.clipboard?.writeText(group.inviteCode); setShowCopied(true); setTimeout(() => setShowCopied(false), 2000); }

  if (loading) return <div className="loading">Loading...</div>;
  if (!group) return <div className="loading">Group not found</div>;

  const isToday = viewingChapter === currentChapter;
  const otherReflections = chapterReflections.filter(r => r.user_id !== user.id);
  const myReflectionData = chapterReflections.find(r => r.user_id === user.id);
  const centeringPrompt = getCenteringPrompt(viewingChapter);
  const reflectionQuestion = getReflectionQuestion(viewingChapter);
  const todayCompleted = chapterReflections.length;
  const currentFont = FONT_SIZES[fontSizeIdx];
  const translationsByLang = {};
  TRANSLATIONS.forEach(t => { if (!translationsByLang[t.language]) translationsByLang[t.language] = []; translationsByLang[t.language].push(t); });

  return (
    <div>
      <button className="btn btn-secondary btn-small mb-16" onClick={() => navigate('/')}>← Groups</button>
      <div className="mb-16">
        <h2 style={{ margin: 0 }}>{group.name}</h2>
        <div className="text-small text-muted">{group.bookLabel} · {planComplete ? 'Completed' : 'Chapter a day'}</div>
      </div>

      {tab !== 'celebrate' && (<>
        <div className="chapter-nav">
          <button className="btn btn-secondary btn-small" onClick={() => setViewingChapter(Math.max(1, viewingChapter - 1))} disabled={viewingChapter <= 1}>← Prev</button>
          <div className="chapter-label">{group.bookLabel} {viewingChapter}{isToday && !planComplete && <span className="text-small text-muted" style={{ marginLeft: 8 }}>Today</span>}</div>
          <button className="btn btn-secondary btn-small" onClick={() => setViewingChapter(Math.min(group.totalChapters, viewingChapter + 1))} disabled={viewingChapter >= group.totalChapters}>Next →</button>
        </div>
        {isToday && !planComplete && members.length > 0 && (
          <div className="completion-bar mb-16"><div className="completion-text">{todayCompleted} of {members.length} reflected today</div><div className="completion-track"><div className="completion-fill" style={{ width: `${(todayCompleted / members.length) * 100}%` }} /></div></div>
        )}
      </>)}

      <div className="tabs">
        {planComplete && <button className={`tab ${tab === 'celebrate' ? 'active' : ''}`} onClick={() => setTab('celebrate')}>Complete</button>}
        <button className={`tab ${tab === 'read' ? 'active' : ''}`} onClick={() => setTab('read')}>Read</button>
        <button className={`tab ${tab === 'reflect' ? 'active' : ''}`} onClick={() => setTab('reflect')}>Reflect</button>
        <button className={`tab ${tab === 'journal' ? 'active' : ''}`} onClick={() => setTab('journal')}>Journal</button>
        <button className={`tab ${tab === 'community' ? 'active' : ''}`} onClick={() => setTab('community')}>Community</button>
      </div>

      {/* CELEBRATE */}
      {tab === 'celebrate' && (<div>
        {celebrationLoading ? <div className="loading">Loading...</div> : celebration ? (<>
          <div className="celebration-hero"><div className="celebration-emoji">🎉</div><h2 className="celebration-title">You finished {celebration.bookLabel}!</h2><p className="celebration-subtitle">{celebration.memberCount} {celebration.memberCount === 1 ? 'reader' : 'readers'} · {celebration.totalChapters} chapters · {formatDate(celebration.startDate)} – {formatDate(celebration.endDate)}</p></div>
          <div className="card"><div className="celebration-stats"><div className="celebration-stat"><div className="celebration-stat-value">{celebration.totalReflections}</div><div className="celebration-stat-label">Reflections shared</div></div><div className="celebration-stat"><div className="celebration-stat-value">{celebration.totalWords.toLocaleString()}</div><div className="celebration-stat-label">Words written</div></div></div></div>
          {(celebration.mvp || celebration.streakChamp) && (<div className="card"><h3 style={{ marginBottom: 16 }}>Highlights</h3>{celebration.mvp && <div className="celebration-highlight"><span className="celebration-highlight-icon">✍️</span><div><div className="celebration-highlight-title">Most Reflections</div><div className="celebration-highlight-detail">{celebration.mvp.displayName} — {celebration.mvp.totalReflections}</div></div></div>}{celebration.streakChamp && celebration.streakChamp.longestStreak > 1 && <div className="celebration-highlight"><span className="celebration-highlight-icon">🔥</span><div><div className="celebration-highlight-title">Longest Streak</div><div className="celebration-highlight-detail">{celebration.streakChamp.displayName} — {celebration.streakChamp.longestStreak} days</div></div></div>}</div>)}
          <div className="card"><h3 style={{ marginBottom: 16 }}>Everyone's Journey</h3>{celebration.members.map(m => (<div key={m.userId} className="stat-member"><div className="stat-member-name">{m.displayName}</div><div className="stat-details"><span className="stat-streak">{m.chaptersCompleted}/{celebration.totalChapters} ch</span><span className="stat-total">{m.wordCount.toLocaleString()} words</span></div><div className="progress-track mt-4"><div className="progress-fill" style={{ width: `${(m.chaptersCompleted / celebration.totalChapters) * 100}%` }} /></div></div>))}</div>
          <div className="card text-center"><p style={{ marginBottom: 16, color: 'var(--color-text-soft)' }}>Reflections saved in Journal. Ready for the next book?</p>{!showNextBook ? <button className="btn btn-primary" onClick={() => setShowNextBook(true)}>Start Next Book</button> : <NextBookPicker groupId={groupId} onCreated={id => navigate(`/group/${id}`)} onCancel={() => setShowNextBook(false)} />}</div>
        </>) : null}
      </div>)}

      {/* READ */}
      {tab === 'read' && (<div>
        {!centeringDismissed && !planComplete && (
          <div className="centering-card"><div className="centering-label">Before you read</div><h3 className="centering-title">{centeringPrompt.title}</h3><p className="centering-instruction">{centeringPrompt.instruction}</p><div className="centering-footer"><span className="centering-duration">{centeringPrompt.duration}</span><button className="btn btn-primary btn-small" onClick={() => setCenteringDismissed(true)}>I'm ready to read</button></div></div>
        )}
        {(centeringDismissed || planComplete) && (
          <div className="card">
            {/* Translation picker + font size */}
            <div className="scripture-controls">
              <select value={translation} onChange={e => handleTranslationChange(e.target.value)} className="translation-select">
                {Object.entries(translationsByLang).map(([lang, ts]) => (
                  <optgroup key={lang} label={lang}>{ts.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}</optgroup>
                ))}
              </select>
              <div className="font-size-control">
                {FONT_SIZES.map((f, i) => (
                  <button key={f.label} className={`font-size-btn ${i === fontSizeIdx ? 'font-size-btn-active' : ''}`} onClick={() => handleFontSizeChange(i)} title={`Font size ${f.label}`}>
                    <span style={{ fontSize: i === 0 ? '0.7rem' : i === 1 ? '0.8rem' : i === 2 ? '0.9rem' : '1rem' }}>A</span>
                  </button>
                ))}
              </div>
            </div>

            {scriptureLoading ? <div className="loading">Loading scripture...</div> : scripture ? (<>
              <div className="text-small text-muted mb-16">{scripture.reference}</div>
              <div className="scripture-content" style={{ fontSize: currentFont.size, lineHeight: currentFont.lineHeight }} dangerouslySetInnerHTML={{ __html: scripture.content }} />
              {scripture.copyright && <div className="scripture-copyright">{scripture.copyright}</div>}
            </>) : null}
          </div>
        )}
      </div>)}

      {/* REFLECT */}
      {tab === 'reflect' && (<div>
        <div className="question-card"><div className="question-label">Today's Question</div><p className="question-text">{reflectionQuestion}</p></div>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Your Reflection</h3>
          <div className="form-group" style={{ margin: 0 }}><textarea value={myReflection} onChange={e => setMyReflection(e.target.value)} placeholder="Write your thoughts here..." rows={5} /></div>
          <div className="mt-8" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>{hasSubmitted && <span className="text-small success-msg">Saved</span>}<button className="btn btn-primary btn-small" onClick={submitReflection} disabled={submitting || !myReflection.trim()}>{submitting ? 'Saving...' : hasSubmitted ? 'Update' : 'Share'}</button></div>
          {myReflectionData && (<><ReactionBar reflectionId={myReflectionData.id} reactionsData={reactionsData[myReflectionData.id]} userId={user.id} onReactionChange={handleReactionChange} /><ReplyThread reflectionId={myReflectionData.id} repliesData={repliesData[myReflectionData.id]} onReplyAdded={handleReplyAdded} /></>)}
        </div>
        {otherReflections.length > 0 ? (<><h3 className="mt-24 mb-16">From the Group</h3>{otherReflections.map(r => (<div key={r.id} className="reflection-card"><div className="author">{r.display_name}<span className="timestamp">{new Date(r.created_at + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></div><div className="body">{r.content}</div><ReactionBar reflectionId={r.id} reactionsData={reactionsData[r.id]} userId={user.id} onReactionChange={handleReactionChange} /><ReplyThread reflectionId={r.id} repliesData={repliesData[r.id]} onReplyAdded={handleReplyAdded} /></div>))}</>) : <div className="text-center text-muted mt-24 text-small">No reflections from the group yet.</div>}
      </div>)}

      {/* JOURNAL */}
      {tab === 'journal' && (<div>
        {journalLoading ? <div className="loading">Loading journal...</div> : journal?.entries.length > 0 ? (<><p className="text-small text-muted mb-24">{planComplete ? `Your group's journey through ${journal.bookLabel}.` : `Scroll through your journey through ${journal.bookLabel}.`}</p>{journal.entries.map(entry => (<div key={entry.chapter} className="journal-entry"><div className="journal-header"><span className="journal-chapter">{entry.label}</span><span className="journal-date">{new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>{entry.reflections.length > 0 ? <div className="journal-reflections">{entry.reflections.map((r, i) => <div key={i} className="journal-reflection"><span className="journal-author">{r.displayName}:</span> <span className="journal-content">{r.content}</span></div>)}</div> : <div className="journal-empty">No reflections</div>}</div>))}</>) : <div className="text-center text-muted mt-24 text-small">Your journal will fill up as the group reads and reflects together.</div>}
      </div>)}

      {/* COMMUNITY */}
      {tab === 'community' && (<div>
        {stats ? (<div className="card mb-24"><h3 style={{ marginBottom: 16 }}>Reading Progress</h3><div className="mb-16"><div className="text-small text-muted" style={{ marginBottom: 4 }}>Group Progress</div><div>{stats.currentChapter} of {stats.totalChapters} chapters</div><div className="progress-track mt-8"><div className="progress-fill" style={{ width: `${(stats.currentChapter / stats.totalChapters) * 100}%` }} /></div></div><hr className="divider" /><div className="stats-grid">{stats.members.map(m => (<div key={m.userId} className="stat-member"><div className="stat-member-name">{m.displayName}{m.completedToday && <span className="stat-check">✓</span>}</div><div className="stat-details"><span className="stat-streak">{m.currentStreak > 0 ? `${m.currentStreak} day streak` : 'No streak'}</span><span className="stat-total">{m.totalReflections}/{stats.currentChapter} ch</span></div><div className="progress-track mt-4"><div className="progress-fill" style={{ width: `${(m.totalReflections / Math.max(stats.currentChapter, 1)) * 100}%` }} /></div></div>))}</div></div>) : <div className="loading">Loading...</div>}
        <div className="card"><h3 style={{ marginBottom: 16 }}>Group Info</h3><div className="mb-16"><div className="text-small text-muted" style={{ marginBottom: 4 }}>Reading Plan</div><div>{group.bookLabel} — {group.totalChapters} ch starting {new Date(group.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div></div><div className="mb-16"><div className="text-small text-muted" style={{ marginBottom: 4 }}>Members ({members.length})</div><div>{members.map(m => m.display_name).join(', ')}</div></div><hr className="divider" /><div className="text-small text-muted" style={{ marginBottom: 8 }}>Invite Code</div><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span className="invite-code" onClick={copyInviteCode}>{group.inviteCode}</span>{showCopied && <span className="text-small success-msg">Copied!</span>}</div><div className="text-small text-muted mt-8">Share this code to invite friends</div></div>
      </div>)}
    </div>
  );
}

function formatDate(s) { return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

function NextBookPicker({ groupId, onCreated, onCancel }) {
  const [bookId, setBookId] = useState('JHN');
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selectedBook = BIBLE_BOOKS.find(b => b.id === bookId);
  async function handleStart(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try { onCreated((await groups.startNextBook(groupId, { book: bookId, bookLabel: selectedBook.label, totalChapters: selectedBook.chapters, startDate })).newGroupId); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  return (<div style={{ textAlign: 'left' }}><form onSubmit={handleStart}><div className="form-group"><label>Next Book</label><select value={bookId} onChange={e => setBookId(e.target.value)}>{BIBLE_BOOKS.map(b => <option key={b.id} value={b.id}>{b.label} ({b.chapters} ch)</option>)}</select></div><div className="form-group"><label>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></div><div className="text-small text-muted mb-16">{selectedBook.label} — {selectedBook.chapters} days.</div>{error && <div className="error-msg mb-16">{error}</div>}<div style={{ display: 'flex', gap: 8 }}><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>{loading ? '...' : `Start ${selectedBook.label}`}</button></div></form></div>);
}
