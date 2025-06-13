import { useState } from "react";
import { SUPABASE_URL } from "../config/config";

export default function ResetPasswordForm({ userId, onSuccess }) {
  const [keyWords, setKeyWords] = useState(["", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [username, setUsername] = useState("");
  const [isError, setIsError] = useState(false);

  const handleWordChange = (index, value) => {
    const updated = [...keyWords];
    updated[index] = value.replace(/[^a-zA-Z-]/g, "").toLowerCase();
    setKeyWords(updated);
  };

const handleReset = async () => {
  const resetKey = keyWords.join("-");

  if (!username) {
    setMessage("Please enter your username.");
    setIsError(true);
    return;
  }

  if (keyWords.some((word) => word.length === 0)) {
    setMessage("Please fill all 5 words of the reset key.");
    setIsError(true);
    return;
  }

  if (newPassword.length < 6) {
    setMessage("Please enter a new password of at least 6 characters.");
    setIsError(true);
    return;
  }

  try {
    const res = await fetch(`${API_URL}/functions/v1/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        resetKey,
        newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(data.error || "Failed to reset password.");
      setIsError(true);
      return;
    }

    setMessage("Password reset successful!");
    setIsError(false);
    onSuccess?.();
  } catch (err) {
    console.error(err);
    setMessage("An error occurred. Please try again.");
    setIsError(true);
  }
};


  return (
    <div>
      <p>Please enter your saved 5-word secret key and your new password below.</p>
      <p>If the key is correct, your password will be updated.</p>
      <p>3 incorrect attempts to reset your password and your account will be permanently locked out. </p>
      
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
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
      {message && (
        <p style={{ color: isError ? "red" : "green", fontWeight: "bold" }}>
          {message}
        </p>
      )}

    </div>
  );
}
