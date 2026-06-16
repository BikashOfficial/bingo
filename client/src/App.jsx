import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import { ChatProvider } from './context/ChatContext';
import { DotsBoxesProvider } from './context/DotsBoxesContext';
import LandingPage from './pages/LandingPage';
import ChatEntryPage from './pages/ChatEntryPage';
import ChatRoomPage from './pages/ChatRoomPage';
import BingoHomePage from './pages/BingoHomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import ResultPage from './pages/ResultPage';
import DotsBoxesHomePage from './pages/DotsBoxesHomePage';
import DotsBoxesLobbyPage from './pages/DotsBoxesLobbyPage';
import DotsBoxesGamePage from './pages/DotsBoxesGamePage';
import DotsBoxesResultPage from './pages/DotsBoxesResultPage';
import { useSocketHandlers } from './sockets/socketHandlers';
import { useChatListeners } from './sockets/chatHandlers';
import { useDotsBoxesListeners } from './sockets/dotsBoxesHandlers';

function GameSocketManager() {
  useSocketHandlers();
  return null;
}

function ChatSocketManager() {
  useChatListeners();
  return null;
}

function DotsBoxesSocketManager() {
  useDotsBoxesListeners();
  return null;
}

export default function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <ChatProvider>
          <DotsBoxesProvider>
            <BrowserRouter>
              <GameSocketManager />
              <ChatSocketManager />
              <DotsBoxesSocketManager />
              <Routes>
                {/* ── Landing ─────────────────────────── */}
                <Route path="/" element={<LandingPage />} />

                {/* ── Chat Room ───────────────────────── */}
                <Route path="/chat" element={<ChatEntryPage />} />
                <Route path="/chat/room/:roomCode" element={<ChatRoomPage />} />

                {/* ── Bingo Game ──────────────────────── */}
                <Route path="/bingo" element={<BingoHomePage />} />
                <Route path="/bingo/lobby" element={<LobbyPage />} />
                <Route path="/bingo/game" element={<GamePage />} />
                <Route path="/bingo/result" element={<ResultPage />} />

                {/* ── Dots & Boxes ─────────────────────── */}
                <Route path="/dotsboxes" element={<DotsBoxesHomePage />} />
                <Route path="/dotsboxes/lobby" element={<DotsBoxesLobbyPage />} />
                <Route path="/dotsboxes/game" element={<DotsBoxesGamePage />} />
                <Route path="/dotsboxes/result" element={<DotsBoxesResultPage />} />

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
          </DotsBoxesProvider>
        </ChatProvider>
      </GameProvider>
    </SocketProvider>
  );
}
