// components/ResetKeyModal.jsx
export default function ResetKeyModal({ resetKey, onClose }) {
  if (!resetKey) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Your account recovery key</h2>
        <p className="reset-key-value"><code>{resetKey}</code></p>
        <p className="reset-key-note">
          Please save this key in a secure place — you’ll need it to reset your password.
        </p>
        <button onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}