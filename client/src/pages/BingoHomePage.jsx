import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { toast } from 'react-hot-toast';
import LobbyEntryTemplate from '../components/LobbyEntryTemplate';

export default function BingoHomePage() {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { state, dispatch } = useGame();
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = (playerName) => {
    if (!playerName.trim()) {
      toast.error('Please enter your name first!');
      return;
    }
    if (!connected) {
      toast.error('Connecting to server... Please wait.');
      return;
    }
    dispatch({ type: 'SET_PLAYER_NAME', payload: playerName.trim() });
    setLoading(true);
    socket.emit('create_room', { playerName: playerName.trim() });
    setTimeout(() => setLoading(false), 3000);
  };

  const handleJoinRoom = (roomCode, playerName) => {
    if (!playerName.trim()) {
      toast.error('Please enter your name first!');
      return;
    }
    if (!roomCode.trim()) {
      toast.error('Please enter a room code!');
      return;
    }
    if (!connected) {
      toast.error('Connecting to server... Please wait.');
      return;
    }
    dispatch({ type: 'SET_PLAYER_NAME', payload: playerName.trim() });
    setLoading(true);
    socket.emit('join_room', {
      roomCode: roomCode.toUpperCase().trim(),
      playerName: playerName.trim(),
    });
    setTimeout(() => setLoading(false), 4000);
  };

  const features = [
    { icon: '🎯', text: 'Live matching' },
    { icon: '⚡', text: 'Instant play' },
    { icon: '🔄', text: 'Automatic sync' },
  ];

  return (
    <LobbyEntryTemplate
      title="BINGO"
      subtitle="Real-time multiplayer fun 🎮"
      icon="🎱"
      features={features}
      theme="indigo"
      initialPlayerName={state.playerName || ''}
      connected={connected}
      loading={loading}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      onBack={() => navigate('/')}
      createHint="Create a private room and invite a friend using the room code."
      placeholderName="Enter your name..."
    />
  );
}
