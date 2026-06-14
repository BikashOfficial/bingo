import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MODES = [
  {
    id: 'chat',
    icon: '💬',
    title: 'Chat Room',
    description: 'Create a private room, share the code, and chat in real‑time with anyone.',
    gradient: 'from-violet-500 via-purple-500 to-pink-500',
    glowColor: 'rgba(139,92,246,0.35)',
    badge: 'Live',
    path: '/chat',
  },
  {
    id: 'bingo',
    icon: '🎲',
    title: 'Bingo Game',
    description: 'Challenge a friend to a head‑to‑head bingo battle. First to BINGO wins!',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    glowColor: 'rgba(34,211,238,0.35)',
    badge: 'Live',
    path: '/bingo',
  },
  {
    id: 'coming',
    icon: '🚀',
    title: 'More Coming',
    description: 'New game modes are in the works. Stay tuned for exciting updates!',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    glowColor: 'rgba(251,146,60,0.25)',
    badge: 'Soon',
    path: null,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [ripple, setRipple] = useState(null);

  const handleSelect = (mode) => {
    if (!mode.path) return;
    setRipple(mode.id);
    setTimeout(() => navigate(mode.path), 280);
  };

  return (
    <div className="landing-root">
      {/* Animated background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}

      <div className="landing-content">
        {/* Hero */}
        <div className="hero-section">
          <div className="logo-ring">
            <span className="logo-emoji">✨</span>
          </div>
          <h1 className="hero-title">
            <span className="gradient-text-main">PlaySpace</span>
          </h1>
          <p className="hero-sub">
            Pick a mode, share a code, play together — no sign‑up ever.
          </p>
        </div>

        {/* Mode cards */}
        <div className="mode-grid">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleSelect(mode)}
              onMouseEnter={() => setHovered(mode.id)}
              onMouseLeave={() => setHovered(null)}
              disabled={!mode.path}
              className={`mode-card ${hovered === mode.id ? 'mode-card-hovered' : ''} ${ripple === mode.id ? 'mode-card-ripple' : ''} ${!mode.path ? 'mode-card-disabled' : ''}`}
              style={{
                '--glow': mode.glowColor,
              }}
            >
              {/* Glass reflection shimmer */}
              <div className="card-shimmer" />

              {/* Badge */}
              <span className={`mode-badge ${mode.badge === 'Soon' ? 'badge-soon' : 'badge-live'}`}>
                {mode.badge}
              </span>

              {/* Icon */}
              <div className={`mode-icon-wrap bg-gradient-to-br ${mode.gradient}`}>
                <span className="mode-icon">{mode.icon}</span>
              </div>

              {/* Text */}
              <div className="mode-text">
                <h2 className="mode-title">{mode.title}</h2>
                <p className="mode-desc">{mode.description}</p>
              </div>

              {/* Arrow */}
              {mode.path && (
                <div className="mode-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="landing-footer">
          All sessions are ephemeral · No accounts · No tracking
        </p>
      </div>
    </div>
  );
}
