const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥', '🎉', '💯'];

export default function ReactionPicker({ onReact, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div className="reaction-backdrop" onClick={onClose} />

      {/* Picker bubble */}
      <div className="reaction-picker">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onReact(emoji); onClose(); }}
            className="reaction-btn"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
