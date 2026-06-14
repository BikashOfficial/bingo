import { useState, useRef, useCallback } from 'react';
import ReactionPicker from './ReactionPicker';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isSingleEmoji(text) {
  if (!text) return false;
  const trimmed = text.trim();
  let charCount = 0;
  try {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    charCount = Array.from(segmenter.segment(trimmed)).length;
  } catch (e) {
    charCount = Array.from(trimmed).length;
  }
  
  if (charCount !== 1) return false;
  
  const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}\u200d\uFE0F]/u;
  const hasEmoji = emojiRegex.test(trimmed);
  const hasNormalText = /[a-zA-Z0-9]/g.test(trimmed);
  return hasEmoji && !hasNormalText;
}

export default function MessageBubble({ message, isMe, onReply, onEdit, onUnsend, onReact }) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const swipeTriggered = useRef(false);
  const longPressTimer = useRef(null);

  // ── System message ─────────────────────────────────────────────────────────
  if (message.type === 'system') {
    return (
      <div className="sys-msg-wrapper">
        <span className="sys-msg">{message.text}</span>
      </div>
    );
  }

  // ── Swipe to reply (touch) ─────────────────────────────────────────────────
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipeTriggered.current = false;

    // Long press for reaction picker / context menu
    longPressTimer.current = setTimeout(() => {
      setShowContextMenu(true);
      navigator.vibrate?.(50);
    }, 500);
  };

  const onTouchMove = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Cancel long press if user moves finger more than 10 pixels in any direction
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      clearTimeout(longPressTimer.current);
    }
    
    const dir = isMe ? -deltaX : deltaX; // me: swipe left; others: swipe right
    if (dir > 0 && dir < 80) {
      setSwipeDelta(Math.min(dir, 60));
    }
    if (dir > 55 && !swipeTriggered.current) {
      swipeTriggered.current = true;
      navigator.vibrate?.(10);
    }
  };

  const onTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if (swipeTriggered.current) {
      onReply(message);
    }
    setSwipeDelta(0);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const onTouchCancel = () => {
    clearTimeout(longPressTimer.current);
    setSwipeDelta(0);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // ── Right-click context menu (desktop) ────────────────────────────────────
  const onContextMenu = (e) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  const handleEdit = () => {
    setShowContextMenu(false);
    setIsEditing(true);
    setEditText(message.text);
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editText.trim() !== message.text) {
      onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleUnsend = () => {
    setShowContextMenu(false);
    onUnsend(message.id);
  };

  const handleReact = useCallback((emoji) => {
    onReact(message.id, emoji);
    setShowReactionPicker(false);
  }, [onReact, message.id]);

  const isEmojiMsg = message.type === 'text' && isSingleEmoji(message.text);
  const avatarLetter = message.senderAvatar?.letter || (message.senderName ? message.senderName[0].toUpperCase() : '?');
  const avatarBg = message.senderAvatar?.color || '#8b5cf6';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`msg-row ${isMe ? 'msg-row-me' : 'msg-row-other'}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      onContextMenu={!message.unsent ? onContextMenu : undefined}
    >
      {/* Swipe reply arrow */}
      {!isMe && swipeDelta > 10 && (
        <div className="swipe-arrow swipe-arrow-right" style={{ opacity: swipeDelta / 60 }}>↩</div>
      )}
      {isMe && swipeDelta > 10 && (
        <div className="swipe-arrow swipe-arrow-left" style={{ opacity: swipeDelta / 60 }}>↪</div>
      )}

      {/* Avatar for other users */}
      {!isMe && (
        <div
          className="msg-avatar animate-fade-in"
          style={{
            background: avatarBg,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            color: '#fff',
            fontSize: '0.875rem',
            flexShrink: 0,
            alignSelf: 'flex-end',
            marginBottom: '4px',
            marginRight: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            userSelect: 'none',
          }}
        >
          {avatarLetter}
        </div>
      )}

      <div className={`msg-col ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender name (not for me) */}
        {!isMe && (
          <span className="msg-sender" style={{ color: message.senderAvatar?.color || '#8b5cf6' }}>
            {message.senderName}
          </span>
        )}

        {/* Swipeable Bubble Wrapper (keeps transform scoped to avoid stacking context on backdrops) */}
        <div
          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full`}
          style={{ transform: `translateX(${isMe ? -swipeDelta : swipeDelta}px)`, transition: swipeDelta === 0 ? 'transform 0.2s ease' : 'none' }}
        >
          {/* Reply preview */}
          {message.replyTo && !message.unsent && (
            <div className={`reply-preview ${isMe ? 'reply-preview-me' : 'reply-preview-other'}`}>
              <div className="reply-bar" style={{ background: message.replyTo.senderAvatar?.color || '#8b5cf6' }} />
              <div className="reply-content">
                <span className="reply-sender">{message.replyTo.senderName}</span>
                <span className="reply-text">
                  {message.replyTo.type === 'gif' ? '🖼 GIF' :
                   message.replyTo.type === 'image' ? '🖼 Sticker' :
                   message.replyTo.type === 'sticker' ? `${message.replyTo.text}` :
                   message.replyTo.text?.slice(0, 60)}
                </span>
              </div>
            </div>
          )}

          {/* Bubble */}
          <div
            className={`msg-bubble ${isMe ? 'msg-bubble-me' : 'msg-bubble-other'} ${message.unsent ? 'msg-unsent' : ''} ${isEmojiMsg ? 'msg-bubble-emoji-only' : ''}`}
            onClick={() => !message.unsent && !isEditing && setShowReactionPicker(false)}
            onDoubleClick={() => !message.unsent && !isEditing && setShowContextMenu(true)}
          >
            {message.unsent ? (
              <span className="unsent-text">🚫 Message unsent</span>
            ) : isEditing ? (
              <div className="edit-input-wrap" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                <input
                  className="edit-input"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubmit();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  autoFocus
                />
                <div className="edit-actions">
                  <button onClick={(e) => { e.stopPropagation(); handleEditSubmit(); }} className="edit-save">Save</button>
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="edit-cancel">Cancel</button>
                </div>
              </div>
            ) : (message.type === 'gif' || message.type === 'image') ? (
              <img src={message.gifUrl || message.imageUrl} alt="Sticker / GIF" className="msg-gif" />
            ) : message.type === 'sticker' ? (
              <span className="msg-sticker">{message.text}</span>
            ) : (
              <span className={isEmojiMsg ? 'msg-text-emoji-only' : 'msg-text'}>{message.text}</span>
            )}

            {/* Timestamp + edited flag */}
            {!message.unsent && (
              <div className={`msg-meta ${isMe ? 'msg-meta-me' : 'msg-meta-other'}`}>
                {message.edited && <span className="edited-label">edited</span>}
                <span className="msg-time">{formatTime(message.timestamp)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reactions row */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="reactions-row">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className="reaction-chip"
                title={users.join(', ')}
              >
                {emoji} <span className="reaction-count">{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Reaction picker */}
        {showReactionPicker && (
          <ReactionPicker
            onReact={handleReact}
            onClose={() => setShowReactionPicker(false)}
          />
        )}

        {/* Context menu */}
        {showContextMenu && (
          <>
            <div className="ctx-backdrop" onClick={() => setShowContextMenu(false)} />
            <div className={`ctx-menu ${isMe ? 'ctx-menu-me' : 'ctx-menu-other'}`}>
              <button className="ctx-item" onClick={() => { setShowContextMenu(false); onReply(message); }}>
                ↩ Reply
              </button>
              <button className="ctx-item" onClick={() => { setShowContextMenu(false); setShowReactionPicker(true); }}>
                😊 React
              </button>
              {isMe && !message.unsent && message.type === 'text' && (
                <button className="ctx-item" onClick={handleEdit}>
                  ✏️ Edit
                </button>
              )}
              {isMe && !message.unsent && (
                <button className="ctx-item ctx-item-danger" onClick={handleUnsend}>
                  🗑 Unsend
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Avatar for me */}
      {isMe && (
        <div
          className="msg-avatar animate-fade-in"
          style={{
            background: avatarBg,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            color: '#fff',
            fontSize: '0.875rem',
            flexShrink: 0,
            alignSelf: 'flex-end',
            marginBottom: '4px',
            marginLeft: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            userSelect: 'none',
          }}
        >
          {avatarLetter}
        </div>
      )}
    </div>
  );
}

