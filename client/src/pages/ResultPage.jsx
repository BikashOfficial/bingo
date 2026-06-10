import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import Confetti from '../components/Confetti';

export default function ResultPage() {
  const { state, dispatch } = useGame();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [requestedRematch, setRequestedRematch] = useState(false);

  const { winner, isWinner, playerName, opponentName, myScore, opponentScoreSession, totalGames, roomCode } = state;

  useEffect(() => {
    if (!winner) {
      navigate('/');
    }
  }, [winner, navigate]);

  if (!winner) {
    return null;
  }

  const handlePlayAgain = () => {
    if (!socket) return;
    setRequestedRematch(true);
    socket.emit('play_again', { roomCode });
  };

  const handleLeave = () => {
    if (socket) {
      socket.emit('leave_room', { roomCode });
    }
    dispatch({ type: 'LEAVE_ROOM' });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-animated flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Confetti for winner */}
      {isWinner && <Confetti />}

      {/* Background blobs */}
      <div className="bg-blob bg-violet-500" style={{ width: 400, height: 400, top: '-10%', left: '-10%' }} />
      <div className="bg-blob bg-cyan-500" style={{ width: 300, height: 300, bottom: '-5%', right: '-5%' }} />
      {isWinner && (
        <div className="bg-blob bg-yellow-400" style={{ width: 250, height: 250, top: '40%', left: '40%' }} />
      )}

      <div className={`w-full max-w-sm animate-scale-in relative z-10 ${isWinner ? 'victory-card' : ''}`}>
        {/* Result card */}
        <div className={`card text-center ${
          isWinner
            ? 'border-amber-400/40 shadow-2xl shadow-amber-900/30'
            : 'border-slate-700/40'
        }`}>
          {/* Emoji */}
          <div className="text-7xl mb-4 animate-bounce-in">
            {isWinner ? '🏆' : '😔'}
          </div>

          {/* Title */}
          <h1 className={`text-4xl font-black mb-2 ${
            isWinner
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500'
              : 'text-slate-300'
          }`}>
            {isWinner ? 'BINGO!' : 'So Close!'}
          </h1>

          <p className={`text-lg font-semibold mb-1 ${isWinner ? 'text-amber-300' : 'text-slate-400'}`}>
            {isWinner ? '🎉 You Won!' : `${winner} won this round`}
          </p>
          <p className="text-slate-500 text-sm mb-6">
            {isWinner ? 'Amazing! You completed 5 lines first!' : 'Better luck next time!'}
          </p>

          {/* Score board */}
          <div className="glass-light rounded-2xl p-4 mb-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Session Stats</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-2xl font-black text-violet-400">{myScore}</p>
                <p className="text-xs text-slate-500">Your Wins</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-400">{totalGames}</p>
                <p className="text-xs text-slate-500">Games</p>
              </div>
              <div>
                <p className="text-2xl font-black text-cyan-400">{opponentScoreSession}</p>
                <p className="text-xs text-slate-500">{opponentName || 'Opp.'} Wins</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              id="play-again-btn"
              onClick={handlePlayAgain}
              disabled={requestedRematch}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {requestedRematch ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Waiting for opponent...
                </>
              ) : (
                <>🔄 Play Again</>
              )}
            </button>

            <button
              id="leave-room-btn"
              onClick={handleLeave}
              className="btn-secondary w-full py-3.5"
            >
              🚪 Leave Room
            </button>
          </div>
        </div>

        {/* Win streak */}
        {myScore > 1 && (
          <div className="mt-4 text-center animate-fade-in">
            <span className="text-sm text-amber-400 font-semibold">
              🔥 {myScore}-game win streak!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
