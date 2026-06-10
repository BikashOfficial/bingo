import { memo } from 'react';

/**
 * BingoCell — A single cell in the Bingo board.
 * @param {number}   value      - The number displayed
 * @param {boolean}  marked     - Whether this cell is marked (red)
 * @param {boolean}  completed  - Whether this cell is part of a completed line
 * @param {boolean}  isMyTurn   - Whether it is currently this player's turn
 * @param {function} onClick    - Click handler
 */
function BingoCell({ value, marked, completed, isMyTurn, onClick }) {
  const handleClick = () => {
    if (!marked && isMyTurn) onClick?.(value);
  };

  return (
    <div
      onClick={handleClick}
      title={marked ? `${value} — marked` : isMyTurn ? `Click to mark ${value}` : 'Wait for your turn'}
      style={{
        touchAction: 'manipulation',
        aspectRatio: '1',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        MozUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
      className={[
        // Base
        'relative flex flex-col items-center justify-center rounded-xl',
        'font-bold select-none transition-all duration-200',
        'border min-w-[48px] min-h-[48px]',

        // State-based styles
        marked
          ? completed
            ? // part of a completed line → brighter red + glow
              'bg-red-600 border-red-400 shadow-lg shadow-red-900/60 text-white scale-100'
            : // just marked → solid red
              'bg-red-600/90 border-red-500 text-white shadow-md shadow-red-900/40 animate-mark-cell'
          : // unmarked
            isMyTurn
              ? 'bg-navy-800/80 border-slate-600 text-slate-200 cursor-pointer hover:border-red-400/60 hover:bg-slate-700/70 hover:text-white hover:-translate-y-0.5 active:scale-95'
              : 'bg-navy-800/60 border-slate-700/40 text-slate-500 cursor-not-allowed opacity-70',
      ].join(' ')}
    >
      {marked ? (
        <>
          {/* Number in small text above X */}
          <span className="text-[10px] font-semibold opacity-60 leading-none select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>{value}</span>
          {/* Red X */}
          <span
            className="text-base font-black leading-none select-none"
            style={{ textShadow: '0 0 10px rgba(255,100,100,0.9)', userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            ✕
          </span>
        </>
      ) : (
        <span className="text-sm sm:text-base font-bold select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>{value}</span>
      )}
    </div>
  );
}

export default memo(BingoCell);
