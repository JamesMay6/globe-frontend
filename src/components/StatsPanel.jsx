export default function StatsPanel({ totals, isOpen, onToggle }) {
  return (
    <div className="statsMenu">
      <button onClick={onToggle}>
        {isOpen ? "Hide Stats ▼" : "Show Stats ▲"}
      </button>
      {isOpen && (
        <div className="statsContent">
          <div><strong>Current Deleted:</strong> {totals.total.toLocaleString()}</div>
          <div><strong>Total:</strong> {totals.expected_total.toLocaleString()}</div>
          <div><strong>% Deleted:</strong> {(totals.percentage ?? 0).toFixed(10)}%</div>
        </div>
      )}
    </div>
  );
}