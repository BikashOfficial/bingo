import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useChatActions } from '../sockets/chatHandlers';
import MessageBubble from '../components/chat/MessageBubble';
import EmojiGifPicker from '../components/chat/EmojiGifPicker';
import TypingIndicator from '../components/chat/TypingIndicator';
import UserList from '../components/chat/UserList';
import { toast } from 'react-hot-toast';

export default function ChatRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { state } = useChat();
  const { sendMessage, sendGif, sendImage, editMessage, unsendMessage, reactToMessage, sendTyping, leaveRoom } = useChatActions();

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef(null);

  // Redirect if not in a room (passing roomCode in state to auto-join)
  useEffect(() => {
    if (!state.roomCode) {
      navigate('/chat', { replace: true, state: { autoJoinCode: roomCode } });
    }
  }, [state.roomCode, roomCode, navigate]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // ── Typing indicator logic ──────────────────────────────────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(roomCode, true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(roomCode, false);
    }, 1500);
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(roomCode, trimmed, replyTo ? { id: replyTo.id, senderName: replyTo.senderName, senderAvatar: replyTo.senderAvatar, text: replyTo.text, type: replyTo.type } : null);
    setText('');
    setReplyTo(null);
    clearTimeout(typingTimer.current);
    isTypingRef.current = false;
    sendTyping(roomCode, false);
    
    // Maintain keyboard focus on mobile/touch screens
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  }, [text, roomCode, replyTo, sendMessage, sendTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;

        e.preventDefault();

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Data = event.target.result;
          const isGif = file.type === 'image/gif';

          if (isGif) {
            sendGif(roomCode, base64Data, replyTo ? { id: replyTo.id, senderName: replyTo.senderName, senderAvatar: replyTo.senderAvatar, text: '🖼 GIF', type: 'gif' } : null);
          } else {
            sendImage(roomCode, base64Data, replyTo ? { id: replyTo.id, senderName: replyTo.senderName, senderAvatar: replyTo.senderAvatar, text: '🖼 Sticker', type: 'image' } : null);
          }
          setReplyTo(null);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // ── GIF / Sticker send ──────────────────────────────────────────────────────
  const handleGif = useCallback((gifUrl) => {
    sendGif(roomCode, gifUrl, replyTo ? { id: replyTo.id, senderName: replyTo.senderName, senderAvatar: replyTo.senderAvatar, text: '🖼 GIF', type: 'gif' } : null);
    setReplyTo(null);
  }, [roomCode, replyTo, sendGif]);

  const handleSticker = useCallback((sticker) => {
    sendMessage(roomCode, sticker, null);
  }, [roomCode, sendMessage]);

  // ── Copy room code ──────────────────────────────────────────────────────────
  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Room code copied!');
    });
  };

  // ── Copy direct invite link ──────────────────────────────────────────────────
  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/chat/room/${roomCode}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success('Direct invite link copied!');
    });
  };

  // ── Navigation / Leave handlers ──────────────────────────────────────────────
  const handleBack = () => {
    navigate('/', { replace: true });
  };

  const handleLeave = () => {
    leaveRoom(roomCode);
    navigate('/', { replace: true });
  };

  if (!state.roomCode) return null;

  // Filter own typing from list
  const otherTyping = state.typingUsers.filter((n) => n !== state.me?.displayName);

  return (
    <div className="chat-root">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="chat-header">
        <button onClick={handleBack} className="chat-back-btn" title="Back to menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="chat-header-info">
          <div className="chat-room-title">
            <span>💬</span>
            <span>Chat Room</span>
          </div>
          <div className="chat-room-meta">
            <span className="chat-online-dot" />
            <span>{state.members.length} member{state.members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="chat-header-actions">
          {/* Room code chip */}
          <button onClick={copyCode} className="room-code-chip" title="Copy room code">
            <span className="room-code-text">{roomCode}</span>
            <span className="room-code-icon">{copied ? '✓' : '⎘'}</span>
          </button>

          {/* Share Link button */}
          <button onClick={copyInviteLink} className="chat-icon-btn" title="Copy direct invite link">
            {copiedLink ? (
              <span style={{ fontSize: '1rem', color: '#10b981', fontWeight: 'bold' }}>✓</span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zm-12 7a3 3 0 11-6 0 3 3 0 016 0zm12 7a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Members button */}
          <button onClick={() => setShowUserList(true)} className="chat-icon-btn" title="Members">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Leave Room button */}
          <button onClick={handleLeave} className="chat-icon-btn text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" title="Leave Room">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <main className="chat-messages" id="chat-messages-container">
        {state.messages.length === 0 && (
          <div className="chat-empty">
            <span className="chat-empty-icon">👋</span>
            <p className="chat-empty-title">Room is ready!</p>
            <p className="chat-empty-sub" style={{ marginBottom: '1.25rem' }}>
              Invite friends to join this private room using the options below:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '240px' }}>
              <button onClick={copyCode} className="btn-secondary" style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', borderRadius: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span>{copied ? '✓' : '⎘'}</span> {copied ? 'Room Code Copied!' : 'Copy Room Code'}
              </button>
              <button onClick={copyInviteLink} className="btn-primary" style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', borderRadius: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: 'none' }}>
                <span>{copiedLink ? '✓' : '🔗'}</span> {copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}
              </button>
            </div>
          </div>
        )}

        {state.messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMe={msg.senderName === state.me?.displayName}
            onReply={setReplyTo}
            onEdit={(msgId, newText) => editMessage(roomCode, msgId, newText)}
            onUnsend={(msgId) => unsendMessage(roomCode, msgId)}
            onReact={(msgId, emoji) => reactToMessage(roomCode, msgId, emoji)}
          />
        ))}

        {/* Typing indicator */}
        {otherTyping.length > 0 && (
          <TypingIndicator users={otherTyping} />
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* ── Reply preview bar ──────────────────────────────────────────────── */}
      {replyTo && (
        <div className="reply-bar-wrap">
          <div className="reply-bar-content">
            <div className="reply-bar-accent" />
            <div className="reply-bar-info">
              <span className="reply-bar-name">Replying to {replyTo.senderName}</span>
              <span className="reply-bar-preview">
                {replyTo.type === 'gif' ? '🖼 GIF' : replyTo.text?.slice(0, 50)}
              </span>
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} className="reply-bar-close">✕</button>
        </div>
      )}

      {/* ── Emoji/GIF/Sticker Picker ───────────────────────────────────────── */}
      {showPicker && (
        <EmojiGifPicker
          onSelectEmoji={(e) => setText((t) => t + e)}
          onSelectGif={handleGif}
          onSelectSticker={handleSticker}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* ── Input bar ──────────────────────────────────────────────────────── */}
      <footer className="chat-input-bar">
        <button
          onClick={() => setShowPicker((v) => !v)}
          className={`chat-tool-btn ${showPicker ? 'chat-tool-btn-active' : ''}`}
          title="Emoji / GIF / Sticker"
        >
          😊
        </button>

        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            id="chat-text-input"
            className="chat-textarea"
            placeholder="Message…"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
            maxLength={1000}
          />
        </div>

        <button
          id="chat-send-btn"
          onClick={handleSend}
          onMouseDown={(e) => e.preventDefault()} // prevent focus loss on mouse clicks
          disabled={!text.trim()}
          className="chat-send-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </footer>

      {/* ── User list panel ────────────────────────────────────────────────── */}
      {showUserList && (
        <div className="userlist-overlay" onClick={() => setShowUserList(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <UserList
              members={state.members}
              me={state.me}
              onClose={() => setShowUserList(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
