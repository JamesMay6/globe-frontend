import { useState, useEffect } from "react";
import { fetchTotals } from "../services/api";
import { showMessage } from "../utils/showMessage";

export function useStats(isOpen) {
  const [totals, setTotals] = useState({ total: 0, expected_total: 6480000000000, percentage: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetchTotals()
      .then((data) => {
        setTotals(data);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        showMessage("Failed to load stats", "error");
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  return { totals, loading, error };
}