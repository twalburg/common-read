import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groups, bible, reflections } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import { getReflectionQuestion, getCenteringPrompt } from '../lib/prompts.js';
import { BIBLE_BOOKS } from '../lib/books.js';

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

  // Stats
  const [stats, setStats] = useState(null);

  // Journal
  const [journal, setJournal] = useState(null);
  const [journalLoading, setJournalLoading] = useState(false);

  // Celebration
  const [celebration, setCelebration] = useState(null);
  const [celebrationLoading, setCelebrationLoading] = useState(false);
  const [showNextBook, setShowNextBook] = useState(false);

  // Load group data
  useEffect(() => {
    async function load() {
      try {
        const data = await groups.get(groupId);
        setGroup(data.group);
        setMembers(data.members);
        setCurrentChapter(data.currentChapter);
        setPlanComplete(data.planComplete);
        setViewingChapter(data.currentChapter);
        if (data.planComplete) {
          setTab('celebrate');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId]);

  // Load celebration data
  useEffect(() => {
    if (tab !== 'celebrate' || !group || !planComplete) return;
    if (celebration) return; // already loaded
    setCelebrationLoading(true);
    async function loadCelebration() {
      try {
        const data = await groups.celebration(groupId);
        setCelebration(data);
      } catch (err) {
        console.error('Failed to load celebration:', err);
      } finally {
        setCelebrationLoading(false);
      }
    }
    loadCelebration();
  }, [tab, group, planComplete, groupId, celebration]);

  // Load scripture when viewing chapter changes
  useEffect(() => {
    if (!group || !viewingChapter) return;
    setCenteringDismissed(false);
    async function loadScripture() {
      setScriptureLoading(true);
      try {
        const data = await bible.getChapter(group.book, viewingChapter);
        setScripture(data);
      } catch (err) {
        console.error('Failed to load scripture:', err);
        setScripture({ content: '<p>Failed to load scripture. Please try again.</p>', reference: '', copyright: '' });
      } finally {
        setScriptureLoading(false);
      }
    }
    loadScripture();
  }, [group, viewingChapter]);

  // Load reflections when viewing chapter changes
  useEffect(() => {
    if (!group || !viewingChapter) return;
    async function loadReflections() {
      try {
        const data = await reflections.get(groupId, viewingChapter);
        setChapterReflections(data.reflections);
        const mine = data.reflections.find(r => r.user_id === user.id);
        if (mine) {
          setMyReflection(mine.content);
          setHasSubmitted(true);
        } else {
          setMyReflection('');
          setHasSubmitted(false);
        }
      } catch (err) {
        console.error('Failed to load reflections:', err);
      }
    }
    loadReflections();
  }, [group, viewingChapter, groupId, user.id]);

  // Load stats when community tab is selected
  useEffect(() => {
    if (tab !== 'community' || !group) return;
    async function loadStats() {
      try {
        const data = await groups.stats(groupId);
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }
    loadStats();
  }, [tab, group, groupId]);

  // Load journal when journal tab is selected
  useEffect(() => {
    if (tab !== 'journal' || !group) return;
    setJournalLoading(true);
    async function loadJournal() {
      try {
        const data = await groups.journal(groupId);
        setJournal(data);
      } catch (err) {
        console.error('Failed to load journal:', err);
      } finally {
        setJournalLoading(false);
      }
    }
    loadJournal();
  }, [tab, group, groupId]);

  async function submitReflection() {
    if (!myReflection.trim()) return;
    setSubmitting(true);
    try {
      await reflections.submit(groupId, viewingChapter, myReflection);
      setHasSubmitted(true);
      const data = await reflections.get(groupId, viewingChapter);
      setChapterReflections(data.reflections);
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setSubmitting(false);
    }
  }

  function copyInviteCode() {
    navigator.clipboard?.writeText(group.inviteCode);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (!group) return <div className="loading">Group not found</div>;

  const isToday = viewingChapter === currentChapter;
  const otherReflections = chapterReflections.filter(r => r.user_id !== user.id);
  const centeringPrompt = getCenteringPrompt(viewingChapter);
  const reflectionQuestion = getReflectionQuestion(viewingChapter);
  const todayCompleted = chapterReflections.length;
  const isCreator = group.createdBy === user.id;

  return (
    <div>
      <button className="btn btn-secondary btn-small mb-16" onClick={() => navigate('/')}>
        ← Groups
      </button>

      {/* Group title + chapter nav */}
      <div className="mb-16">
        <h2 style={{ margin: 0 }}>{group.name}</h2>
        <div className="text-small text-muted">
          {group.bookLabel} · {planComplete ? 'Completed' : 'Chapter a day'}
        </div>
      </div>

      {/* Chapter nav — hide on celebrate tab */}
      {tab !== 'celebrate' && (
        <>
          <div className="chapter-nav">
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setViewingChapter(Math.max(1, viewingChapter - 1))}
              disabled={viewingChapter <= 1}
            >
              ← Prev
            </button>
            <div className="chapter-label">
              {group.bookLabel} {viewingChapter}
              {isToday && !planComplete && <span className="text-small text-muted" style={{ marginLeft: 8 }}>Today</span>}
            </div>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setViewingChapter(Math.min(group.totalChapters, viewingChapter + 1))}
              disabled={viewingChapter >= group.totalChapters}
            >
              Next →
            </button>
          </div>

          {/* Today's completion indicator */}
          {isToday && !planComplete && members.length > 0 && (
            <div className="completion-bar mb-16">
              <div className="completion-text">
                {todayCompleted} of {members.length} reflected today
              </div>
              <div className="completion-track">
                <div
                  className="completion-fill"
                  style={{ width: `${(todayCompleted / members.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Tabs */}
      <div className="tabs">
        {planComplete && (
          <button className={`tab ${tab === 'celebrate' ? 'active' : ''}`} onClick={() => setTab('celebrate')}>
            Complete
          </button>
        )}
        <button className={`tab ${tab === 'read' ? 'active' : ''}`} onClick={() => setTab('read')}>
          Read
        </button>
        <button className={`tab ${tab === 'reflect' ? 'active' : ''}`} onClick={() => setTab('reflect')}>
          Reflect
        </button>
        <button className={`tab ${tab === 'journal' ? 'active' : ''}`} onClick={() => setTab('journal')}>
          Journal
        </button>
        <button className={`tab ${tab === 'community' ? 'active' : ''}`} onClick={() => setTab('community')}>
          Community
        </button>
      </div>

      {/* ==================== CELEBRATE TAB ==================== */}
      {tab === 'celebrate' && (
        <div>
          {celebrationLoading ? (
            <div className="loading">Loading celebration...</div>
          ) : celebration ? (
            <>
              {/* Hero celebration card */}
              <div className="celebration-hero">
                <div className="celebration-emoji">🎉</div>
                <h2 className="celebration-title">You finished {celebration.bookLabel}!</h2>
                <p className="celebration-subtitle">
                  {celebration.memberCount} {celebration.memberCount === 1 ? 'reader' : 'readers'} · {celebration.totalChapters} chapters · {formatDate(celebration.startDate)} – {formatDate(celebration.endDate)}
                </p>
              </div>

              {/* Group stats */}
              <div className="card">
                <div className="celebration-stats">
                  <div className="celebration-stat">
                    <div className="celebration-stat-value">{celebration.totalReflections}</div>
                    <div className="celebration-stat-label">Reflections shared</div>
                  </div>
                  <div className="celebration-stat">
                    <div className="celebration-stat-value">{celebration.totalWords.toLocaleString()}</div>
                    <div className="celebration-stat-label">Words written</div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              {(celebration.mvp || celebration.streakChamp) && (
                <div className="card">
                  <h3 style={{ marginBottom: 16 }}>Highlights</h3>
                  {celebration.mvp && (
                    <div className="celebration-highlight">
                      <span className="celebration-highlight-icon">✍️</span>
                      <div>
                        <div className="celebration-highlight-title">Most Reflections</div>
                        <div className="celebration-highlight-detail">
                          {celebration.mvp.displayName} — {celebration.mvp.totalReflections} reflections
                        </div>
                      </div>
                    </div>
                  )}
                  {celebration.streakChamp && celebration.streakChamp.longestStreak > 1 && (
                    <div className="celebration-highlight">
                      <span className="celebration-highlight-icon">🔥</span>
                      <div>
                        <div className="celebration-highlight-title">Longest Streak</div>
                        <div className="celebration-highlight-detail">
                          {celebration.streakChamp.displayName} — {celebration.streakChamp.longestStreak} days
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Member breakdown */}
              <div className="card">
                <h3 style={{ marginBottom: 16 }}>Everyone's Journey</h3>
                {celebration.members.map(m => (
                  <div key={m.userId} className="stat-member">
                    <div className="stat-member-name">{m.displayName}</div>
                    <div className="stat-details">
                      <span className="stat-streak">
                        {m.chaptersCompleted} of {celebration.totalChapters} chapters
                      </span>
                      <span className="stat-total">
                        {m.wordCount.toLocaleString()} words
                      </span>
                    </div>
                    <div className="progress-track mt-4">
                      <div
                        className="progress-fill"
                        style={{ width: `${(m.chaptersCompleted / celebration.totalChapters) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Next book CTA */}
              <div className="card text-center">
                <p style={{ marginBottom: 16, color: 'var(--color-text-soft)' }}>
                  Your group's reflections are saved in the Journal tab. Ready for the next book?
                </p>
                {!showNextBook ? (
                  <button className="btn btn-primary" onClick={() => setShowNextBook(true)}>
                    Start Next Book
                  </button>
                ) : (
                  <NextBookPicker
                    groupId={groupId}
                    onCreated={(newId) => navigate(`/group/${newId}`)}
                    onCancel={() => setShowNextBook(false)}
                  />
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ==================== READ TAB ==================== */}
      {tab === 'read' && (
        <div>
          {!centeringDismissed && !planComplete && (
            <div className="centering-card">
              <div className="centering-label">Before you read</div>
              <h3 className="centering-title">{centeringPrompt.title}</h3>
              <p className="centering-instruction">{centeringPrompt.instruction}</p>
              <div className="centering-footer">
                <span className="centering-duration">{centeringPrompt.duration}</span>
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => setCenteringDismissed(true)}
                >
                  I'm ready to read
                </button>
              </div>
            </div>
          )}

          {(centeringDismissed || planComplete) && (
            <div className="card">
              {scriptureLoading ? (
                <div className="loading">Loading scripture...</div>
              ) : scripture ? (
                <>
                  <div className="text-small text-muted mb-16">{scripture.reference}</div>
                  <div
                    className="scripture-content"
                    dangerouslySetInnerHTML={{ __html: scripture.content }}
                  />
                  {scripture.copyright && (
                    <div className="scripture-copyright">{scripture.copyright}</div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* ==================== REFLECT TAB ==================== */}
      {tab === 'reflect' && (
        <div>
          <div className="question-card">
            <div className="question-label">Today's Question</div>
            <p className="question-text">{reflectionQuestion}</p>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Your Reflection</h3>
            <div className="form-group" style={{ margin: 0 }}>
              <textarea
                value={myReflection}
                onChange={e => setMyReflection(e.target.value)}
                placeholder="Write your thoughts here..."
                rows={5}
              />
            </div>
            <div className="mt-8" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
              {hasSubmitted && <span className="text-small success-msg">Saved</span>}
              <button
                className="btn btn-primary btn-small"
                onClick={submitReflection}
                disabled={submitting || !myReflection.trim()}
              >
                {submitting ? 'Saving...' : hasSubmitted ? 'Update' : 'Share'}
              </button>
            </div>
          </div>

          {otherReflections.length > 0 ? (
            <>
              <h3 className="mt-24 mb-16">From the Group</h3>
              {otherReflections.map(r => (
                <div key={r.id} className="reflection-card">
                  <div className="author">
                    {r.display_name}
                    <span className="timestamp">
                      {new Date(r.created_at + 'Z').toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="body">{r.content}</div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center text-muted mt-24 text-small">
              No reflections from the group yet for this chapter.
            </div>
          )}
        </div>
      )}

      {/* ==================== JOURNAL TAB ==================== */}
      {tab === 'journal' && (
        <div>
          {journalLoading ? (
            <div className="loading">Loading journal...</div>
          ) : journal && journal.entries.length > 0 ? (
            <>
              <p className="text-small text-muted mb-24">
                {planComplete ? `Your group's journey through ${journal.bookLabel}.` : `Scroll through your group's journey through ${journal.bookLabel}.`}
              </p>
              {journal.entries.map(entry => (
                <div key={entry.chapter} className="journal-entry">
                  <div className="journal-header">
                    <span className="journal-chapter">{entry.label}</span>
                    <span className="journal-date">
                      {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric'
                      })}
                    </span>
                  </div>
                  {entry.reflections.length > 0 ? (
                    <div className="journal-reflections">
                      {entry.reflections.map((r, i) => (
                        <div key={i} className="journal-reflection">
                          <span className="journal-author">{r.displayName}:</span>{' '}
                          <span className="journal-content">{r.content}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="journal-empty">No reflections</div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="text-center text-muted mt-24 text-small">
              Your journal will fill up as the group reads and reflects together.
            </div>
          )}
        </div>
      )}

      {/* ==================== COMMUNITY TAB ==================== */}
      {tab === 'community' && (
        <div>
          {stats ? (
            <div className="card mb-24">
              <h3 style={{ marginBottom: 16 }}>Reading Progress</h3>
              <div className="mb-16">
                <div className="text-small text-muted" style={{ marginBottom: 4 }}>Group Progress</div>
                <div>{stats.currentChapter} of {stats.totalChapters} chapters</div>
                <div className="progress-track mt-8">
                  <div
                    className="progress-fill"
                    style={{ width: `${(stats.currentChapter / stats.totalChapters) * 100}%` }}
                  />
                </div>
              </div>
              <hr className="divider" />
              <div className="stats-grid">
                {stats.members.map(m => (
                  <div key={m.userId} className="stat-member">
                    <div className="stat-member-name">
                      {m.displayName}
                      {m.completedToday && <span className="stat-check" title="Reflected today">✓</span>}
                    </div>
                    <div className="stat-details">
                      <span className="stat-streak" title="Current streak">
                        {m.currentStreak > 0 ? `${m.currentStreak} day streak` : 'No streak'}
                      </span>
                      <span className="stat-total">
                        {m.totalReflections} / {stats.currentChapter} chapters
                      </span>
                    </div>
                    <div className="progress-track mt-4">
                      <div
                        className="progress-fill"
                        style={{ width: `${(m.totalReflections / Math.max(stats.currentChapter, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="loading">Loading stats...</div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Group Info</h3>
            <div className="mb-16">
              <div className="text-small text-muted" style={{ marginBottom: 4 }}>Reading Plan</div>
              <div>{group.bookLabel} — {group.totalChapters} chapters starting {
                new Date(group.startDate + 'T12:00:00').toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })
              }</div>
            </div>
            <div className="mb-16">
              <div className="text-small text-muted" style={{ marginBottom: 4 }}>Members ({members.length})</div>
              <div>{members.map(m => m.display_name).join(', ')}</div>
            </div>
            <hr className="divider" />
            <div className="text-small text-muted" style={{ marginBottom: 8 }}>Invite Code</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="invite-code" onClick={copyInviteCode}>{group.inviteCode}</span>
              {showCopied && <span className="text-small success-msg">Copied!</span>}
            </div>
            <div className="text-small text-muted mt-8">Share this code to invite friends</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper
function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

// Next Book Picker component
function NextBookPicker({ groupId, onCreated, onCancel }) {
  const [bookId, setBookId] = useState('JHN');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default to tomorrow
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedBook = BIBLE_BOOKS.find(b => b.id === bookId);

  async function handleStart(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await groups.startNextBook(groupId, {
        book: bookId,
        bookLabel: selectedBook.label,
        totalChapters: selectedBook.chapters,
        startDate,
      });
      onCreated(data.newGroupId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ textAlign: 'left' }}>
      <form onSubmit={handleStart}>
        <div className="form-group">
          <label>Next Book</label>
          <select value={bookId} onChange={e => setBookId(e.target.value)}>
            {BIBLE_BOOKS.map(b => (
              <option key={b.id} value={b.id}>
                {b.label} ({b.chapters} chapters)
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div className="text-small text-muted mb-16">
          {selectedBook.label} will take {selectedBook.chapters} days.
        </div>
        {error && <div className="error-msg mb-16">{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Creating...' : `Start ${selectedBook.label}`}
          </button>
        </div>
      </form>
    </div>
  );
}
