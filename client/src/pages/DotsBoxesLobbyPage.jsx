import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useDotsBoxes } from '../context/DotsBoxesContext';
import { toast } from 'react-hot-toast';

export default function DotsBoxesLobbyPage() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useDotsBoxes();
  const { roomCode, playerName } = state;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast.success('Room code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleLeave = () => {
    if (socket && roomCode) {
      socket.emit('db_leave_room', { roomCode });
    }
    dispatch({ type: 'DB_LEAVE_ROOM' });
    navigate('/dotsboxes');
  };

  if (!roomCode) {
    navigate('/dotsboxes');
    return null;
  }

  return (
    <div className="min-h-screen bg-animated flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="bg-blob bg-amber-500 animate-spin-slow" style={{ width: 300, height: 300, top: '-5%', left: '-5%' }} />
      <div className="bg-blob bg-orange-500 animate-spin-slow" style={{ width: 200, height: 200, bottom: '10%', right: '-5%' }} />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-700 shadow-2xl shadow-amber-900/60 mb-4 animate-glow">
            <span className="text-4xl">🔲</span>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400 mb-2">
            Waiting for Opponent
          </h1>
          <p className="text-slate-400 font-medium">
            Share the room code with your friend
          </p>
        </div>

        <div className="card space-y-6">
          {/* Player info */}
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-1">Playing as</p>
            <p className="text-xl font-bold text-white">{playerName}</p>
          </div>

          {/* Room code */}
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Room Code
            </p>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-3 px-8 py-4 bg-slate-800/80 hover:bg-slate-700/80 rounded-2xl border border-amber-500/20 transition-all duration-200 group"
            >
              <span className="text-4xl font-black tracking-[0.3em] text-amber-400 font-mono">
                {roomCode}
              </span>
              <svg
                className={`w-5 h-5 transition-all ${copied ? 'text-green-400 scale-110' : 'text-slate-400 group-hover:text-amber-400'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                {copied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
            </button>
          </div>

          {/* Waiting animation */}
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-amber-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-slate-400 text-sm font-medium">
              Waiting for player to join...
            </span>
          </div>

          {/* Leave button */}
          <button
            onClick={handleLeave}
            className="w-full py-3 rounded-xl font-semibold text-slate-400 hover:text-red-400 bg-slate-800/50 hover:bg-red-950/30 border border-slate-700/50 hover:border-red-500/30 transition-all duration-200"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
