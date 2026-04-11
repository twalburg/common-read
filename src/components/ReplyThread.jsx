import { useState } from 'react';
import { replies as repliesApi } from '../lib/api.js';

export default function ReplyThread({ reflectionId, repliesData, onReplyAdded }) {
  const [showInput, setShowInput] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const replyList = repliesData || [];

  async function handleSubmit() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await repliesApi.add(reflectionId, content);
      setContent('');
      setShowInput(false);
      onReplyAdded();
    } catch (err) { console.error('Failed to reply:', err); }
    finally { setSubmitting(false); }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }

  return (
    <div className="reply-thread">
      {replyList.length > 0 && (
        <div className="reply-list">
          {replyList.map(r => (
            <div key={r.id} className="reply-item">
              <span className="reply-author">{r.displayName}</span>
              <span className="reply-content">{r.content}</span>
            </div>
          ))}
        </div>
      )}
      {!showInput ? (
        <button className="reply-trigger" onClick={() => setShowInput(true)}>Reply</button>
      ) : (
        <div className="reply-input-row">
          <input type="text" className="reply-input" value={content} onChange={e => setContent(e.target.value)} onKeyDown={handleKeyDown} placeholder="Write a reply..." autoFocus />
          <button className="reply-send" onClick={handleSubmit} disabled={submitting || !content.trim()}>{submitting ? '...' : 'Send'}</button>
          <button className="reply-cancel" onClick={() => { setShowInput(false); setContent(''); }}>×</button>
        </div>
      )}
    </div>
  );
}
