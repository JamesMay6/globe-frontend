import { useState, useEffect } from "react";
import { fetchTopUsers } from "../services/api";
import { showMessage } from "../utils/showMessage";

export function useLeaderboard(open) {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError(null);

    fetchTopUsers()
      .then(data => {
        setTopUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load leaderboard");
        showMessage("Failed to load leaderboard", "error");
        setLoading(false);
      });
  }, [open]);

  return { topUsers, loading, error };
}