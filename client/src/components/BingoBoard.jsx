import { useRef } from 'react';
import BingoCell from './BingoCell';

/**
 * Computes SVG line coordinates for a completed line index.
 * Line indices:
 *   0–4  → rows
 *   5–9  → columns
 *   10   → main diagonal (top-left → bottom-right)
 *   11   → anti-diagonal (top-right → bottom-left)
 *
 * We use a 100×100 viewBox. Each cell occupies 20 units.
 * Cell center for col/row i = i*20 + 10.
 *
 * @param {number} lineIdx
 * @returns {{ x1,y1,x2,y2 }}
 */
function getLineCoords(lineIdx) {
  const pad = 4; // slight inset from board edge
  const idx = Number(lineIdx);

  if (idx <= 4) {
    // Horizontal row
    const y = idx * 20 + 10;
    return { x1: pad, y1: y, x2: 100 - pad, y2: y };
  }
  if (idx <= 9) {
    // Vertical column
    const x = (idx - 5) * 20 + 10;
    return { x1: x, y1: pad, x2: x, y2: 100 - pad };
  }
  if (idx === 10) {
    // Main diagonal
    return { x1: pad, y1: pad, x2: 100 - pad, y2: 100 - pad };
  }
  // Anti-diagonal
  return { x1: 100 - pad, y1: pad, x2: pad, y2: 100 - pad };
}

/**
 * BingoBoard — Renders the player's own 5×5 board with:
 * - Red cells for marked numbers
 * - Animated SVG red strike-through lines on completed rows/cols/diagonals
 *
 * @param {number[][]}  board           — 5×5 grid of numbers
 * @param {boolean[][]} markedCells     — 5×5 marked state
 * @param {number[]}    completedLines  — indices of completed lines
 * @param {boolean}     isMyTurn        — whether it's this player's turn
 * @param {function}    onCellClick     — (number) => void
 * @param {string}      label           — board label
 */
export default function BingoBoard({ board, markedCells, completedLines = [], isMyTurn, onCellClick, label }) {
  const boardRef = useRef(null);

  // Loading skeleton
  if (!board || board.length === 0) {
    return (
      <div className="card animate-pulse">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="shimmer rounded-xl" style={{ aspectRatio: '1', minHeight: 52 }} />
          ))}
        </div>
      </div>
    );
  }

  const isCellInCompletedLine = (rowIdx, colIdx) => {
    for (const rawLine of completedLines) {
      const line = Number(rawLine);
      if (line <= 4 && line === rowIdx) return true;          // row
      if (line >= 5 && line <= 9 && (line - 5) === colIdx) return true;  // col
      if (line === 10 && rowIdx === colIdx) return true;       // main diag
      if (line === 11 && (rowIdx + colIdx) === 4) return true;  // anti-diag
    }
    return false;
  };

  return (
    <div className="card board-glow">
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-violet-300 tracking-wide">{label}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isMyTurn
              ? 'bg-green-500/20 text-green-300 border border-green-500/30 animate-pulse'
              : 'bg-slate-700/50 text-slate-500 border border-slate-600/30'
          }`}>
            {isMyTurn ? '🟢 Your Turn' : '⏳ Wait...'}
          </span>
        </div>
      )}

      {/* Column header letters */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-1.5">
        {['B', 'I', 'N', 'G', 'O'].map((l) => (
          <div
            key={l}
            className="flex items-center justify-center text-xs font-black text-violet-400/60 tracking-widest"
          >
            {l}
          </div>
        ))}
      </div>

      {/* Board grid + SVG overlay container */}
      <div className="relative" ref={boardRef}>
        {/* Grid */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {board.map((row, r) =>
            row.map((num, c) => (
              <BingoCell
                key={`${r}-${c}`}
                value={num}
                marked={markedCells?.[r]?.[c] || false}
                completed={isCellInCompletedLine(r, c)}
                isMyTurn={isMyTurn}
                onClick={() => onCellClick?.(num)}
              />
            ))
          )}
        </div>

        {/* SVG multi-colored strike-through lines overlay */}
        {completedLines.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ zIndex: 10 }}
          >
            <defs>
              <filter id="glow-line" filterUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {completedLines.map((lineIdx, i) => {
              const colors = [
                '#22c55e', // green
                '#3b82f6', // blue
                '#eab308', // yellow
                '#ffffff', // white
                '#000000'  // black
              ];
              const strokeColor = colors[i % colors.length];
              const { x1, y1, x2, y2 } = getLineCoords(lineIdx);
              return (
                <line
                  key={lineIdx}
                  x1={x1} y1={y1}
                  x2={x2} y2={y2}
                  stroke={strokeColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeOpacity="0.65"
                  filter="url(#glow-line)"
                  style={{
                    strokeDasharray: 200,
                    strokeDashoffset: 0,
                    animation: `drawLine 0.5s ease-out forwards`,
                  }}
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* Completed lines count */}
      {completedLines.length > 0 && (
        <div className="mt-3 text-center">
          <span className="text-xs font-semibold text-red-400">
            {completedLines.length} line{completedLines.length !== 1 ? 's' : ''} complete
            {completedLines.length === 5 ? ' — BINGO! 🎉' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
