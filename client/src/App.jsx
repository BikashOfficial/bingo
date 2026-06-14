import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import { ChatProvider } from './context/ChatContext';
import LandingPage from './pages/LandingPage';
import ChatEntryPage from './pages/ChatEntryPage';
import ChatRoomPage from './pages/ChatRoomPage';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import ResultPage from './pages/ResultPage';
import { useSocketHandlers } from './sockets/socketHandlers';
import { useChatListeners } from './sockets/chatHandlers';

function GameSocketManager() {
  useSocketHandlers();
  return null;
}

function ChatSocketManager() {
  useChatListeners();
  return null;
}

export default function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <ChatProvider>
          <BrowserRouter>
            <GameSocketManager />
            <ChatSocketManager />
            <Routes>
              {/* ── Landing ─────────────────────────── */}
              <Route path="/" element={<LandingPage />} />

              {/* ── Chat Room ───────────────────────── */}
              <Route path="/chat" element={<ChatEntryPage />} />
              <Route path="/chat/room/:roomCode" element={<ChatRoomPage />} />

              {/* ── Bingo Game ──────────────────────── */}
              <Route path="/bingo" element={<HomePage />} />
              <Route path="/bingo/lobby" element={<LobbyPage />} />
              <Route path="/bingo/game" element={<GamePage />} />
              <Route path="/bingo/result" element={<ResultPage />} />

              {/* ── Fallback ────────────────────────── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-center"
            gutter={8}
            containerStyle={{ top: 60 }}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
              },
              success: {
                iconTheme: { primary: '#8b5cf6', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#f43f5e', secondary: '#fff' },
              },
            }}
          />
        </ChatProvider>
      </GameProvider>
    </SocketProvider>
  );
}
