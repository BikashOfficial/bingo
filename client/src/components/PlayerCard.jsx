/**
 * PlayerCard — Shows player avatar, name, score, and online status.
 */
export default function PlayerCard({ name, score, isMe, isOnline = true, compact = false }) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  // Deterministic color from name
  const colors = [
    'from-violet-500 to-purple-700',
    'from-cyan-500 to-blue-600',
    'from-pink-500 to-rose-600',
    'from-amber-400 to-orange-600',
    'from-emerald-400 to-teal-600',
  ];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
  const gradientClass = colors[colorIdx];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {initials}
        </div>
        <span className="text-sm font-medium text-slate-200 truncate">{name || 'Unknown'}</span>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-400' : 'bg-slate-600'} ${isOnline ? 'animate-pulse' : ''}`} />
      </div>
    );
  }

  return (
    <div className={`card flex flex-col items-center gap-3 ${isMe ? 'border-violet-500/40' : 'border-slate-700/40'}`}>
      {/* Avatar */}
      <div className="relative">
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-xl font-black shadow-lg`}
        >
          {initials}
        </div>
        {/* Online status */}
        <span
          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-navy-900 ${
            isOnline ? 'bg-green-400 animate-pulse-slow' : 'bg-slate-500'
          }`}
        />
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="font-bold text-slate-100 text-sm">{name || 'Waiting...'}</p>
        {isMe && <p className="text-xs text-violet-400">You</p>}
      </div>

      {/* Score */}
      <div className="flex items-center gap-1.5">
        <span className="text-2xl font-black text-white">{score}</span>
        <span className="text-xs text-slate-500 font-medium">wins</span>
      </div>
    </div>
  );
}
