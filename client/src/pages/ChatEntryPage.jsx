import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import { useChatActions } from '../sockets/chatHandlers';
import { toast } from 'react-hot-toast';

export default function ChatEntryPage() {
  const navigate = useNavigate();
  const { connected } = useSocket();
  const { state } = useChat();
  const { createRoom, joinRoom } = useChatActions();
  const [displayName, setDisplayName] = useState('');
  
  const [roomCode, setRoomCode] = useState('');
  const [tab, setTab] = useState('create');
  const [loading, setLoading] = useState(false);

  // Navigate to chat room once we have a room code from context
  useEffect(() => {
    if (state.roomCode) {
      navigate(`/chat/room/${state.roomCode}`, { replace: true });
    }
  }, [state.roomCode, navigate]);

  const handleCreate = () => {
    if (!displayName.trim()) { toast.error('Enter your display name!'); return; }
    if (!connected) { toast.error('Connecting… please wait.'); return; }
    setLoading(true);
    createRoom(displayName.trim());
    setTimeout(() => setLoading(false), 3000);
  };

  const handleJoin = () => {
    if (!displayName.trim()) { toast.error('Enter your display name!'); return; }
    if (roomCode.trim().length < 6) { toast.error('Enter a valid 6‑character room code!'); return; }
    if (!connected) { toast.error('Connecting… please wait.'); return; }
    setLoading(true);
    joinRoom(roomCode.trim().toUpperCase(), displayName.trim());
    setTimeout(() => setLoading(false), 4000);
  };

  return (
    <div className="landing-root">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="entry-container">
        {/* Back button */}
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="entry-header">
          <div className="entry-icon-ring">
            <span style={{ fontSize: 32 }}>💬</span>
          </div>
          <h1 className="entry-title">Chat Room</h1>
          <p className="entry-sub">Create or join a private room — no account needed.</p>
        </div>

        {/* Card */}
        <div className="entry-card">
          {/* Name */}
          <div className="field-group">
            <label className="field-label">Your Display Name</label>
            <input
              id="chat-display-name"
              className="field-input"
              placeholder="e.g. Cosmic Wolf 🐺"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 20))}
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
            />
          </div>

          {/* Tabs */}
          <div className="entry-tabs">
            <button
              id="entry-create-tab"
              onClick={() => setTab('create')}
              className={`entry-tab ${tab === 'create' ? 'entry-tab-active' : ''}`}
            >
              ✨ Create
            </button>
            <button
              id="entry-join-tab"
              onClick={() => setTab('join')}
              className={`entry-tab ${tab === 'join' ? 'entry-tab-active' : ''}`}
            >
              🚀 Join
            </button>
          </div>

          {tab === 'create' && (
            <div className="tab-content">
              <p className="tab-hint">
                A private room code will be generated for you to share.
              </p>
              <button
                id="chat-create-btn"
                onClick={handleCreate}
                disabled={loading || !connected}
                className="entry-btn entry-btn-primary"
              >
                {loading ? <Spinner /> : '✨ Create Room'}
              </button>
            </div>
          )}

          {tab === 'join' && (
            <div className="tab-content">

              <div className="field-group">
                <label className="field-label">Room Code</label>
                <input
                  id="chat-room-code"
                  className="field-input field-code"
                  placeholder="XXXXXX"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>
              <button
                id="chat-join-btn"
                onClick={handleJoin}
                disabled={loading || !connected || roomCode.length < 6}
                className="entry-btn entry-btn-primary"
              >
                {loading ? <Spinner /> : '🚀 Join Room'}
              </button>
            </div>
          )}
        </div>

        {/* Connection badge */}
        <div className={`conn-badge ${connected ? 'conn-ok' : 'conn-off'}`}>
          <span className={`conn-dot ${connected ? 'conn-dot-ok' : ''}`} />
          {connected ? 'Connected' : 'Connecting…'}
        </div>
      </div>
    </div>
  );
}


function Spinner() {
  return (
    <svg className="spin-icon" viewBox="0 0 24 24" fill="none" width="20" height="20">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}
