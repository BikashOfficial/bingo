export default function UserList({ members, me, onClose }) {
  return (
    <div className="userlist-panel">
      <div className="userlist-header">
        <h3 className="userlist-title">Members <span className="userlist-count">{members.length}</span></h3>
        <button onClick={onClose} className="userlist-close">✕</button>
      </div>
      <div className="userlist-body">
        {members.map((m) => (
          <div key={m.socketId} className="userlist-item">
            <div
              className="userlist-avatar"
              style={{ background: m.avatar?.color || '#6366f1' }}
            >
              {m.avatar?.letter || m.displayName[0].toUpperCase()}
            </div>
            <div className="userlist-info">
              <span className="userlist-name">
                {m.displayName}
                {m.socketId === me?.socketId && <span className="userlist-you"> (you)</span>}
              </span>
              <span className="userlist-status">
                <span className="online-dot" />
                Online
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
