export function logEvent(message, data = {}) {
  const logEntry = {
    message,
    data,
  };

  fetch("/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(logEntry),
  }).catch((err) => {
    console.warn("Logging failed:", err);
  });
}