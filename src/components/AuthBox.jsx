// components/AuthBox.jsx
import { useState, useEffect } from "react";
import { Filter } from "bad-words";

const filter = new Filter();

function isProfaneUsername(username) {
  const lower = username.toLowerCase();

  // Remove digits and underscores
  const stripped = lower.replace(/[0-9_]+/g, "");

  // Direct whole username check
  if (filter.isProfane(lower)) return true;

  // Check stripped username (e.g. "jamescunt")
  if (filter.isProfane(stripped)) return true;

  // Check each substring split by digits/underscores
  const parts = lower.split(/[\d_]+/);
  for (const part of parts) {
    if (filter.isProfane(part)) return true;
  }

  return false;
}

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
  const [displayUsername, setDisplayUsername] = useState(username || "");

  useEffect(() => {
    if (username) {
      setDisplayUsername(username);
    }
  }, [username]);

  useEffect(() => {
    if (user && form.username) {
      setAuthOpen(false);
      setDisplayUsername(form.username);
    }
  }, [user, form.username]);

  useEffect(() => {
    if (user) setAuthOpen(false); // close on login
  }, [user]);

  const validateForm = () => {
    const newErrors = { username: "", password: "" };
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const usernameVal = form.username;

    if (!usernameRegex.test(usernameVal)) {
      newErrors.username = "Username must be 3–20 characters: letters, numbers, or underscores.";
    } else if (isProfaneUsername(usernameVal)) {
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
      <div className="authBoxloggedInWrapper">
      <div className="authBox loggedIn">
        <span>Hi {displayUsername}</span>
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
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

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => { setAuthMode("login"); onSubmit(); }}>
              Log In
            </button>
            <button onClick={() => { setAuthMode("register"); onSubmit(); }}>
              Register
            </button>
          </div>
        </>
      )}
    </div>
  );
}
