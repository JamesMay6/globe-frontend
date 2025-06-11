import { useState, useEffect } from "react";
import { loadCustomProfanityList, isProfaneUsername } from "../utils/profanity";

export default function AuthBox({
  user,
  username,
  form,
  setForm,
  handleAuth,
  handleLogout,
  showMessage,
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [displayUsername, setDisplayUsername] = useState(username || "");
  const [profanityReady, setProfanityReady] = useState(false);

  useEffect(() => {
    // Load the profanity list once when component mounts
    async function loadProfanity() {
      await loadCustomProfanityList();
      setProfanityReady(true);
    }
    loadProfanity();
  }, []);

  useEffect(() => {
    if (username) setDisplayUsername(username);
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
      newErrors.username =
        "Username must be 3–20 characters: letters, numbers, or underscores.";
    } else if (profanityReady && isProfaneUsername(usernameVal)) {
      newErrors.username = "Please choose a more appropriate username.";
    } else if (!profanityReady) {
      newErrors.username = "Checking username, please wait...";
    }

    if (form.mode === "register" && form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return !newErrors.username && !newErrors.password;
  };

  const onSubmit = (mode) => {
    // Update mode in form state so validation can check
    setForm((f) => ({ ...f, mode }));

    if (!validateForm()) return;

    handleAuth(
      form,
      mode,
      (msg) => showMessage(msg, "success"),
      (err) => showMessage(err, "error")
    );
  };

  if (user) {
    // Logged in UI
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

  // Logged out UI
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
            disabled={!profanityReady}
          />
          {errors.username && <small className="error">{errors.username}</small>}

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {errors.password && <small className="error">{errors.password}</small>}

          <div className="auth-buttons">
            <button
              className="auth-button login"
              onClick={() => onSubmit("login")}
              disabled={!profanityReady}
            >
              Log In
            </button>

            <button
              className="auth-button register"
              onClick={() => onSubmit("register")}
              disabled={!profanityReady}
            >
              Register
            </button>
          </div>
        </>
      )}
    </div>
  );
}
