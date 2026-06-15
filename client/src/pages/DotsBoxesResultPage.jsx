import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useDotsBoxes } from '../context/DotsBoxesContext';
import { toast } from 'react-hot-toast';

export default function DotsBoxesResultPage() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useDotsBoxes();
  const {
    roomCode, playerName, opponentName,
    winner, isWinner, isDraw,
    myScore, opponentScore,
    mySessionScore, opponentSessionScore, totalGames,
  } = state;

  const handlePlayAgain = () => {
    if (socket && roomCode) {
      socket.emit('db_play_again', { roomCode });
      toast('Waiting for opponent...', { icon: '🔄' });
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
      <div className="bg-blob bg-rose-500 animate-spin-slow" style={{ width: 150, height: 150, top: '50%', left: '60%' }} />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Result icon */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl shadow-2xl mb-4 animate-glow ${
            isDraw
              ? 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-900/60'
              : isWinner
                ? 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-900/60'
                : 'bg-gradient-to-br from-slate-600 to-slate-800 shadow-slate-900/60'
          }`}>
            <span className="text-5xl">
              {isDraw ? '🤝' : isWinner ? '🏆' : '😔'}
            </span>
          </div>
          <h1 className={`text-4xl font-black mb-2 ${
            isDraw
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-400'
              : isWinner
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-500'
          }`}>
            {isDraw ? "It's a Draw!" : isWinner ? 'You Win!' : 'You Lost'}
          </h1>
          <p className="text-slate-400 font-medium">
            {isDraw
              ? 'Both players claimed equal boxes!'
              : isWinner
                ? 'Great strategy! You dominated the grid!'
                : `${winner} outplayed you this time!`}
          </p>
        </div>

        <div className="card space-y-6">
          {/* Game scores */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              This Game
            </p>
            <div className="flex items-center gap-4">
              <div className={`flex-1 text-center p-4 rounded-xl border ${
                myScore > opponentScore
                  ? 'bg-amber-950/30 border-amber-500/30'
                  : 'bg-slate-800/50 border-slate-700/30'
              }`}>
                <p className="text-sm font-bold text-white mb-1">{playerName}</p>
                <p className="text-4xl font-black text-amber-400">{myScore}</p>
                <p className="text-xs text-slate-500 mt-1">boxes</p>
              </div>

              <div className="text-lg font-black text-slate-600">vs</div>

              <div className={`flex-1 text-center p-4 rounded-xl border ${
                opponentScore > myScore
                  ? 'bg-blue-950/30 border-blue-500/30'
                  : 'bg-slate-800/50 border-slate-700/30'
              }`}>
                <p className="text-sm font-bold text-white mb-1">{opponentName}</p>
                <p className="text-4xl font-black text-blue-400">{opponentScore}</p>
                <p className="text-xs text-slate-500 mt-1">boxes</p>
              </div>
            </div>
          </div>

          {/* Session stats */}
          {totalGames > 0 && (
            <div className="pt-4 border-t border-slate-700/30">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Session Stats — {totalGames} game{totalGames > 1 ? 's' : ''}
              </p>
              <div className="flex justify-center gap-8 text-sm">
                <div className="text-center">
                  <p className="text-amber-400 font-bold text-lg">{mySessionScore}</p>
                  <p className="text-slate-500 text-xs">Your Total</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 font-bold text-lg">{opponentSessionScore}</p>
                  <p className="text-slate-500 text-xs">{opponentName}'s Total</p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePlayAgain}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-900/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              🔄 Play Again
            </button>
            <button
              onClick={handleLeave}
              className="w-full py-3 rounded-xl font-semibold text-slate-400 hover:text-red-400 bg-slate-800/50 hover:bg-red-950/30 border border-slate-700/50 hover:border-red-500/30 transition-all duration-200"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
