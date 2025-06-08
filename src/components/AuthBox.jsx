// components/AuthBox.js
import React from "react";

export default function AuthBox({
  user,
  username,
  authOpen,
  setAuthOpen,
  authMode,
  setAuthMode,
  form,
  setForm,
  handleAuth,
  handleLogout,
  showMessage,
}) {
  if (!user) {
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
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              onClick={() =>
                handleAuth(
                  form,
                  authMode,
                  (msg) => showMessage(msg, "success"),
                  (err) => showMessage(err, "error")
                )
              }
            >
              {authMode === "login" ? "Log In" : "Register"}
            </button>
            <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
              Switch to {authMode === "login" ? "Register" : "Login"}
            </button>
            {authMode === "register" && (
              <small style={{ color: "#888" }}>
                Username must be unique and password at least 6 characters.
              </small>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="authBox loggedIn">
      <span>Hi {username}</span>
      <button className="logout" onClick={handleLogout}>
        Log Out
      </button>
    </div>
  );
}
