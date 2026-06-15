import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useDotsBoxes } from '../context/DotsBoxesContext';

const ROWS = 7;
const COLS = 7;
const DOT_RADIUS = 8;
const DOT_SPACING = 70;
const PADDING = 20;
const LINE_THICKNESS = 6;
const BOX_SIZE = DOT_SPACING;

const BOARD_WIDTH = PADDING * 2 + (COLS - 1) * DOT_SPACING;
const BOARD_HEIGHT = PADDING * 2 + (ROWS - 1) * DOT_SPACING;

// Player colors
const PLAYER_COLORS = {
  p1Line: '#f59e0b',    // amber-500
  p1Box: 'rgba(245, 158, 11, 0.15)',
  p1BoxBorder: 'rgba(245, 158, 11, 0.4)',
  p2Line: '#3b82f6',    // blue-500
  p2Box: 'rgba(59, 130, 246, 0.15)',
  p2BoxBorder: 'rgba(59, 130, 246, 0.4)',
  undrawn: 'rgba(148, 163, 184, 0.15)',
  hover: 'rgba(251, 191, 36, 0.5)',
  dot: '#e2e8f0',
};

export default function DotsBoxesGamePage() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useDotsBoxes();
  const {
    roomCode, playerName, opponentName, mySocketId,
    horizontalLines, verticalLines, boxes,
    currentTurn, isMyTurn, myScore, opponentScore,
    drawnLineCount, totalLines, disconnectMessage, opponentConnected, gameState,
  } = state;

  // Determine which player index we are (for coloring)
  const players = useMemo(() => {
    return { p1: playerName, p2: opponentName };
  }, [playerName, opponentName]);

  const getLineColor = useCallback((drawnBy) => {
    if (!drawnBy) return PLAYER_COLORS.undrawn;
    // The room creator is always p1 on the server side
    // We color by: if drawnBy is the first player vs second
    if (drawnBy === players.p1) return PLAYER_COLORS.p1Line;
    return PLAYER_COLORS.p2Line;
  }, [players]);

  const getBoxColor = useCallback((owner) => {
    if (!owner) return 'transparent';
    if (owner === players.p1) return PLAYER_COLORS.p1Box;
    return PLAYER_COLORS.p2Box;
  }, [players]);

  const getBoxBorder = useCallback((owner) => {
    if (!owner) return 'transparent';
    if (owner === players.p1) return PLAYER_COLORS.p1BoxBorder;
    return PLAYER_COLORS.p2BoxBorder;
  }, [players]);

  const handleDrawLine = useCallback((lineType, row, col) => {
    if (!isMyTurn || !socket || !roomCode) return;
    socket.emit('db_draw_line', { roomCode, lineType, row, col });
  }, [isMyTurn, socket, roomCode]);

  const handleLeave = () => {
    if (socket && roomCode) {
      socket.emit('db_leave_room', { roomCode });
    }
    dispatch({ type: 'DB_LEAVE_ROOM' });
    navigate('/dotsboxes');
  };

  if (!roomCode || gameState === 'home') {
    navigate('/dotsboxes');
    return null;
  }

  return (
    <div className="min-h-screen bg-animated flex flex-col items-center px-4 py-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="bg-blob bg-amber-500/30 animate-spin-slow" style={{ width: 250, height: 250, top: '-5%', left: '-10%' }} />
      <div className="bg-blob bg-orange-500/30 animate-spin-slow" style={{ width: 180, height: 180, bottom: '5%', right: '-5%' }} />

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-red-400 bg-slate-800/50 hover:bg-red-950/30 border border-slate-700/50 hover:border-red-500/30 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Leave
          </button>
          <div className="text-xs text-slate-500 font-mono">
            Room: <span className="text-amber-400 font-bold">{roomCode}</span>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="flex items-stretch gap-3 mb-5">
          {/* My score */}
          <div className={`flex-1 rounded-2xl p-3 border transition-all duration-300 ${
            isMyTurn
              ? 'bg-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-900/20'
              : 'bg-slate-800/50 border-slate-700/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-amber-400 animate-pulse' : 'bg-amber-600'}`} />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">You</span>
            </div>
            <p className="text-sm font-bold text-white truncate">{playerName}</p>
            <p className="text-3xl font-black text-amber-400 mt-1">{myScore}</p>
            <p className="text-xs text-slate-500">boxes</p>
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-slate-600">VS</span>
            <div className="text-xs text-slate-600 mt-1">
              {drawnLineCount}/{totalLines}
            </div>
          </div>

          {/* Opponent score */}
          <div className={`flex-1 rounded-2xl p-3 border transition-all duration-300 ${
            !isMyTurn && currentTurn
              ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-900/20'
              : 'bg-slate-800/50 border-slate-700/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${!isMyTurn && currentTurn ? 'bg-blue-400 animate-pulse' : 'bg-blue-600'}`} />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Opponent</span>
            </div>
            <p className="text-sm font-bold text-white truncate">{opponentName || '...'}</p>
            <p className="text-3xl font-black text-blue-400 mt-1">{opponentScore}</p>
            <p className="text-xs text-slate-500">boxes</p>
          </div>
        </div>

        {/* Turn indicator */}
        <div className={`text-center mb-4 py-2 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
          isMyTurn
            ? 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
            : 'bg-blue-900/30 text-blue-300 border border-blue-500/30'
        }`}>
          {isMyTurn ? '🎯 Your Turn — Draw a line!' : `⏳ ${opponentName}'s Turn...`}
        </div>

        {/* Disconnect banner */}
        {disconnectMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm text-center">
            ⚠️ {disconnectMessage}
          </div>
        )}

        {/* Game Board */}
        <div className="flex justify-center">
          <div className="db-board-container rounded-2xl bg-slate-900/80 border border-slate-700/40 p-2 sm:p-4 shadow-2xl backdrop-blur-sm">
            <svg
              width={BOARD_WIDTH}
              height={BOARD_HEIGHT}
              viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
              className="db-board-svg"
            >
              {/* Boxes (filled rectangles) */}
              {boxes && boxes.map((row, r) =>
                row.map((owner, c) => (
                  <rect
                    key={`box-${r}-${c}`}
                    x={PADDING + c * DOT_SPACING + LINE_THICKNESS / 2}
                    y={PADDING + r * DOT_SPACING + LINE_THICKNESS / 2}
                    width={BOX_SIZE - LINE_THICKNESS}
                    height={BOX_SIZE - LINE_THICKNESS}
                    fill={getBoxColor(owner)}
                    stroke={getBoxBorder(owner)}
                    strokeWidth={owner ? 1.5 : 0}
                    rx={4}
                    className={owner ? 'db-box-claimed' : ''}
                  />
                ))
              )}

              {/* Box owner initials */}
              {boxes && boxes.map((row, r) =>
                row.map((owner, c) =>
                  owner ? (
                    <text
                      key={`box-text-${r}-${c}`}
                      x={PADDING + c * DOT_SPACING + BOX_SIZE / 2}
                      y={PADDING + r * DOT_SPACING + BOX_SIZE / 2 + 5}
                      textAnchor="middle"
                      className="db-box-initial"
                      fill={owner === players.p1 ? PLAYER_COLORS.p1Line : PLAYER_COLORS.p2Line}
                      fontSize="14"
                      fontWeight="800"
                      opacity="0.7"
                    >
                      {owner.charAt(0).toUpperCase()}
                    </text>
                  ) : null
                )
              )}

              {/* Horizontal lines */}
              {horizontalLines && horizontalLines.map((row, r) =>
                row.map((line, c) => {
                  const x1 = PADDING + c * DOT_SPACING;
                  const y1 = PADDING + r * DOT_SPACING;
                  const x2 = PADDING + (c + 1) * DOT_SPACING;
                  return (
                    <g key={`h-${r}-${c}`}>
                      {/* Clickable area (wider for easier clicking) */}
                      {!line.drawn && (
                        <rect
                          x={x1 + DOT_RADIUS}
                          y={y1 - 12}
                          width={x2 - x1 - DOT_RADIUS * 2}
                          height={24}
                          fill="transparent"
                          className={`db-line-hitbox ${isMyTurn ? 'db-line-clickable' : ''}`}
                          onClick={() => handleDrawLine('h', r, c)}
                        />
                      )}
                      {/* Visible line */}
                      <line
                        x1={x1 + DOT_RADIUS}
                        y1={y1}
                        x2={x2 - DOT_RADIUS}
                        y2={y1}
                        stroke={line.drawn ? getLineColor(line.drawnBy) : PLAYER_COLORS.undrawn}
                        strokeWidth={line.drawn ? LINE_THICKNESS : 3}
                        strokeLinecap="round"
                        className={`db-line ${line.drawn ? 'db-line-drawn' : ''} ${
                          !line.drawn && isMyTurn ? 'db-line-hover' : ''
                        }`}
                        onClick={() => !line.drawn && handleDrawLine('h', r, c)}
                        style={{ pointerEvents: !line.drawn && isMyTurn ? 'auto' : 'none' }}
                      />
                    </g>
                  );
                })
              )}

              {/* Vertical lines */}
              {verticalLines && verticalLines.map((row, r) =>
                row.map((line, c) => {
                  const x1 = PADDING + c * DOT_SPACING;
                  const y1 = PADDING + r * DOT_SPACING;
                  const y2 = PADDING + (r + 1) * DOT_SPACING;
                  return (
                    <g key={`v-${r}-${c}`}>
                      {/* Clickable area */}
                      {!line.drawn && (
                        <rect
                          x={x1 - 12}
                          y={y1 + DOT_RADIUS}
                          width={24}
                          height={y2 - y1 - DOT_RADIUS * 2}
                          fill="transparent"
                          className={`db-line-hitbox ${isMyTurn ? 'db-line-clickable' : ''}`}
                          onClick={() => handleDrawLine('v', r, c)}
                        />
                      )}
                      {/* Visible line */}
                      <line
                        x1={x1}
                        y1={y1 + DOT_RADIUS}
                        x2={x1}
                        y2={y2 - DOT_RADIUS}
                        stroke={line.drawn ? getLineColor(line.drawnBy) : PLAYER_COLORS.undrawn}
                        strokeWidth={line.drawn ? LINE_THICKNESS : 3}
                        strokeLinecap="round"
                        className={`db-line ${line.drawn ? 'db-line-drawn' : ''} ${
                          !line.drawn && isMyTurn ? 'db-line-hover' : ''
                        }`}
                        onClick={() => !line.drawn && handleDrawLine('v', r, c)}
                        style={{ pointerEvents: !line.drawn && isMyTurn ? 'auto' : 'none' }}
                      />
                    </g>
                  );
                })
              )}

              {/* Dots */}
              {Array.from({ length: ROWS }).map((_, r) =>
                Array.from({ length: COLS }).map((_, c) => (
                  <circle
                    key={`dot-${r}-${c}`}
                    cx={PADDING + c * DOT_SPACING}
                    cy={PADDING + r * DOT_SPACING}
                    r={DOT_RADIUS}
                    fill={PLAYER_COLORS.dot}
                    className="db-dot"
                  />
                ))
              )}
            </svg>
          </div>
        </div>

        {/* Game info footer */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-amber-500" />
            <span>{playerName} (You)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-blue-500" />
            <span>{opponentName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
