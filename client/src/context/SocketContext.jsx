import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SocketContext = createContext(null);

// Create the socket ONCE outside React so it's never recreated on re-renders
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  autoConnect: true,
});

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      console.log('[Socket] Connected:', socket.id);
    };
    const handleDisconnect = () => {
      setConnected(false);
      console.log('[Socket] Disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // In case already connected when effect runs
    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  return useContext(SocketContext);
}
