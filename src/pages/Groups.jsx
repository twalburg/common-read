import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groups } from '../lib/api.js';
import { BIBLE_BOOKS } from '../lib/books.js';

export default function Groups() {
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const navigate = useNavigate();

  useEffect(() => { loadGroups(); }, []);

  async function loadGroups() {
    try {
      const data = await groups.list();
      setMyGroups(data.groups);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading your groups...</div>;

  if (view === 'create') return <CreateGroup onBack={() => setView('list')} onCreated={() => { setView('list'); loadGroups(); }} />;
  if (view === 'join') return <JoinGroup onBack={() => setView('list')} onJoined={() => { setView('list'); loadGroups(); }} />;

  return (
    <div>
      <div className="flex-between mb-24">
        <h2 style={{ margin: 0 }}>Your Groups</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-small" onClick={() => setView('join')}>Join</button>
          <button className="btn btn-primary btn-small" onClick={() => setView('create')}>New Group</button>
        </div>
      </div>

      {myGroups.length === 0 ? (
        <div className="card text-center">
          <p className="text-muted" style={{ marginBottom: 16 }}>
            You haven't joined any groups yet.
          </p>
          <p className="text-small text-muted">
            Create a new group to start a reading plan, or join one with an invite code.
          </p>
        </div>
      ) : (
        myGroups.map(g => (
          <div key={g.id} className="group-item" onClick={() => navigate(`/group/${g.id}`)}>
            <div>
              <div className="group-name">{g.name}</div>
              <div className="group-book">{g.book_label}</div>
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>→</div>
          </div>
        ))
      )}
    </div>
  );
}

function CreateGroup({ onBack, onCreated }) {
  const [name, setName] = useState('');
  const [bookId, setBookId] = useState('JHN');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const selectedBook = BIBLE_BOOKS.find(b => b.id === bookId);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await groups.create({
        name,
        book: bookId,
        bookLabel: selectedBook.label,
        totalChapters: selectedBook.chapters,
        startDate,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="card text-center">
        <h2>Group Created</h2>
        <p className="mt-16">Share this invite code with your group:</p>
        <div className="mt-16 mb-16">
          <span
            className="invite-code"
            onClick={() => navigator.clipboard?.writeText(result.inviteCode)}
            title="Click to copy"
          >
            {result.inviteCode}
          </span>
        </div>
        <p className="text-small text-muted">Click the code to copy it</p>
        <div className="mt-24">
          <button className="btn btn-primary" onClick={onCreated}>Go to Groups</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-secondary btn-small mb-24" onClick={onBack}>← Back</button>
      <div className="card">
        <h2>Create a Group</h2>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='e.g. "Morning Coffee Crew"'
              required
            />
          </div>
          <div className="form-group">
            <label>Book of the Bible</label>
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
            Reading {selectedBook.label} will take {selectedBook.chapters} days
            (through {(() => {
              const end = new Date(startDate);
              end.setDate(end.getDate() + selectedBook.chapters - 1);
              return end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            })()}).
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
}

function JoinGroup({ onBack, onJoined }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await groups.join(code);
      onJoined();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn btn-secondary btn-small mb-24" onClick={onBack}>← Back</button>
      <div className="card">
        <h2>Join a Group</h2>
        <p className="text-small text-muted mb-16">
          Enter the invite code shared by your group leader.
        </p>
        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label>Invite Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. john-lxyz123"
              required
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Joining...' : 'Join Group'}
          </button>
        </form>
      </div>
    </div>
  );
}
