import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useDotsBoxes } from '../context/DotsBoxesContext';
import { toast } from 'react-hot-toast';

export default function DotsBoxesHomePage() {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { state, dispatch } = useDotsBoxes();
  const [playerName, setPlayerName] = useState(state.playerName || '');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name first!');
      return;
    }
    if (!connected) {
      toast.error('Connecting to server... Please wait.');
      return;
    }
    dispatch({ type: 'DB_SET_PLAYER_NAME', payload: playerName.trim() });
    setLoading(true);
    socket.emit('db_create_room', { playerName: playerName.trim() });
    setTimeout(() => setLoading(false), 3000);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name first!');
      return;
    }
    if (!roomCodeInput.trim()) {
      toast.error('Please enter a room code!');
      return;
    }
    if (!connected) {
      toast.error('Connecting to server... Please wait.');
      return;
    }
    dispatch({ type: 'DB_SET_PLAYER_NAME', payload: playerName.trim() });
    setLoading(true);
    socket.emit('db_join_room', {
      roomCode: roomCodeInput.toUpperCase().trim(),
      playerName: playerName.trim(),
    });
    setTimeout(() => setLoading(false), 4000);
  };

  const floatingBalls = [
    { size: 300, top: '-5%', left: '-5%', color: 'bg-amber-500' },
    { size: 200, bottom: '10%', right: '-5%', color: 'bg-orange-500' },
    { size: 150, top: '50%', left: '60%', color: 'bg-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-animated flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {floatingBalls.map((b, i) => (
        <div
          key={i}
          className={`bg-blob ${b.color} animate-spin-slow`}
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            bottom: b.bottom,
            left: b.left,
            right: b.right,
          }}
        />
      ))}

      {/* Connection indicator */}
      <div className={`fixed top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold z-10
        ${connected ? 'bg-green-900/40 text-green-300 border border-green-700/30' : 'bg-red-900/40 text-red-300 border border-red-700/30'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        {connected ? 'Connected' : 'Connecting...'}
      </div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Back button */}
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-700 shadow-2xl shadow-amber-900/60 mb-4 animate-glow">
            <span className="text-4xl">🔲</span>
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400 mb-2">
            DOTS & BOXES
          </h1>
          <p className="text-slate-400 font-medium">Claim the most boxes to win 🏆</p>
        </div>

        {/* Card */}
        <div className="card space-y-5">
          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Your Name
            </label>
            <input
              id="db-player-name-input"
              className="input-field"
              placeholder="Enter your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && (activeTab === 'create' ? handleCreateRoom() : handleJoinRoom())}
            />
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl">
            <button
              id="db-create-tab-btn"
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                ${activeTab === 'create'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                  : 'text-slate-400 hover:text-slate-200'}`}
            >
              ✨ Create Room
            </button>
            <button
              id="db-join-tab-btn"
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                ${activeTab === 'join'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                  : 'text-slate-400 hover:text-slate-200'}`}
            >
              🚀 Join Room
            </button>
          </div>

          {/* Create Room */}
          {activeTab === 'create' && (
            <div className="animate-fade-in space-y-3">
              <p className="text-slate-400 text-sm text-center">
                Create a private room and invite a friend using the room code.
              </p>
              <button
                id="db-create-room-btn"
                onClick={handleCreateRoom}
                disabled={loading || !connected}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>✨ Create Room</>
                )}
              </button>
            </div>
          )}

          {/* Join Room */}
          {activeTab === 'join' && (
            <div className="animate-fade-in space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Room Code
                </label>
                <input
                  id="db-room-code-input"
                  className="input-field uppercase tracking-widest font-bold text-lg text-center"
                  placeholder="XXXXXX"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>
              <button
                id="db-join-room-btn"
                onClick={handleJoinRoom}
                disabled={loading || !connected || roomCodeInput.length < 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Joining...
                  </>
                ) : (
                  <>🚀 Join Game</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          2-player Dots & Boxes · Powered by Socket.IO
        </p>
      </div>
    </div>
  );
}
