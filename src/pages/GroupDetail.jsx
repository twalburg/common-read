import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groups, bible, reflections } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import { getReflectionQuestion, getCenteringPrompt } from '../lib/prompts.js';

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(1);
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

  // Load group data
  useEffect(() => {
    async function load() {
      try {
        const data = await groups.get(groupId);
        setGroup(data.group);
        setMembers(data.members);
        setCurrentChapter(data.currentChapter);
        setViewingChapter(data.currentChapter);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId]);

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

  return (
    <div>
      <button className="btn btn-secondary btn-small mb-16" onClick={() => navigate('/')}>
        ← Groups
      </button>

      {/* Group title + chapter nav */}
      <div className="mb-16">
        <h2 style={{ margin: 0 }}>{group.name}</h2>
        <div className="text-small text-muted">{group.bookLabel} · Chapter a day</div>
      </div>

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
          {isToday && <span className="text-small text-muted" style={{ marginLeft: 8 }}>Today</span>}
        </div>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => setViewingChapter(Math.min(group.totalChapters, viewingChapter + 1))}
          disabled={viewingChapter >= currentChapter}
        >
          Next →
        </button>
      </div>

      {/* Today's completion indicator */}
      {isToday && members.length > 0 && (
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

      {/* Tabs */}
      <div className="tabs">
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

      {/* ==================== READ TAB ==================== */}
      {tab === 'read' && (
        <div>
          {/* Centering prompt — shown before reading */}
          {!centeringDismissed && (
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

          {/* Scripture */}
          {centeringDismissed && (
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
          {/* Daily reflection question */}
          <div className="question-card">
            <div className="question-label">Today's Question</div>
            <p className="question-text">{reflectionQuestion}</p>
          </div>

          {/* Your reflection */}
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

          {/* Others' reflections */}
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
                Scroll through your group's journey through {journal.bookLabel}.
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
          {/* Streak / completion stats */}
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

          {/* Group info */}
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
