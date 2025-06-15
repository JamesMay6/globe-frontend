import "../styles/modalOverlay.css";

export default function WelcomeModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Welcome to Delete The Earth! </h3>
        <p>Create a free account and start deleting coorindates around the globe </p>
        <p>Compete against others to be the top of the leaderboard and earn DTE tokens as a reward!</p>
        <p>Enjoy Deleting!</p>
        <button onClick={onClose}>
          Got it!
        </button>
      </div>
    </div>
  );
}
