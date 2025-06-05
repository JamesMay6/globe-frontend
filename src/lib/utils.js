export const normalizeCoord = (value) => Math.floor(value * 1000) / 1000;
export const fakeEmail = (username) => `${username}@delete.theearth`;

export function showMessage(text, type = "success", duration = 650) {
  const message = document.createElement("div");
  message.textContent = text;
  message.className = `toastMessage ${type}`;
  document.body.appendChild(message);

  setTimeout(() => {
    message.style.opacity = "0";
    setTimeout(() => message.remove(), 150);
  }, duration);
}