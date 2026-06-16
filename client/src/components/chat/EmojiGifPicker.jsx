import { useState, useCallback, useRef, useEffect } from 'react';

const GIPHY_API_KEY = 'VIXTbQBsMkH9W0sfCXR3z96DJC3ifRSA'; // free public key

const EMOJI_CATS = [
  { l: '😀', n: 'Smileys', e: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','🥴','😠','😡','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🥳','🥸','🤠','😈','👿','💀','💩','🤡','👹','👺','👻','👽','👾','🤖'] },
  { l: '👍', n: 'Hands', e: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾'] },
  { l: '❤️', n: 'Hearts', e: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','🫶','💌','💋'] },
  { l: '🎉', n: 'Party', e: ['🎉','🎊','🎈','🎁','🥂','🍾','🎂','🎆','🎇','✨','⭐','🌟','💫','🔥','🎯','🏆','🥇','🎖️','🏅','🎗️','🎀','🎭','🎨','🎬','🎤','🎧','🎵','🎶','🎮'] },
  { l: '🐶', n: 'Animals', e: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🦆','🦅','🦉','🦋','🐝','🐛','🐢','🦎','🦑','🐡','🐬','🐳','🦈','🦭','🦄','🐲'] },
  { l: '🍕', n: 'Food', e: ['🍕','🍔','🌮','🌯','🥗','🍣','🍱','🍜','🍝','🍛','🍲','🥘','🍿','🥙','🥪','🧀','🥚','🍳','🥞','🎂','🍰','🧁','🍩','🍪','🍫','🍭','🥤','☕','🧋','🍺','🍷','🥂','🍾'] },
  { l: '⚽', n: 'Sports', e: ['⚽','🏀','🏈','⚾','🥎','🏐','🏉','🎾','🏸','🥊','🥋','⛷️','🏂','🏄','🤽','🚴','🏊','🧘','🏋️','🏆','🥇','🎯','🎱','🎳','🎮','🕹️'] },
  { l: '🌍', n: 'Travel', e: ['🌍','🌎','🌏','🗺️','🏔️','🌋','🏕️','🏖️','🏝️','🏰','🏯','🗽','🗼','✈️','🚀','🛸','🚁','🚂','🚢','🚗','🏍️','🛻','🚲','🛴'] },
  { l: '💼', n: 'Work', e: ['💼','📁','📋','📊','📈','📉','📌','📍','📎','🖥️','💻','⌨️','🖱️','📱','☎️','📞','💡','🔒','🔑','⚙️','🔧','📝','✏️','📏','📐','💰','💳','🪙'] },
  { l: '🌈', n: 'Nature', e: ['🌈','☀️','🌤️','⛅','🌧️','⛈️','🌩️','🌪️','❄️','☃️','⛄','🌊','💧','🔥','🌿','🍀','🍁','🍂','🌻','🌹','🌷','🌸','🌺','🌼','🌵','🎋','🍄','🌾','💐','🌙','⭐','🌟','💫','✨','☄️','🪐'] },
];

const STICKER_PACKS = [
  { pack: 'Expressions', s: ['🥳','🤯','🤩','😎','🥹','🫠','🤪','😤','🥺','😩','🤑','😇','🤓','🥸','🤡','👾','🤖','💩','👻','💀','😼','🙀','😸','😹','😺','😻','🤠','😈','👿'] },
  { pack: 'Reactions', s: ['💥','⚡','🔥','💫','✨','❄️','🌊','🌀','🎯','💢','💦','💨','💬','💭','🗯️','🔔','⁉️','‼️','❓','❗','🚨','⚠️','🆗','🆘','🔝','🎉'] },
  { pack: 'Love', s: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','💕','💞','💓','💗','💖','💘','💝','💟','🫶','💌','💋','🥰','😍','😘','🫦','🌹','💐'] },
  { pack: 'Animals', s: ['🐼','🐨','🐻','🐶','🐱','🐰','🐹','🦊','🐯','🦁','🐸','🐵','🦄','🐲','🦋','🐝','🐞','🦜','🦩','🦒','🐘','🐪','🦙','🦘','🐬','🦈'] },
  { pack: 'Food & Drink', s: ['🍕','🍔','🌮','🍜','🍣','🎂','🍩','🍪','🍫','🍿','☕','🧋','🍺','🥤','🍷','🍦','🍧','🍨','🧁','🥧','🍡','🍭','🫖','🥛','🍾','🥂'] },
  { pack: 'Space & Magic', s: ['🚀','🛸','🌙','⭐','🌟','💫','✨','☄️','🪐','🌌','🔮','🪄','🎩','🌠','🎆','🎇','🌍','🌎','🌏','☀️','🌈','🧿','🔭','🌠','🪅','🎋'] },
  { pack: 'Weather', s: ['☀️','🌤️','⛅','🌦️','🌧️','⛈️','🌩️','🌪️','🌫️','❄️','☃️','⛄','🌊','🔥','🌈','🌙','💧','💦','☔','⛱️','🌬️','🌀','🌁','🌝','🌛','⭐'] },
  { pack: 'Celebrate', s: ['🎉','🎊','🎈','🎁','🥂','🍾','🎂','🎆','🎇','✨','🏆','🥇','🎯','🎖️','🏅','🎗️','🎀','🎐','🎏','🎑','🎠','🎡','🎢','🎪','🎭','🎬'] },
];

const GIPHY_BASE = 'https://api.giphy.com/v1';

const styles = `
  .epicker-backdrop {
    position: fixed; inset: 0; z-index: 999;
  }
  .epicker-panel {
    position: absolute; bottom: 80px; left: 1rem;
    width: 360px; height: 460px;
    background: #000;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.14);
    display: flex; flex-direction: column;
    overflow: hidden; z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  @media (max-width: 640px) {
    .epicker-panel {
      bottom: 66px; left: 0.5rem; right: 0.5rem;
      width: auto; height: 380px;
    }
  }
  .ep-topbar {
    padding: 8px 10px;
    border-bottom: 1px solid #f0f0f0;
    display: flex; align-items: center; gap: 8px;
    background: #000;
  }
  .ep-search-wrap {
    flex: 1; position: relative;
  }
  .ep-search-wrap input {
    width: 100%; padding: 7px 28px 7px 32px;
    border: 1px solid #e5e7eb; border-radius: 20px;
    background: #f9fafb; font-size: 13px;
    outline: none; color: #111;
    font-family: inherit;
  }
  .ep-search-wrap input:focus { border-color: #6366f1; background: #fff; }
  .ep-search-icon {
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    color: #9ca3af; font-size: 14px; pointer-events: none;
  }
  .ep-clear-btn {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #9ca3af; font-size: 13px; line-height: 1; padding: 0;
    display: none;
  }
  .ep-tabs {
    display: flex; border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
  }
  .ep-tab {
    flex: 1; padding: 9px 4px; border: none; background: none;
    cursor: pointer; font-size: 12px; font-weight: 600;
    color: #9ca3af; border-bottom: 2px solid transparent;
    transition: all .15s; display: flex; align-items: center;
    justify-content: center; gap: 4px; font-family: inherit;
  }
  .ep-tab.active { color: #6366f1; border-bottom-color: #6366f1; background: #fff; }
  .ep-tab:hover { color: #374151; }
  .ep-panel { display: none; flex-direction: column; flex: 1; overflow: hidden; }
  .ep-panel.active { display: flex; }
  .ep-cats {
    display: flex; gap: 5px; padding: 7px 10px;
    overflow-x: auto; border-bottom: 1px solid #f0f0f0;
    scrollbar-width: none; flex-shrink: 0;
  }
  .ep-cats::-webkit-scrollbar { display: none; }
  .ep-cat-btn {
    white-space: nowrap; padding: 3px 10px; border-radius: 20px;
    border: 1px solid #e5e7eb; background: none; cursor: pointer;
    font-size: 12px; color: #6b7280; flex-shrink: 0;
    transition: all .12s; font-family: inherit;
  }
  .ep-cat-btn.active {
    background: #6366f1; color: #fff; border-color: #6366f1;
  }
  .ep-scroll { flex: 1; overflow-y: auto; padding: 8px; }
  .ep-emoji-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; }
  .ep-emoji-btn {
    width: 100%; aspect-ratio: 1; border: none; background: none;
    cursor: pointer; font-size: 22px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    transition: background .1s;
  }
  .ep-emoji-btn:hover { background: #f3f4f6; }
  .ep-gif-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  .ep-gif-btn {
    border: none; background: #f3f4f6; cursor: pointer;
    border-radius: 8px; overflow: hidden; aspect-ratio: 16/9;
    width: 100%; padding: 0; position: relative;
  }
  .ep-gif-btn img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ep-gif-tag {
    position: absolute; bottom: 3px; left: 4px;
    background: rgba(0,0,0,.55); color: #fff; font-size: 9px;
    padding: 1px 5px; border-radius: 4px; text-transform: capitalize;
    max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ep-sticker-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .ep-sticker-btn {
    width: 100%; aspect-ratio: 1; border: none; background: none;
    cursor: pointer; border-radius: 10px; display: flex;
    align-items: center; justify-content: center; font-size: 34px;
    transition: background .1s;
  }
  .ep-sticker-btn:hover { background: #f3f4f6; }
  .ep-pack-lbl {
    font-size: 10px; color: #9ca3af; font-weight: 600; padding: 8px 2px 4px;
    grid-column: 1/-1; text-transform: uppercase; letter-spacing: .06em;
  }
  .ep-loading {
    display: flex; align-items: center; justify-content: center;
    height: 120px; color: #9ca3af; font-size: 13px; gap: 8px;
    grid-column: 1/-1;
  }
  .ep-spinner {
    width: 14px; height: 14px; border: 2px solid #e5e7eb;
    border-top-color: #6366f1; border-radius: 50%;
    animation: ep-spin .7s linear infinite; flex-shrink: 0;
  }
  @keyframes ep-spin { to { transform: rotate(360deg); } }
  .ep-no-res {
    grid-column: 1/-1; text-align: center; padding: 28px 0;
    color: #9ca3af; font-size: 13px;
  }
  .ep-giphy-attr {
    display: flex; align-items: center; justify-content: flex-end;
    padding: 3px 8px; font-size: 10px; color: #9ca3af; gap: 3px;
    flex-shrink: 0; border-top: 1px solid #f0f0f0;
  }
`;

function injectStyles() {
  if (document.getElementById('epicker-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'epicker-styles';
  tag.textContent = styles;
  document.head.appendChild(tag);
}

export default function EmojiGifPicker({ onSelectEmoji, onSelectGif, onSelectSticker, onClose }) {
  const [tab, setTab] = useState('emoji');
  const [catIndex, setCatIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);
  const gifTimer = useRef(null);

  useEffect(() => { injectStyles(); }, []);

  // ── Load GIFs when switching to gif tab ──
  const fetchGiphy = useCallback(async (q, trending = false) => {
  setGifLoading(true);
  try {
    const url = trending
      ? `${GIPHY_BASE}/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=g`
      : `${GIPHY_BASE}/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=24&rating=g`;
    const res = await fetch(url);
    const data = await res.json();
    setGifs(data.data || []);
  } catch {
    setGifs([]);
  } finally {
    setGifLoading(false);
  }
}, []); // ✅ no external deps, setGifs is stable

useEffect(() => {
  if (tab === 'gif' && !gifLoaded) {
    fetchGiphy(query || 'trending', !query);
    setGifLoaded(true);
  }
}, [tab, gifLoaded, query, fetchGiphy]); // ✅ all used vars listed

  const handleSearch = useCallback((val) => {
    setQuery(val);
    if (tab === 'gif') {
      clearTimeout(gifTimer.current);
      gifTimer.current = setTimeout(() => {
        fetchGiphy(val.trim() || 'trending', !val.trim());
      }, 400);
    }
  }, [tab, fetchGiphy]);

  const clearSearch = useCallback(() => {
    setQuery('');
    if (tab === 'gif') fetchGiphy('trending', true);
  }, [tab, fetchGiphy]);

  const handleTabSwitch = useCallback((t) => {
    setTab(t);
    if (t === 'gif' && !gifLoaded) {
      fetchGiphy(query || 'trending', !query);
      setGifLoaded(true);
    }
    if (t === 'gif' && gifLoaded && query) {
      fetchGiphy(query);
    }
  }, [gifLoaded, query, fetchGiphy]);

  // ── Filtered emoji ──
  const emojiList = query
    ? EMOJI_CATS.flatMap(c => c.e).filter((e, i, a) => a.indexOf(e) === i)
    : EMOJI_CATS[catIndex].e;

  // ── Filtered stickers ──
  const stickerResults = STICKER_PACKS.map(p => ({
    ...p,
    filtered: query
      ? p.s.filter(() => p.pack.toLowerCase().includes(query.toLowerCase()))
      : p.s,
  })).filter(p => p.filtered.length > 0);

  return (
    <>
      <div className="epicker-backdrop" onClick={onClose} />
      <div className="epicker-panel">

        {/* Universal search bar */}
        <div className="ep-topbar">
          <div className="ep-search-wrap">
            <span className="ep-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search emoji, GIFs, stickers…"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              autoFocus
            />
            {query && (
              <button className="ep-clear-btn" style={{ display: 'block' }} onClick={clearSearch}>✕</button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="ep-tabs">
          <button className={`ep-tab ${tab === 'emoji' ? 'active' : ''}`} onClick={() => handleTabSwitch('emoji')}>
            😀 Emoji
          </button>
          <button className={`ep-tab ${tab === 'gif' ? 'active' : ''}`} onClick={() => handleTabSwitch('gif')}>
            <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: '.04em' }}>GIF</span>
          </button>
          <button className={`ep-tab ${tab === 'sticker' ? 'active' : ''}`} onClick={() => handleTabSwitch('sticker')}>
            🌟 Stickers
          </button>
        </div>

        {/* ── EMOJI PANEL ── */}
        <div className={`ep-panel ${tab === 'emoji' ? 'active' : ''}`}>
          {!query && (
            <div className="ep-cats">
              {EMOJI_CATS.map((cat, i) => (
                <button
                  key={i}
                  className={`ep-cat-btn ${catIndex === i ? 'active' : ''}`}
                  onClick={() => { setCatIndex(i); }}
                >
                  {cat.l}
                </button>
              ))}
            </div>
          )}
          <div className="ep-scroll">
            <div className="ep-emoji-grid">
              {emojiList.length > 0
                ? emojiList.map(e => (
                    <button key={e} className="ep-emoji-btn" onClick={() => { onSelectEmoji(e); onClose(); }} title={e}>
                      {e}
                    </button>
                  ))
                : <div className="ep-no-res">No emoji found</div>
              }
            </div>
          </div>
        </div>

        {/* ── GIF PANEL ── */}
        <div className={`ep-panel ${tab === 'gif' ? 'active' : ''}`}>
          <div className="ep-scroll">
            <div className="ep-gif-grid">
              {gifLoading
                ? <div className="ep-loading"><div className="ep-spinner" />Loading GIFs…</div>
                : gifs.length === 0
                  ? <div className="ep-no-res">No GIFs found — try another search</div>
                  : gifs.map(gif => {
                      const img = gif.images?.fixed_height_small?.url || gif.images?.downsized?.url || gif.images?.original?.url || '';
                      const alt = (gif.title || '').slice(0, 24);
                      return img ? (
                        <button key={gif.id} className="ep-gif-btn" onClick={() => { onSelectGif(img); onClose(); }}>
                          <img src={img} alt={alt} loading="lazy" />
                          <span className="ep-gif-tag">{alt}</span>
                        </button>
                      ) : null;
                    })
              }
            </div>
          </div>
          <div className="ep-giphy-attr">
            Powered by <strong style={{ marginLeft: 3 }}>GIPHY</strong>
          </div>
        </div>

        {/* ── STICKER PANEL ── */}
        <div className={`ep-panel ${tab === 'sticker' ? 'active' : ''}`}>
          <div className="ep-scroll">
            <div className="ep-sticker-grid">
              {stickerResults.length === 0
                ? <div className="ep-no-res" style={{ gridColumn: '1/-1' }}>No stickers found</div>
                : stickerResults.map(pack => (
                    <>
                      {!query && <div key={pack.pack + '-lbl'} className="ep-pack-lbl">{pack.pack}</div>}
                      {pack.filtered.map(s => (
                        <button key={s} className="ep-sticker-btn" onClick={() => { onSelectSticker(s); onClose(); }} title={s}>
                          {s}
                        </button>
                      ))}
                    </>
                  ))
              }
            </div>
          </div>
        </div>

      </div>
    </>
  );
}