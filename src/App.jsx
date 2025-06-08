import { useEffect, useRef, useState } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  API_URL,
  isPaymentEnabled,
  BUY_CLICKS_PACKAGE_ONE,
  BUY_CLICKS_PACKAGE_TWO,
  BUY_CLICKS_PACKAGE_THREE,
  BUY_CLICKS_PACKAGE_ONE_COST,
  BUY_CLICKS_PACKAGE_TWO_COST,
  BUY_CLICKS_PACKAGE_THREE_COST,
  FREE_CLICKS,
  SUPABASE
} from './config/config';
import { useAuth } from './hooks/useAuth';
import CesiumViewer from "./components/CesiumViewer";


// ==================== APP ====================
export default function App() {
  // ---------- State ----------
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [clicksTotal, setClicksTotal] = useState(0);
  const [superClicksTotal, setSuperClicksTotal] = useState(0);
  const [superClickEnabled, setSuperClickEnabled] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem("username") || null);
  const [totals, setTotals] = useState({ total: 0, expected_total: 0, percentage: 0 });
  const [topUsers, setTopUsers] = useState([]);
  const [cooldownMessage, setCooldownMessage] = useState(null);

  const {
  user,
  handleAuth,
  handleLogout,
  loadingSession,
  fetchUserProfile
} = useAuth(setUsername, setClicksTotal, setSuperClicksTotal);

  // ---------- UI Toggles ----------
  const [authOpen, setAuthOpen] = useState(false);
  const [buyMenuOpen, setBuyMenuOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // ---------- Refs ----------
  const viewerRef = useRef(null);
  const userRef = useRef(null);
  const clicksRef = useRef(0);
  const superClicksRef = useRef(0);
  const superClickEnabledRef = useRef(false);

  // ---------- Sync Refs ----------
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { clicksRef.current = clicksTotal; }, [clicksTotal]);
  useEffect(() => { superClicksRef.current = superClicksTotal; }, [superClicksTotal]);
  useEffect(() => { superClickEnabledRef.current = superClickEnabled; }, [superClickEnabled]);

  // ==================== DATA ====================
  const fetchTotals = async () => {
    const res = await fetch(`${API_URL}/total-deletions`);
    if (!res.ok) return;
    setTotals(await res.json());
  };

  const fetchTopUsers = async () => {
    const res = await fetch(`${API_URL}/top-users`);
    if (!res.ok) return;
    setTopUsers(await res.json());
  };

  useEffect(() => {
    if (leaderboardOpen) fetchTopUsers();
  }, [leaderboardOpen]);

  // ==================== UTILITY ====================
  function showMessage(text, type = "success", duration = 700) {
    const message = document.createElement("div");
    message.textContent = text;
    message.className = `toastMessage ${type}`;
    document.body.appendChild(message);
    setTimeout(() => {
      message.style.opacity = "0";
      setTimeout(() => message.remove(), 200);
    }, duration);
  }

  const handleBuyClicks = async (amount) => {
    try {
      const token = (await SUPABASE.auth.getSession()).data?.session?.access_token;
      const res = await fetch(`${API_URL}/buy-clicks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && amount === 200) setCooldownMessage(data.error);
        else showMessage(data.error || "Purchase failed", "error");
        return;
      }

      showMessage(`Purchased ${amount} clicks!`);
      fetchUserProfile();
    } catch (err) {
      console.error(err);
      showMessage("Buy clicks failed", "error");
    }
  };

  const handleUpgradeSuperClick = async () => {
    try {
      const token = (await SUPABASE.auth.getSession()).data?.session?.access_token;
      const res = await fetch(`${API_URL}/profile/upgrade-super-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) return showMessage(data.error || "Upgrade failed", "error");

      showMessage(data.message || "Upgrade successful!");
      fetchUserProfile();
    } catch (err) {
      console.error(err);
      showMessage("Upgrade failed", "error");
    }
  };

    // ==================== RENDER ====================

  return (
    <>
      <CesiumViewer user={user} superClickEnabled={superClickEnabled} fetchUserProfile={fetchUserProfile} showMessage={showMessage} />


      <div className="topLeftMenu">
        {!user ? (
          <div className={`authBox ${authOpen ? "expanded" : ""}`}>
            <button onClick={() => setAuthOpen(!authOpen)}>
              {authOpen ? "Hide Login / Register ▲" : "Show Login / Register  ▼"}
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
                <button onClick={() => handleAuth(form, authMode, 
                  (msg) => showMessage(msg, "success"), 
                  (err) => showMessage(err, "error")
                )}>
                  {authMode === "login" ? "Log In" : "Register"}
                </button>
                <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                  Switch to {authMode === "login" ? "Register" : "Login"}
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="authBox loggedIn">
              <span>Hi {username}</span>
              <button className="logout" onClick={handleLogout}>
                Log Out
              </button>
            </div>
            <div className="buyMenu">
              <button onClick={() => setBuyMenuOpen(!buyMenuOpen)}>
                {buyMenuOpen ? "Hide User Menu ▲" : "Show User Menu ▼"}
              </button>
              {buyMenuOpen && (
                <div className="buyContent">
                  <div className="clicksAvailable">
                    <div><strong>Available Clicks:</strong> {clicksTotal}</div>
                    <div><strong>Available Super Clicks:</strong> {superClicksTotal}</div>
                  </div>
                  <div className="superClickToggle" style={{ marginTop: "1rem" }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={superClickEnabled}
                        onChange={() => setSuperClickEnabled(!superClickEnabled)}
                      />
                      Enable Super Click
                    </label>
                  </div>
                  <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
                      Purchase Clicks
                    </div>
                  <button className="freeClicksButton" onClick={() => handleBuyClicks(FREE_CLICKS)}>Get {FREE_CLICKS} Free Clicks</button>
                  {cooldownMessage && (
                    <div style={{ color: "red", marginTop: "0.5rem" }}>{cooldownMessage}</div>
                  )}
                  
                  {!isPaymentEnabled && (
                    <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
                      Paid clicks coming soon
                    </div>
                  )}
                  {[{ clicks: BUY_CLICKS_PACKAGE_ONE, price: BUY_CLICKS_PACKAGE_ONE_COST }, 
                    { clicks: BUY_CLICKS_PACKAGE_TWO, price: BUY_CLICKS_PACKAGE_TWO_COST }, 
                    { clicks: BUY_CLICKS_PACKAGE_THREE, price: BUY_CLICKS_PACKAGE_THREE_COST }].map(
                    ({ clicks, price }) => (
                      <button
                        key={clicks}
                        onClick={() => handleBuyClicks(clicks)}
                        disabled={!isPaymentEnabled}
                      >
                        Buy {clicks.toLocaleString()} (£{price}) 
                      </button>
                    )
                  )}
                  <div className="upgradesMenu">
                    <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
                      Upgrade Clicks - Delete More!
                    </div>
                      <button onClick={handleUpgradeSuperClick} className="superClickButton">
                        Upgrade to a Super Click
                      </button>
                      <p className="info-text">Use 200 clicks to get 1 Super Click, which deletes over 500 coordinates at once!</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="statsMenu">
        <button onClick={() => {setStatsOpen(!statsOpen);fetchTotals();}}>
          {statsOpen ? "Hide Stats ▼" : "Show Stats ▲"}
        </button>
        {statsOpen && (
          <div className="statsContent">
            <div><strong>Current Deleted:</strong> {totals.total.toLocaleString()}</div>
            <div><strong>Total: </strong> {totals.expected_total.toLocaleString()}</div>
            <div><strong>% Deleted:</strong> {totals.percentage?.toFixed(10)}%</div>
          </div>
        )}
      </div>

      <div className="leaderboardMenu">
        <button onClick={() => {setLeaderboardOpen(!leaderboardOpen);fetchTopUsers()}}>
          {leaderboardOpen ? "Hide Leaderboard ▼" : "Show Leaderboard ▲"}
        </button>
        {leaderboardOpen && (
          <div className="leaderboardContent">
            <ol>
              {topUsers.map(({ username, clicks_used }, index) => (
                <li key={username} className={`rank-${index + 1}`}>
                  <span className="username">{username}</span>
                  <span className="score">{clicks_used.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </>
  );
}