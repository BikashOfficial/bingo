import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import BingoBoard from '../components/BingoBoard';
import BingoProgress from '../components/BingoProgress';
import Chat from '../components/Chat';

export default function GamePage() {
  const { state, dispatch } = useGame();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  const {
    playerName, opponentName, opponentConnected,
    myBoard, myMarkedCells, myCompletedLines,
    markedNumbers, bingoLetters,
    myScore, opponentScoreSession, totalGames,
    roomCode, gameState, disconnectMessage, unreadChat,
    isMyTurn, currentTurn,
  } = state;

  useEffect(() => {
    if (!roomCode || gameState === 'home') {
      navigate('/');
    }
  }, [roomCode, gameState, navigate]);

  // Guard
  if (!roomCode || gameState === 'home') {
    return null;
  }

  const stateRef = useRef(state);
  const socketRef = useRef(socket);

  useEffect(() => {
    stateRef.current = state;
    socketRef.current = socket;
  }, [state, socket]);

  const handleCellClick = useCallback((number) => {
    const currentState = stateRef.current;
    const currentSocket = socketRef.current;
    
    if (!currentSocket || currentState.gameState !== 'playing') return;
    
    if (!currentState.isMyTurn) {
      toast("It's not your turn!", {
        icon: '🚫',
        style: { background: '#1e293b', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' },
        duration: 1500,
      });
      return;
    }
    
    if (currentState.markedNumbers.includes(number)) {
      toast('Already marked!', { icon: '⚠️', duration: 1200 });
      return;
    }
    
    currentSocket.emit('mark_number', { roomCode: currentState.roomCode, number });
  }, []);

  const handleLeave = () => {
    if (socket) {
      socket.emit('leave_room', { roomCode });
    }
    dispatch({ type: 'LEAVE_ROOM' });
    navigate('/');
  };

  const handleChatToggle = () => {
    setChatOpen((prev) => !prev);
    if (!chatOpen) dispatch({ type: 'CLEAR_UNREAD_CHAT' });
  };

  return (
    <div className="min-h-screen bg-animated relative">
      {/* Disconnect banner */}
      {disconnectMessage && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600/90 text-white text-sm font-semibold text-center py-2.5 px-4 flex items-center justify-center gap-2 animate-slide-up">
          <span className="animate-pulse">⚠️</span>
          {disconnectMessage}
        </div>
      )}

      {/* Chat panel */}
      <Chat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      {chatOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setChatOpen(false)} />
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="glass border-b border-slate-700/30 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Room code */}
          <div className="flex items-center gap-2">
            <span className="text-lg">🎲</span>
            <span className="text-sm font-black text-violet-300 font-mono tracking-widest">{roomCode}</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-3">
            <div className="text-center min-w-[36px]">
              <p className="text-[10px] text-slate-500 font-medium truncate max-w-[60px]">{playerName}</p>
              <p className="text-xl font-black text-violet-400 leading-tight">{myScore}</p>
            </div>
            <span className="text-slate-600 font-bold text-xs">vs</span>
            <div className="text-center min-w-[36px]">
              <p className="text-[10px] text-slate-500 font-medium truncate max-w-[60px]">{opponentName || 'Opp.'}</p>
              <p className="text-xl font-black text-cyan-400 leading-tight">{opponentScoreSession}</p>
            </div>
          </div>

          {/* Chat + Leave */}
          <div className="flex items-center gap-2">
            <button
              id="chat-toggle-btn"
              onClick={handleChatToggle}
              className="relative w-9 h-9 rounded-xl glass-light flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              💬
              {unreadChat > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadChat > 9 ? '9+' : unreadChat}
                </span>
              )}
            </button>
            <button
              onClick={handleLeave}
              className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 flex items-center justify-center transition-colors"
              title="Leave game"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Turn indicator banner */}
        <div className={`rounded-2xl px-4 py-3 flex items-center justify-center gap-3 font-bold text-sm transition-all duration-500
          ${isMyTurn
            ? 'bg-green-600/20 border border-green-500/40 text-green-300'
            : 'bg-slate-800/60 border border-slate-600/30 text-slate-400'
          }`}>
          {isMyTurn ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              Your turn — pick a number!
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-bounce" />
              {opponentName ? `${opponentName}'s turn...` : "Opponent's turn..."}
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
            </>
          )}
        </div>

        {/* BINGO Progress */}
        <BingoProgress bingoLetters={bingoLetters} completedCount={myCompletedLines.length} />

        {/* Player's Board — the only board shown */}
        <BingoBoard
          board={myBoard}
          markedCells={myMarkedCells}
          completedLines={myCompletedLines}
          isMyTurn={isMyTurn}
          onCellClick={handleCellClick}
          label={`${playerName}'s Board`}
        />

        {/* Opponent status strip */}
        <div className={`card py-3 flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opponentConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-sm font-medium text-slate-300">{opponentName || 'Opponent'}</span>
            {!opponentConnected && <span className="text-xs text-red-400">(disconnected)</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Wins:</span>
            <span className="text-sm font-bold text-cyan-400">{opponentScoreSession}</span>
          </div>
        </div>

        {/* Called numbers log */}
        {markedNumbers.length > 0 && (
          <div className="card animate-fade-in">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">
              Called Numbers ({markedNumbers.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {markedNumbers.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-700/50 text-red-200 text-xs font-bold border border-red-500/30"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
