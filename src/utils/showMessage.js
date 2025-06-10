// utils/showMessage.js
export function showMessage(text, type = "success", customDuration) {
  const durations = {
    success: 1000,
    error: 2500,
    info: 1000,
    warn: 1000,
  };

  const duration = customDuration ?? durations[type] ?? 1000;

  const message = document.createElement("div");
  message.textContent = text;
  message.className = `toastMessage ${type}`;
  document.body.appendChild(message);

  setTimeout(() => {
    message.style.opacity = "0";
    setTimeout(() => message.remove(), 200);
  }, duration);
}
