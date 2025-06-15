import "../styles/modalOverlay.css";

export default function WelcomeModal({ onClose }) {
  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <h2 className="modalTitle">Welcome to the Globe</h2>
        <p className="modalText">
          Welcome to Delete The Earth! 
        </p>
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
