import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import { useChatActions } from '../sockets/chatHandlers';
import { getOrCreateKeyPair } from '../utils/crypto';
import { toast } from 'react-hot-toast';
import LobbyEntryTemplate from '../components/LobbyEntryTemplate';

export default function ChatEntryPage() {
  const navigate = useNavigate();
  const { connected } = useSocket();
  const { state } = useChat();
  const { createRoom, joinRoom } = useChatActions();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.roomCode) {
      navigate(`/chat/room/${state.roomCode}`, { replace: true });
    }
  }, [state.roomCode, navigate]);

  const handleCreate = async (playerName) => {
    if (!playerName.trim()) {
      toast.error('Enter your display name!');
      return;
    }
    if (!connected) {
      toast.error('Connecting… please wait.');
      return;
    }
    setLoading(true);
    try {
      const keys = await getOrCreateKeyPair();
      createRoom(playerName.trim(), keys.publicJwk);
    } catch (err) {
      console.error('[E2EE] Key gen failed:', err);
      toast.error('Failed to initialize encryption keys.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (roomCode, playerName) => {
    if (!playerName.trim()) {
      toast.error('Enter your display name!');
      return;
    }
    if (roomCode.trim().length < 6) {
      toast.error('Enter a valid 6‑character room code!');
      return;
    }
    if (!connected) {
      toast.error('Connecting… please wait.');
      return;
    }
    setLoading(true);
    try {
      const keys = await getOrCreateKeyPair();
      joinRoom(roomCode.trim().toUpperCase(), playerName.trim(), keys.publicJwk);
    } catch (err) {
      console.error('[E2EE] Key gen failed:', err);
      toast.error('Failed to initialize encryption keys.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '🔒', text: 'End-to-end encrypted' },
    { icon: '⚡', text: 'Instant, no sign-up' },
    { icon: '🫧', text: 'Room vanishes on exit' },
  ];

  return (
    <LobbyEntryTemplate
      title="Chat Room"
      subtitle="Private rooms, zero accounts, gone when you leave."
      icon="💬"
      features={features}
      theme="purple"
      connected={connected}
      loading={loading}
      onCreateRoom={handleCreate}
      onJoinRoom={handleJoin}
      onBack={() => navigate('/')}
      createHint="We'll generate a shareable 6-letter code — send it to anyone you want in the room."
      placeholderName="Cosmic Wolf 🐺"
    />
  );
}