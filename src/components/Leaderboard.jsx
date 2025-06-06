export default function Leaderboard({ topUsers, isOpen, onToggle }) {
  return (
    <div className="leaderboardMenu">
      <button onClick={onToggle}>
        {isOpen ? "Hide Leaderboard ▼" : "Show Leaderboard ▲"}
      </button>
      {isOpen && (
        <div className="leaderboardContent">
          <ol>
            {topUsers.map(({ username, clicks_used }, index) => (
              <li key={username} className={`rank-${index + 1}`}>
                <span className="username">{username}</span>
                <span className="score">{clicks_used.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}