import { useState, useCallback } from 'react';

// ── Emoji data ────────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  { label: '😀 Smileys', emojis: ['😀','😂','🤣','😊','😍','🥰','😎','🤩','😜','🥳','😇','🤗','😏','😒','😞','😭','😱','😴','🤔','🙄','😬','🤐','😷','🤒','🤕','🥴','😵','🤯','🤠','😈','💀','👻','🤖','👽','🎃'] },
  { label: '👍 Gestures', emojis: ['👍','👎','👋','🤚','🖐','✋','🤙','👊','✊','🤞','🤟','🤘','🤙','💪','🦾','🖕','👌','🤌','🤏','☝️','👆','👇','👈','👉','🫵','🙌','👐','🤲','🙏','💅','🤳'] },
  { label: '❤️ Hearts', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✌️','🫶','💌','💋'] },
  { label: '🎉 Celebrate', emojis: ['🎉','🎊','🎈','🎁','🥂','🍾','🎂','🎆','🎇','✨','⭐','🌟','💫','🔥','🎯','🏆','🥇','🎖️','🏅','🎗️','🎀','🎐','🎏','🎑'] },
  { label: '🐶 Animals', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🦆','🦉','🦋','🐝','🐞','🦄','🐲'] },
  { label: '🍕 Food', emojis: ['🍕','🍔','🌮','🌯','🥗','🍣','🍜','🍝','🍩','🎂','🍰','🍫','🍿','🥤','☕','🍵','🧃','🍺','🥃','🍷','🥂','🍾'] },
  { label: '⚽ Sports', emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🎯','🎳','🏆','🥊','🏋️','🤸','⛷️','🏂','🏄','🤽','🧘','🏇'] },
  { label: '🌍 Travel', emojis: ['🌍','🌎','🌏','🗺️','🗼','🏰','🏯','🗽','🏖️','🏝️','🏔️','🌋','🏕️','🚀','✈️','🚂','🚢','🏍️','🚗','🛸'] },
];

// ── Curated GIF URLs (animated) ───────────────────────────────────────────────
const CURATED_GIFS = [
  { id: 'g1', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', alt: 'applause' },
  { id: 'g2', url: 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', alt: 'wow' },
  { id: 'g3', url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', alt: 'celebration' },
  { id: 'g4', url: 'https://media.giphy.com/media/xT9DPJVjlYHwWsZRxm/giphy.gif', alt: 'happy dance' },
  { id: 'g5', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', alt: 'deal with it' },
  { id: 'g6', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', alt: 'laughing' },
  { id: 'g7', url: 'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif', alt: 'fire' },
  { id: 'g8', url: 'https://media.giphy.com/media/xT9IgG50Lg7russDdO/giphy.gif', alt: 'shocked' },
  { id: 'g9', url: 'https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif', alt: 'love' },
  { id: 'g10', url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif', alt: 'nope' },
  { id: 'g11', url: 'https://media.giphy.com/media/3oEjI5VtIhAfERmLHq/giphy.gif', alt: 'party' },
  { id: 'g12', url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif', alt: 'thinking' },
  { id: 'g13', url: 'https://media.giphy.com/media/3o7TKRwpns23QMNNiE/giphy.gif', alt: 'ok' },
  { id: 'g14', url: 'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif', alt: 'bye' },
  { id: 'g15', url: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif', alt: 'sleeping' },
  { id: 'g16', url: 'https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/giphy.gif', alt: 'facepalm' },
];

// ── Big emoji stickers (rendered large) ──────────────────────────────────────
const STICKERS = [
  '🥳','🤯','🤩','😎','🥹','🫠','🤪','😤','🥺','😩',
  '🤑','😇','🤓','🥸','🤡','👾','🤖','💩','👻','💀',
  '❤️‍🔥','💥','⚡','🌈','🦋','🌊','🔮','💎','🏆','🎯',
  '🚀','🌙','⭐','🌟','💫','🎭','🎪','🎨','🎸','🎵',
];

const StickerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M5 3h14a2 2 0 0 1 2 2v10l-6 6H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M15 21v-4a2 2 0 0 1 2-2h4" />
    <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="10.5" r="1.5" fill="currentColor" />
    <path d="M8 14a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="2.5" />
  </svg>
);

const GifIcon = () => (
  <span style={{ fontWeight: '800', fontSize: '0.875rem', letterSpacing: '0.05em', verticalAlign: 'middle' }}>GIF</span>
);

export default function EmojiGifPicker({ onSelectEmoji, onSelectGif, onSelectSticker, onClose }) {
  const [tab, setTab] = useState('emoji');
  const [emojiCategory, setEmojiCategory] = useState(0);

  const handleEmoji = useCallback((emoji) => {
    onSelectEmoji(emoji);
    onClose();
  }, [onSelectEmoji, onClose]);

  const handleGif = useCallback((gif) => {
    onSelectGif(gif.url);
    onClose();
  }, [onSelectGif, onClose]);

  const handleSticker = useCallback((sticker) => {
    onSelectSticker(sticker);
    onClose();
  }, [onSelectSticker, onClose]);

  return (
    <>
      <div className="picker-backdrop" onClick={onClose} />
      <div className="picker-panel">
        {/* Tab bar */}
        <div className="picker-tabs">
          <button
            onClick={() => setTab('emoji')}
            className={`picker-tab ${tab === 'emoji' ? 'picker-tab-active' : ''}`}
            title="Emoji"
          >
            😀
          </button>
          <button
            onClick={() => setTab('gif')}
            className={`picker-tab ${tab === 'gif' ? 'picker-tab-active' : ''}`}
            title="GIFs"
          >
            <GifIcon />
          </button>
          <button
            onClick={() => setTab('sticker')}
            className={`picker-tab ${tab === 'sticker' ? 'picker-tab-active' : ''}`}
            title="Stickers"
          >
            <StickerIcon />
          </button>
        </div>

        {/* Emoji tab */}
        {tab === 'emoji' && (
          <div className="picker-body">
            {/* Category pills */}
            <div className="emoji-cats">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setEmojiCategory(i)}
                  className={`emoji-cat-btn ${emojiCategory === i ? 'emoji-cat-active' : ''}`}
                >
                  {cat.label.split(' ')[0]}
                </button>
              ))}
            </div>
            {/* Grid */}
            <div className="emoji-grid">
              {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmoji(emoji)}
                  className="emoji-item"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GIF tab */}
        {tab === 'gif' && (
          <div className="picker-body">
            <p className="picker-section-label">Trending GIFs</p>
            <div className="gif-grid">
              {CURATED_GIFS.map((gif) => (
                <button key={gif.id} onClick={() => handleGif(gif)} className="gif-item">
                  <img src={gif.url} alt={gif.alt} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sticker tab */}
        {tab === 'sticker' && (
          <div className="picker-body">
            <p className="picker-section-label">Stickers</p>
            <div className="sticker-grid">
              {STICKERS.map((s) => (
                <button key={s} onClick={() => handleSticker(s)} className="sticker-item">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
