import { useState } from "react";
import { useStats } from "../hooks/useStats";

export default function StatsMenu() {
  const [open, setOpen] = useState(false);
  const { totals, loading, error } = useStats(open);

  return (
    <div className="statsMenu">
      <button onClick={() => setOpen(!open)}>
        {open ? "Hide Stats ▼" : "Show Stats ▲"}
      </button>
      {open && (
        <div className="statsContent">
          {error && <div>Error loading stats</div>}
          {!loading && !error && (
            <>
              <div><strong>Current Deleted:</strong> {totals.total.toLocaleString()}</div>
              <div><strong>Total: </strong> {totals.expected_total.toLocaleString()}</div>
              <div><strong>% Deleted:</strong> {totals.percentage?.toFixed(10)}%</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
