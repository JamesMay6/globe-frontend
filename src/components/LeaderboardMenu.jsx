import { useState } from "react";
import { useLeaderboard } from "../hooks/useLeaderboard";

export default function Leaderboard() {
  const [open, setOpen] = useState(false);
  const { topUsers, loading, error } = useLeaderboard(open);

  return (
    <div className="leaderboardMenu">
      <button onClick={() => setOpen(!open)}>
        {open ? "Hide Leaderboard ▼" : "Show Leaderboard ▲"}
      </button>
      {open && (
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