import { useState } from 'react';

const SCREENS = [
  {
    emoji: '📖',
    title: 'Welcome to Common Read',
    body: 'Read through a book of the Bible with your friends — one chapter a day. Share reflections, see what others are thinking, and grow together.',
  },
  {
    emoji: '🕊️',
    title: 'Start Each Day Centered',
    body: 'Before you read, a short contemplative prompt helps you slow down and prepare your heart. Breath prayers, Lectio Divina, silence — practices rooted in Christian tradition.',
  },
  {
    emoji: '✍️',
    title: 'Reflect and Share',
    body: 'Each chapter comes with a unique question to guide your reflection. Write your honest thoughts, then see what your friends shared. React with an emoji to encourage each other.',
  },
  {
    emoji: '🤝',
    title: 'Your Group, Your Journey',
    body: 'Track reading streaks, see who\'s reflected today, and scroll through your group\'s shared journal — a beautiful record of your time in Scripture together.',
  },
];

export default function Onboarding({ onComplete }) {
  const [screen, setScreen] = useState(0);
  const isLast = screen === SCREENS.length - 1;
  const current = SCREENS[screen];

  function next() {
    if (isLast) {
      onComplete();
    } else {
      setScreen(screen + 1);
    }
  }

  function skip() {
    onComplete();
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        {/* Progress dots */}
        <div className="onboarding-dots">
          {SCREENS.map((_, i) => (
            <button
              key={i}
              className={`onboarding-dot ${i === screen ? 'onboarding-dot-active' : ''}`}
              onClick={() => setScreen(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="onboarding-content" key={screen}>
          <div className="onboarding-emoji">{current.emoji}</div>
          <h2 className="onboarding-title">{current.title}</h2>
          <p className="onboarding-body">{current.body}</p>
        </div>

        {/* Actions */}
        <div className="onboarding-actions">
          <button className="btn btn-primary btn-full" onClick={next}>
            {isLast ? 'Get Started' : 'Next'}
          </button>
          {!isLast && (
            <button className="onboarding-skip" onClick={skip}>
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
