import { useState } from "react";
import { SUPABASE } from "../config/config";

export default function ResetPasswordForm({ onSuccess }) {
  const [resetKey, setResetKey] = useState("_____-_____-_____-_____-_____");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(null);

  const handleReset = async () => {
    const { data, error } = await SUPABASE.rpc("verify_reset_key", {
      input_key: resetKey.trim(),
      new_password: newPassword,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password reset successful!");
      onSuccess?.();
    }
  };

  return (
    <div className="reset-form">
      <input
        type="text"
        value={resetKey}
        onChange={(e) => setResetKey(e.target.value)}
        placeholder="e.g. apple-grape-swan-moon-desk"
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New Password"
      />
      <button onClick={handleReset}>Reset Password</button>
      {message && <p>{message}</p>}
    </div>
  );
}
