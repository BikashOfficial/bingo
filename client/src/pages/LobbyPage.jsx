import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';

export default function LobbyPage() {
  const { state, dispatch } = useGame();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { roomCode, playerName } = state;

  useEffect(() => {
    if (!roomCode) {
      navigate('/bingo');
    }
  }, [roomCode, navigate]);

  // Guard: if no room code, redirect home
  if (!roomCode) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast.success('Room code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('input');
      el.value = roomCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = () => {
    if (socket) {
      socket.emit('leave_room', { roomCode });
    }
    dispatch({ type: 'LEAVE_ROOM' });
    navigate('/bingo');
  };

  return (
    <div className="min-h-screen bg-animated flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="bg-blob bg-violet-500 animate-spin-slow" style={{ width: 400, height: 400, top: '-10%', left: '-10%' }} />
      <div className="bg-blob bg-cyan-500 animate-spin-slow" style={{ width: 300, height: 300, bottom: '-5%', right: '-5%' }} />

      <div className="w-full max-w-sm animate-scale-in relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 shadow-xl shadow-violet-900/50 mb-4">
            <span className="text-3xl">🎲</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-1">Waiting Room</h1>
          <p className="text-slate-400 text-sm">Share the code with your friend</p>
        </div>

        {/* Room code card */}
        <div className="card mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold text-center mb-3">
            Room Code
          </p>
          <div
            className="flex items-center justify-center gap-3 p-4 rounded-xl bg-navy-950/60 border border-violet-500/20 cursor-pointer hover:border-violet-400/40 transition-colors"
            onClick={handleCopy}
          >
            <span className="text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 font-mono">
              {roomCode}
            </span>
          </div>

          <button
            id="copy-room-code-btn"
            onClick={handleCopy}
            className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${copied
                ? 'bg-green-600/80 text-white'
                : 'btn-secondary text-slate-300'}`}
          >
            {copied ? '✅ Copied!' : '📋 Copy Code'}
          </button>
        </div>

        {/* Players */}
        <div className="card mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Players</p>
          <div className="space-y-3">
            {/* Me */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-900/20 border border-violet-500/20">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
                {playerName?.[0]?.toUpperCase() || 'Y'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{playerName}</p>
                <p className="text-xs text-violet-400">You — Host</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>

            {/* Opponent slot */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center text-slate-500 text-lg">
                ?
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">Waiting for player...</p>
                <p className="text-xs text-slate-600">Share the code above</p>
              </div>
              {/* Pulsing dots */}
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="glass-light rounded-xl p-3 mb-4 text-center">
          <p className="text-xs text-slate-400">
            🎯 Game starts automatically when your friend joins
          </p>
        </div>

        <button
          onClick={handleLeave}
          className="btn-danger w-full"
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  );
}
