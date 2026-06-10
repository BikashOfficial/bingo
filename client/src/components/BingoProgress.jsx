/**
 * BingoProgress — Displays B-I-N-G-O letters.
 * Letters become "done" (gray) as lines are completed.
 * @param {boolean[]} bingoLetters - [B, I, N, G, O] completion state
 * @param {number} completedCount - total completed lines count
 */
export default function BingoProgress({ bingoLetters = [], completedCount = 0 }) {
  const letters = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className="card text-center">
      {/* <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-semibold">Progress</p> */}

      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {letters.map((letter, i) => {
          const done = bingoLetters[i] || false;
          return (
            <div key={letter} className="relative flex flex-col items-center gap-1">
              <span
                className={`bingo-letter text-2xl sm:text-3xl transition-all duration-500 ${
                  done ? 'bingo-letter-done' : 'bingo-letter-active'
                }`}
                style={
                  done
                    ? {}
                    : {
                        textShadow: '0 0 20px rgba(251,191,36,0.6)',
                      }
                }
              >
                {letter}
              </span>
              {done && (
                <span className="text-green-400 text-xs font-bold animate-bounce-in">✓</span>
              )}
            </div>
          );
        })}
      </div>


      <p className="text-xs text-slate-500 mt-1.5">
        {completedCount}/5 lines{completedCount === 5 ? ' — BINGO! 🎉' : ''}
      </p>
    </div>
  );
}
