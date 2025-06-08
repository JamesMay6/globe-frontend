// components/AuthBox.jsx
import { useState, useEffect } from "react";
import leoProfanity from "leo-profanity";

export default function AuthBox({
  user,
  username,
  setAuthMode,
  authMode,
  form,
  setForm,
  handleAuth,
  handleLogout,
  showMessage,
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });

  useEffect(() => {
    if (user) setAuthOpen(false); // close on login
  }, [user]);

  const validateForm = () => {
  const newErrors = { username: "", password: "" };
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  const username = form.username;
  const usernameLower = username.toLowerCase();
  const usernameStripped = usernameLower.replace(/[0-9_]/g, ""); // remove digits and underscores

  if (!usernameRegex.test(username)) {
    newErrors.username = "Username must be 3–20 characters: letters, numbers, or underscores.";
  } else if (
    leoProfanity.check(usernameLower) || // direct match
    leoProfanity.check(usernameStripped) || // stripped match
    leoProfanity.badWordsUsed(usernameStripped).length > 0 // embedded match
  ) {
    newErrors.username = "Please choose a more appropriate username.";
  }

  if (authMode === "register" && form.password.length < 6) {
    newErrors.password = "Password must be at least 6 characters.";
  }

  setErrors(newErrors);
  return !newErrors.username && !newErrors.password;
};

  const onSubmit = () => {
    if (!validateForm()) return;
    handleAuth(
      form,
      authMode,
      (msg) => showMessage(msg, "success"),
      (err) => showMessage(err, "error")
    );
  };

  if (user) {
    // ---------- Logged In State ----------
    return (
      <div className="authBox loggedIn">
        <span>Hi {username}</span>
        <button className="logout" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    );
  }

  // ---------- Unauthenticated State ----------
  return (
    <div className={`authBox ${authOpen ? "expanded" : ""}`}>
      <button onClick={() => setAuthOpen(!authOpen)}>
        {authOpen ? "Hide Login / Register ▲" : "Show Login / Register ▼"}
      </button>

      {authOpen && (
        <>
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
            {errors.username && <small className="error">{errors.username}</small>}

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
            {errors.password && <small className="error">{errors.password}</small>}

          <button onClick={onSubmit}>
            {authMode === "login" ? "Log In" : "Register"}
          </button>

          <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
            Switch to {authMode === "login" ? "Register" : "Login"}
          </button>
        </>
      )}
    </div>
  );
}
