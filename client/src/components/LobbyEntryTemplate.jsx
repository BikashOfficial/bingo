import { useState, useEffect, useRef } from 'react';

/* ─── Inject styles once ─── */
const STYLES = `

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes letDrift1 {
    0%,100% { transform: translate(0,0) scale(1) rotate(0deg); }
    33%      { transform: translate(50px,-40px) scale(1.12) rotate(8deg); }
    66%      { transform: translate(-25px,28px) scale(0.92) rotate(-5deg); }
  }
  @keyframes letDrift2 {
    0%,100% { transform: translate(0,0) scale(1); }
    40%      { transform: translate(-45px,35px) scale(1.08); }
    75%      { transform: translate(28px,-22px) scale(0.93); }
  }
  @keyframes letDrift3 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(20px,45px) scale(1.15); }
  }
  @keyframes letFloat {
    0%,100% { transform: translateY(0px) rotate(-3deg) scale(1); }
    50%      { transform: translateY(-14px) rotate(5deg) scale(1.04); }
  }
  @keyframes letPageIn {
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes letPanelIn {
    from { opacity: 0; transform: translateX(10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes letSpin {
    to { transform: rotate(360deg); }
  }
  @keyframes letPing {
    0%   { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  @keyframes letShimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes letParticle {
    0%   { transform: translateY(0) scale(0); opacity: 0; }
    10%  { opacity: 1; transform: translateY(-8px) scale(1); }
    100% { transform: translateY(-60px) scale(0.3); opacity: 0; }
  }
  @keyframes letGlow {
    0%,100% { opacity: 0.6; }
    50%      { opacity: 1; }
  }
  @keyframes letWobble {
    0%,100% { transform: rotate(0deg); }
    25%     { transform: rotate(-3deg) scale(1.06); }
    75%     { transform: rotate(3deg) scale(1.06); }
  }

  .let-root {
    min-height: 100vh;
    width: 100%;
    background: var(--root-bg, #080815);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28px 16px;
    position: relative;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  /* ── Ambient layer ── */
  .let-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    will-change: transform;
  }
  .let-orb-1 {
    width: 600px; height: 600px;
    background: var(--orb1);
    filter: blur(100px);
    top: -200px; left: -160px;
    animation: letDrift1 14s ease-in-out infinite;
  }
  .let-orb-2 {
    width: 420px; height: 420px;
    background: var(--orb2);
    filter: blur(80px);
    bottom: -100px; right: -80px;
    animation: letDrift2 17s ease-in-out infinite;
  }
  .let-orb-3 {
    width: 280px; height: 280px;
    background: var(--orb3);
    filter: blur(60px);
    top: 50%; left: 58%;
    animation: letDrift3 10s ease-in-out infinite;
  }

  /* Floating sparkles */
  .let-sparks {
    position: absolute; inset: 0;
    pointer-events: none; z-index: 0;
    overflow: hidden;
  }
  .let-spark {
    position: absolute;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent-a);
    opacity: 0;
    animation: letParticle var(--dur, 4s) var(--delay, 0s) ease-in infinite;
  }

  /* ── Shell ── */
  .let-shell {
    position: relative; z-index: 1;
    width: 100%; max-width: 900px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-radius: 32px;
    overflow: hidden;
    box-shadow:
      0 50px 100px -20px rgba(0,0,0,0.8),
      0 0 0 1px rgba(255,255,255,0.08),
      inset 0 1px 0 rgba(255,255,255,0.12);
    animation: letPageIn 0.55s cubic-bezier(0.23,1,0.32,1) both;
  }

  /* ── LEFT PANEL ── */
  .let-left {
    background: var(--left-bg);
    padding: 52px 44px 48px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  /* Mesh grid overlay */
  .let-mesh {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(ellipse at 30% 40%, black 20%, transparent 75%);
    pointer-events: none;
  }

  /* Diagonal stripe accent */
  .let-stripe {
    position: absolute;
    top: -60px; right: -60px;
    width: 240px; height: 240px;
    border-radius: 48px;
    background: rgba(255,255,255,0.06);
    transform: rotate(20deg);
    pointer-events: none;
  }
  .let-stripe-2 {
    bottom: -40px; left: -40px;
    width: 160px; height: 160px;
    border-radius: 32px;
    transform: rotate(-15deg);
    top: auto; right: auto;
  }

  .let-left-content { position: relative; z-index: 1; }
  .let-left-footer  { position: relative; z-index: 1; }

  .let-back-btn {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.75);
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 12px; font-weight: 700;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background 0.2s, color 0.2s, transform 0.15s;
    width: fit-content;
    margin-bottom: 44px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  .let-back-btn:hover {
    background: rgba(255,255,255,0.2);
    color: #fff;
    transform: translateX(-2px);
  }

  .let-icon-wrap {
    display: flex; align-items: center; justify-content: center;
    width: 88px; height: 88px;
    border-radius: 26px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.22);
    backdrop-filter: blur(12px);
    margin-bottom: 26px;
    font-size: 42px;
    animation: letFloat 3.8s ease-in-out infinite;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
    transition: transform 0.2s;
    cursor: default;
  }
  .let-icon-wrap:hover {
    animation: letWobble 0.5s ease;
  }

  .let-eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    margin-bottom: 6px;
    display: flex; align-items: center; gap: 8px;
  }
  .let-eyebrow::before {
    content: '';
    display: inline-block;
    width: 18px; height: 2px;
    background: currentColor;
    border-radius: 2px;
  }

  .let-left-title {
    font-family: 'Syne', sans-serif;
    font-size: 38px; font-weight: 700;
    color: #fff;
    letter-spacing: -0.04em;
    line-height: 1.08;
    margin-bottom: 12px;
    /* Shimmer effect on the title */
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.95) 0%,
      rgba(255,255,255,1) 40%,
      rgba(255,255,255,0.55) 60%,
      rgba(255,255,255,0.95) 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: letShimmer 5s linear infinite;
  }

  .let-left-sub {
    font-size: 13.5px; font-weight: 500;
    color: rgba(255,255,255,0.55);
    line-height: 1.65;
    max-width: 230px;
    margin-bottom: 0;
  }

  /* Features */
  .let-features { display: flex; flex-direction: column; gap: 11px; margin-top: 40px; }
  .let-feature {
    display: flex; align-items: center; gap: 12px;
    font-size: 12px; font-weight: 700;
    color: rgba(255,255,255,0.6);
    letter-spacing: 0.01em;
  }
  .let-feature-icon {
    width: 32px; height: 32px;
    border-radius: 10px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  /* Player count pill on the left */
  .let-player-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 999px;
    padding: 7px 14px;
    font-size: 11.5px; font-weight: 700;
    color: rgba(255,255,255,0.55);
    margin-top: 8px;
  }
  .let-online-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #4ade80;
    position: relative;
  }
  .let-online-dot::after {
    content: '';
    position: absolute; inset: 0;
    border-radius: 50%;
    background: #4ade80;
    animation: letPing 1.6s ease-out infinite;
  }

  /* ── RIGHT PANEL ── */
  .let-right {
    background: rgba(8,8,24,0.96);
    backdrop-filter: blur(28px);
    padding: 52px 44px 48px;
    display: flex;
    flex-direction: column;
    border-left: 1px solid rgba(255,255,255,0.06);
    position: relative;
    overflow: hidden;
  }

  /* Subtle corner glow on right panel */
  .let-right::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 200px; height: 200px;
    background: var(--orb1);
    filter: blur(80px);
    opacity: 0.12;
    pointer-events: none;
  }

  .let-right-heading {
    font-family: 'Syne', sans-serif;
    font-size: 18px; font-weight: 700;
    color: rgba(255,255,255,0.92);
    margin-bottom: 24px;
    letter-spacing: -0.02em;
  }

  /* Field */
  .let-field { margin-bottom: 20px; position: relative; }
  .let-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 10.5px; font-weight: 700;
    color: rgba(255,255,255,0.38);
    text-transform: uppercase; letter-spacing: 0.1em;
    margin-bottom: 8px;
  }

  .let-input-wrap { position: relative; }
  .let-input-prefix {
    position: absolute;
    left: 14px; top: 50%; transform: translateY(-50%);
    font-size: 16px; opacity: 0.5;
    pointer-events: none;
    z-index: 1;
  }

  .let-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 2px solid var(--accent-a);
    border-radius: 16px;
    padding: 13px 16px 13px 40px;
    font-size: 14px; font-weight: 600;
    color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.25s;
    caret-color: var(--accent-a);
    position: relative; z-index: 0;
  }
  .let-input::placeholder {
    color: rgba(255,255,255,0.2);
    font-weight: 500;
  }
  .let-input:focus {
    border-color: var(--accent-a);
    background: rgba(255,255,255,0.06);
    box-shadow: 0 0 0 4px var(--focus-ring), 0 2px 12px rgba(0,0,0,0.3);
  }
  .let-input-code {
    padding-left: 16px;
    font-family: 'Syne', monospace;
    font-size: 26px; font-weight: 700;
    letter-spacing: 0.25em;
    text-align: center;
    text-transform: uppercase;
  }

  /* Character counter */
  .let-char-count {
    position: absolute;
    right: 12px; top: 50%; transform: translateY(-50%);
    font-size: 10px; font-weight: 700;
    color: rgba(255,255,255,0.2);
    pointer-events: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    letter-spacing: 0.05em;
  }

  /* Tabs */
  .let-tabs {
    display: flex;
    background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 5px;
    margin-bottom: 24px;
    gap: 4px;
  }
  .let-tab {
    flex: 1; padding: 11px 0;
    border-radius: 12px; border: none;
    background: transparent;
    color: rgba(255,255,255,0.35);
    font-size: 13px; font-weight: 700;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: color 0.2s, background 0.2s, transform 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    letter-spacing: 0.01em;
    position: relative;
  }
  .let-tab:hover:not(.let-tab-active) {
    color: rgba(255,255,255,0.6);
    background: rgba(255,255,255,0.05);
  }
  .let-tab-active {
    background: var(--tab-gradient);
    color: #fff;
    // box-shadow: 0 4px 16px var(--glow), 0 1px 0 rgba(255,255,255,0.15) inset;
    transform: none;
  }

  /* Panel */
  .let-panel {
    animation: letPanelIn 0.2s ease both;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  .let-hint {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 12.5px;
    color: rgba(255,255,255,0.38);
    line-height: 1.6;
    margin-bottom: 20px;
    display: flex; align-items: flex-start; gap: 8px;
  }
  .let-hint::before {
    content: '💡';
    font-size: 13px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  /* CTA Button */
  .let-btn {
    width: 100%;
    padding: 15px 22px;
    border-radius: 16px;
    border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px; font-weight: 700;
    letter-spacing: 0.02em;
    color: #fff;
    background: var(--tab-gradient);
    box-shadow:
      0 6px 28px var(--glow),
      0 1px 0 rgba(255,255,255,0.22) inset,
      0 -1px 0 rgba(0,0,0,0.2) inset;
    transition: transform 0.15s ease, box-shadow 0.18s ease, opacity 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    margin-top: auto;
    position: relative;
    overflow: hidden;
  }
  /* Sheen sweep on hover */
  .let-btn::after {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: skewX(-20deg);
    transition: left 0.4s ease;
  }
  .let-btn:hover:not(:disabled)::after { left: 160%; }
  .let-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.01);
    box-shadow: 0 12px 36px var(--glow-hover), 0 1px 0 rgba(255,255,255,0.22) inset;
  }
  .let-btn:active:not(:disabled) { transform: scale(0.97); }
  .let-btn:disabled {
    opacity: 0.32; cursor: not-allowed;
    transform: none; box-shadow: none;
  }
  .let-btn-arrow {
    display: inline-flex;
    align-items: center;
    transition: transform 0.18s ease;
    font-style: normal;
  }
  .let-btn:hover:not(:disabled) .let-btn-arrow { transform: translateX(5px); }

  /* Divider */
  .let-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 22px 0;
    position: relative;
  }
  .let-divider::after {
    content: 'or';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    background: rgba(8,8,24,0.96);
    padding: 0 10px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  /* Connection badge */
  .let-conn {
    display: inline-flex; align-items: center; gap: 8px;
    margin-top: 20px;
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 11px; font-weight: 700;
    width: fit-content; align-self: center;
    border: 1px solid;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .let-conn-ok {
    background: rgba(34,197,94,0.09);
    border-color: rgba(34,197,94,0.22);
    color: rgba(74,222,128,0.85);
  }
  .let-conn-off {
    background: rgba(248,113,113,0.07);
    border-color: rgba(248,113,113,0.18);
    color: rgba(252,165,165,0.65);
  }
  .let-conn-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: currentColor; position: relative; flex-shrink: 0;
  }
  .let-conn-dot::after {
    content: ''; position: absolute; inset: 0;
    border-radius: 50%; background: currentColor;
    animation: letPing 1.6s ease-out infinite;
  }
  .let-conn-off .let-conn-dot::after { animation: none; }

  /* Spinner */
  .let-spinner { animation: letSpin 0.7s linear infinite; }

  /* ── RESPONSIVE ── */
  @media (max-width: 680px) {
    .let-shell { grid-template-columns: 1fr; max-width: 440px; }
    .let-left { padding: 36px 28px 32px; }
    .let-left-title { font-size: 30px; }
    .let-icon-wrap { width: 72px; height: 72px; font-size: 34px; }
    .let-features, .let-player-pill { display: none; }
    .let-right { padding: 36px 28px 40px; border-left: none; border-top: 1px solid rgba(255,255,255,0.06); }
    .let-right::before { display: none; }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('let-v2-styles')) {
  const tag = document.createElement('style');
  tag.id = 'let-v2-styles';
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}

/* ─── Themes ─── */
const THEMES = {
  purple: {
    '--root-bg': '#08080f',
    '--left-bg': 'linear-gradient(148deg, #1a0a3d 0%, #2d1060 40%, #3b1278 70%, #4a1a8a 100%)',
    '--orb1': 'radial-gradient(circle, rgba(130,60,255,0.35) 0%, transparent 70%)',
    '--orb2': 'radial-gradient(circle, rgba(180,100,255,0.28) 0%, transparent 70%)',
    '--orb3': 'radial-gradient(circle, rgba(90,120,255,0.22) 0%, transparent 70%)',
    '--accent-a': '#b060ff',
    '--accent-b': '#7c3aed',
    '--tab-gradient': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #c084fc 100%)',
    '--focus-ring': 'rgba(168,85,247,0.22)',
    '--glow': 'rgba(150,80,240,0.45)',
    '--glow-hover': 'rgba(168,85,247,0.65)',
    '--spark-color': '#a855f7',
  },
  indigo: {
    '--root-bg': '#08080f',
    '--left-bg': 'linear-gradient(148deg, #0d0a30 0%, #1e1b54 40%, #2e2880 70%, #3730a3 100%)',
    '--orb1': 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)',
    '--orb2': 'radial-gradient(circle, rgba(6,182,212,0.28) 0%, transparent 70%)',
    '--orb3': 'radial-gradient(circle, rgba(236,72,153,0.22) 0%, transparent 70%)',
    '--accent-a': '#818cf8',
    '--accent-b': '#4f46e5',
    '--tab-gradient': 'linear-gradient(135deg, #4f46e5 0%, #6366f1 60%, #a5b4fc 100%)',
    '--focus-ring': 'rgba(99,102,241,0.22)',
    '--glow': 'rgba(90,96,240,0.45)',
    '--glow-hover': 'rgba(99,102,241,0.65)',
    '--spark-color': '#818cf8',
  },
  orange: {
    '--root-bg': '#0c0800',
    '--left-bg': 'linear-gradient(148deg, #2c0e00 0%, #481800 40%, #6a2100 70%, #8a3000 100%)',
    '--orb1': 'radial-gradient(circle, rgba(245,140,30,0.35) 0%, transparent 70%)',
    '--orb2': 'radial-gradient(circle, rgba(249,115,22,0.28) 0%, transparent 70%)',
    '--orb3': 'radial-gradient(circle, rgba(244,63,94,0.22) 0%, transparent 70%)',
    '--accent-a': '#fb923c',
    '--accent-b': '#d97706',
    '--tab-gradient': 'linear-gradient(135deg, #b45309 0%, #f97316 60%, #fdba74 100%)',
    '--focus-ring': 'rgba(249,115,22,0.22)',
    '--glow': 'rgba(240,120,30,0.45)',
    '--glow-hover': 'rgba(249,115,22,0.65)',
    '--spark-color': '#fb923c',
  },
  rose: {
    '--root-bg': '#0c080a',
    '--left-bg': 'linear-gradient(148deg, #2d0a18 0%, #4c1130 40%, #6e1240 70%, #8b0f48 100%)',
    '--orb1': 'radial-gradient(circle, rgba(236,72,153,0.35) 0%, transparent 70%)',
    '--orb2': 'radial-gradient(circle, rgba(251,113,133,0.28) 0%, transparent 70%)',
    '--orb3': 'radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)',
    '--accent-a': '#f472b6',
    '--accent-b': '#ec4899',
    '--tab-gradient': 'linear-gradient(135deg, #be185d 0%, #ec4899 60%, #f9a8d4 100%)',
    '--focus-ring': 'rgba(236,72,153,0.22)',
    '--glow': 'rgba(220,70,140,0.45)',
    '--glow-hover': 'rgba(236,72,153,0.65)',
    '--spark-color': '#f472b6',
  },
};

/* ─── Spark positions ─── */
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  left: `${10 + Math.random() * 80}%`,
  top: `${20 + Math.random() * 70}%`,
  delay: `${(i * 0.6) % 5}s`,
  dur: `${3 + (i % 4)}s`,
  size: `${4 + (i % 4)}px`,
}));

function Spinner() {
  return (
    <svg className="let-spinner" viewBox="0 0 24 24" fill="none" width="18" height="18">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5" />
      <path fill="rgba(255,255,255,0.92)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function LobbyEntryTemplate({
  title = 'Game Lobby',
  subtitle = 'Create a room and invite your crew, or paste a code to jump in.',
  icon,
  features = [],
  theme = 'purple',
  initialPlayerName = '',
  connected = false,
  loading = false,
  onCreateRoom,
  onJoinRoom,
  onBack,
  createHint = '',
  placeholderName = 'Cosmic Wolf 🐺',
  eyebrow = 'Multiplayer',
  onlinePlayers = null,
}) {
  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [roomCode, setRoomCode] = useState('');
  const [tab, setTab] = useState('create');

  const t = THEMES[theme] || THEMES.purple;

  const cssVars = {
    '--root-bg':       t['--root-bg'],
    '--left-bg':       t['--left-bg'],
    '--orb1':          t['--orb1'],
    '--orb2':          t['--orb2'],
    '--orb3':          t['--orb3'],
    '--accent-a':      t['--accent-a'],
    '--accent-b':      t['--accent-b'],
    '--tab-gradient':  t['--tab-gradient'],
    '--focus-ring':    t['--focus-ring'],
    '--glow':          t['--glow'],
    '--glow-hover':    t['--glow-hover'],
  };

  return (
    <div className="let-root" style={cssVars}>
      {/* Ambient orbs */}
      <div className="let-orb let-orb-1" />
      <div className="let-orb let-orb-2" />
      <div className="let-orb let-orb-3" />

      {/* Floating sparks */}
      <div className="let-sparks">
        {SPARKS.map((s, i) => (
          <div
            key={i}
            className="let-spark"
            style={{
              left: s.left, top: s.top,
              width: s.size, height: s.size,
              '--delay': s.delay,
              '--dur': s.dur,
              background: t['--accent-a'],
            }}
          />
        ))}
      </div>

      <div className="let-shell">
        {/* ── LEFT PANEL ── */}
        <div className="let-left">
          <div className="let-mesh" />
          <div className="let-stripe" />
          <div className="let-stripe let-stripe-2" />

          <div className="let-left-content">
            {onBack && (
              <button className="let-back-btn" onClick={onBack}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
            )}

            {icon && <div className="let-icon-wrap">{icon}</div>}

            {eyebrow && (
              <div className="let-eyebrow">{eyebrow}</div>
            )}
            <h1 className="let-left-title">{title}</h1>
            <p className="let-left-sub">{subtitle}</p>

            {onlinePlayers != null && (
              <div className="let-player-pill">
                <span className="let-online-dot" />
                {onlinePlayers.toLocaleString()} players online
              </div>
            )}
          </div>

          <div className="let-left-footer">
            {features.length > 0 && (
              <div className="let-features">
                {features.map((feature, i) => (
                  <div className="let-feature" key={i}>
                    {feature.icon && (
                      <span className="let-feature-icon">{feature.icon}</span>
                    )}
                    {feature.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="let-right">
          <p className="let-right-heading">Get into the game</p>

          {/* Name field */}
          <div className="let-field">
            <label className="let-label" htmlFor="let-name">Your name</label>
            <div className="let-input-wrap">
              <span className="let-input-prefix">👤</span>
              <input
                id="let-name"
                className="let-input"
                placeholder={placeholderName}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
                autoComplete="off"
              />
              <span className="let-char-count">{playerName.length}/20</span>
            </div>
          </div>

          {/* Divider */}
          <div className="let-divider" />

          {/* Tabs */}
          <div className="let-tabs">
            <button
              className={`let-tab${tab === 'create' ? ' let-tab-active' : ''}`}
              onClick={() => setTab('create')}
            >
              ✨ Create
            </button>
            <button
              className={`let-tab${tab === 'join' ? ' let-tab-active' : ''}`}
              onClick={() => setTab('join')}
            >
              🚀 Join
            </button>
          </div>

          {/* Create panel */}
          {tab === 'create' && (
            <div className="let-panel" key="create">
              {createHint && <p className="let-hint">{createHint}</p>}
              <button
                className="let-btn"
                onClick={() => onCreateRoom && onCreateRoom(playerName)}
                disabled={loading || !connected || !playerName.trim()}
              >
                {loading ? <Spinner /> : (
                  <>
                    <span>Create room</span>
                    <span className="let-btn-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Join panel */}
          {tab === 'join' && (
            <div className="let-panel" key="join">
              <div className="let-field">
                <label className="let-label" htmlFor="let-code">Room code</label>
                <div className="let-input-wrap">
                  <input
                    id="let-code"
                    className="let-input let-input-code"
                    placeholder="XXXXXX"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    maxLength={6}
                    onKeyDown={(e) => e.key === 'Enter' && roomCode.length === 6 && onJoinRoom && onJoinRoom(roomCode, playerName)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>
              <button
                className="let-btn"
                onClick={() => onJoinRoom && onJoinRoom(roomCode, playerName)}
                disabled={loading || !connected || roomCode.length < 6 || !playerName.trim()}
              >
                {loading ? <Spinner /> : (
                  <>
                    <span>Join room</span>
                    <span className="let-btn-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Connection badge */}
          <div className={`let-conn ${connected ? 'let-conn-ok' : 'let-conn-off'}`}>
            <span className="let-conn-dot" />
            {connected ? 'Connected & ready' : 'Connecting…'}
          </div>
        </div>
      </div>
    </div>
  );
}