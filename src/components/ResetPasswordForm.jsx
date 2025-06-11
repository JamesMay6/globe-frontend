import { useState } from "react";
import { SUPABASE } from "../config/config";

export default function ResetPasswordForm({ onSuccess }) {
  // store 5 words separately, initially empty strings
  const [keyWords, setKeyWords] = useState(["", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(null);

  // update a single word at index
  const handleWordChange = (index, value) => {
    const updated = [...keyWords];
    // sanitize input: only allow letters, lowercase recommended
    updated[index] = value.replace(/[^a-zA-Z-]/g, "").toLowerCase();
    setKeyWords(updated);
  };

  const handleReset = async () => {
    // join with dashes before sending
    const resetKey = keyWords.join("-");

    if (keyWords.some((word) => word.length === 0)) {
      setMessage("Please fill all 5 words of the reset key.");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Please enter a new password of at least 6 characters.");
      return;
    }

    const { data, error } = await SUPABASE.rpc("verify_reset_key", {
      input_key: resetKey,
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
    <div>
      <p>
        Please enter your saved 5-word secret key and your new password below.
        If the key is correct, your password will be updated.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {keyWords.map((word, i) => (
          <input
            key={i}
            type="text"
            value={word}
            onChange={(e) => handleWordChange(i, e.target.value)}
            maxLength={10}
            style={{ flex: 1, textAlign: "center" }}
            placeholder={`Word ${i + 1}`}
          />
        ))}
      </div>
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
