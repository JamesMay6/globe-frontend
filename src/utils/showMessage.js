// utils/showMessage.js
export function showMessage(text, type = "success") {
  const durations = {
    success: 750,
    error: 2500,
    info: 1000,
    warning: 750,
  };

  const duration = durations[type] || 1000;

  const message = document.createElement("div");
  message.textContent = text;
  message.className = `toastMessage ${type}`;
  document.body.appendChild(message);

  setTimeout(() => {
    message.style.opacity = "0";
    setTimeout(() => message.remove(), 200);
  }, duration);
}