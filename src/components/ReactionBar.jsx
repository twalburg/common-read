import { useState } from 'react';
import { reactions as reactionsApi } from '../lib/api.js';

// Quick-access emojis for devotional context, plus a "more" toggle
const QUICK_EMOJIS = ['🙏', '❤️', '💡', '🔥', '😢', '✝️'];
const MORE_EMOJIS = ['🙌', '👏', '💪', '😊', '🕊️', '⭐', '🌿', '💬', '📖', '🎯', '💎', '🌅'];

export default function ReactionBar({ reflectionId, reactionsData, userId, onReactionChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [toggling, setToggling] = useState(false);

  // reactionsData is { emoji: [{ userId, displayName }, ...], ... } for this reflection
  const emojiEntries = reactionsData ? Object.entries(reactionsData) : [];

  async function handleToggle(emoji) {
    if (toggling) return;
    setToggling(true);
    try {
      await reactionsApi.toggle(reflectionId, emoji);
      onReactionChange();
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    } finally {
      setToggling(false);
      setShowPicker(false);
      setShowMore(false);
    }
  }

  function userReacted(emoji) {
    if (!reactionsData || !reactionsData[emoji]) return false;
    return reactionsData[emoji].some(u => u.userId === userId);
  }

  function getTooltip(users) {
    return users.map(u => u.displayName).join(', ');
  }

  return (
    <div className="reaction-bar">
      {/* Existing reactions */}
      <div className="reaction-pills">
        {emojiEntries.map(([emoji, users]) => (
          <button
            key={emoji}
            className={`reaction-pill ${userReacted(emoji) ? 'reaction-pill-active' : ''}`}
            onClick={() => handleToggle(emoji)}
            title={getTooltip(users)}
            disabled={toggling}
          >
            <span className="reaction-pill-emoji">{emoji}</span>
            <span className="reaction-pill-count">{users.length}</span>
          </button>
        ))}

        {/* Add reaction button */}
        <button
          className="reaction-add"
          onClick={() => { setShowPicker(!showPicker); setShowMore(false); }}
          title="Add reaction"
        >
          +
        </button>
      </div>

      {/* Emoji picker */}
      {showPicker && (
        <div className="reaction-picker">
          <div className="reaction-picker-grid">
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                className={`reaction-picker-emoji ${userReacted(emoji) ? 'reaction-picker-emoji-active' : ''}`}
                onClick={() => handleToggle(emoji)}
                disabled={toggling}
              >
                {emoji}
              </button>
            ))}
          </div>
          {showMore && (
            <div className="reaction-picker-grid" style={{ marginTop: 6 }}>
              {MORE_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  className={`reaction-picker-emoji ${userReacted(emoji) ? 'reaction-picker-emoji-active' : ''}`}
                  onClick={() => handleToggle(emoji)}
                  disabled={toggling}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <button
            className="reaction-picker-more"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? 'Less' : 'More'}
          </button>
        </div>
      )}
    </div>
  );
}
