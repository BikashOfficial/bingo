// Typing indicator — animated "..." bubble
export default function TypingIndicator({ users }) {
  if (!users || users.length === 0) return null;

  const label =
    users.length === 1
      ? `${users[0]} is typing`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing`
      : `${users[0]} and ${users.length - 1} others are typing`;

  return (
    <div className="typing-wrapper">
      <div className="typing-bubble">
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="typing-label">{label}…</span>
    </div>
  );
}
