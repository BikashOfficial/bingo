import { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';

/**
 * Chat — Slide-in chat panel with message bubbles.
 * @param {boolean} isOpen
 * @param {function} onClose
 */
export default function Chat({ isOpen, onClose }) {
  const { state, dispatch } = useGame();
  const { socket } = useSocket();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'CLEAR_UNREAD_CHAT' });
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, state.chatMessages.length]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || !socket) return;
    socket.emit('send_chat', { roomCode: state.roomCode, message: msg });
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 max-w-[90vw] z-50 flex flex-col
        transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="glass h-full flex flex-col border-l border-violet-500/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <h3 className="font-bold text-slate-100">Chat</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.chatMessages.length === 0 && (
            <div className="text-center text-slate-600 text-sm mt-8">
              <p className="text-2xl mb-2">💬</p>
              <p>No messages yet.</p>
              <p>Say hi to your opponent!</p>
            </div>
          )}
          {state.chatMessages.map((msg, i) => {
            const isMe = msg.sender === state.playerName;
            return (
              <div key={i} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
                <span className="text-xs text-slate-500 px-1">{msg.sender}</span>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm font-medium break-words
                    ${isMe
                      ? 'bg-violet-600/80 text-white rounded-tr-sm' /////
                      : 'bg-slate-700/70 text-slate-100 rounded-tl-sm'
                    }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-slate-700/40">
          <div className="flex gap-2">
            <input
              className="input-field flex-1 py-2 text-sm"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              maxLength={200}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30
                flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
