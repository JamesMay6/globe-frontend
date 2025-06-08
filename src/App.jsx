import { useEffect, useRef, useState } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  API_URL,
  SUPABASE
} from './config/config';
import { useAuth } from './hooks/useAuth';
import CesiumViewer from "./components/CesiumViewer";
import UserMenu from "./components/UserMenu";
import AuthBox from "./components/AuthBox";
import { showMessage } from "./utils/showMessage";
import { fetchTotals, fetchTopUsers, buyClicks, upgradeSuperClick } from './services/api';

// ==================== APP ====================
export default function App() {
  // ---------- State ----------
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [username, setUsername] = useState(localStorage.getItem("username") || null);
  const [totals, setTotals] = useState({ total: 0, expected_total: 0, percentage: 0 });
  const [topUsers, setTopUsers] = useState([]);
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const [clicksTotal, setClicksTotal] = useState(0);
  const [superClicksTotal, setSuperClicksTotal] = useState(0);
  const [superClickEnabled, setSuperClickEnabled] = useState(false);

  const {
  user,
  handleAuth,
  handleLogout,
  loadingSession,
  fetchUserProfile
} = useAuth(setUsername, setClicksTotal, setSuperClicksTotal);

  useEffect(() => {
    if (username) {
      setForm((f) => ({ ...f, username }));
    }
  }, [username]);

  // ---------- UI Toggles ----------
  const [authOpen, setAuthOpen] = useState(false);
  const [buyMenuOpen, setBuyMenuOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // ==================== DATA ====================
    useEffect(() => {
    if (statsOpen) {
      fetchTotals()
        .then(setTotals)
        .catch((err) => showMessage("Failed to load stats", "error"));
    }
  }, [statsOpen]);

    useEffect(() => {
    if (leaderboardOpen) {
      fetchTopUsers()
        .then(setTopUsers)
        .catch((err) => showMessage("Failed to load leaderboard", "error"));
    }
  }, [leaderboardOpen]);

  useEffect(() => {
    if (leaderboardOpen) fetchTopUsers();
  }, [leaderboardOpen]);


  const handleBuyClicks = async (amount, free = false) => {
  try {
    const data = await buyClicks(amount);

    if (data.error) {
      if (data.status === 429 && amount === 200) setCooldownMessage(data.error);
      else showMessage(data.error || "Purchase failed", "error");
      return;
    }

    if (free) {
      showMessage("Free clicks claimed!");
    } else {
      showMessage(`Purchased ${amount} clicks!`);
    }

    fetchUserProfile();
  } catch (err) {
    console.error(err);
    showMessage("Buy clicks failed", "error");
  }
};


  const handleUpgradeSuperClick = async () => {
  try {
    const data = await upgradeSuperClick();
    if (data.error) return showMessage(data.error || "Upgrade failed", "error");

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
      <CesiumViewer
        user={user}
        fetchUserProfile={fetchUserProfile}
        showMessage={showMessage}
        superClickEnabled={superClickEnabled}
        clicksTotal={clicksTotal}
        superClicksTotal={superClicksTotal}
        setClicksTotal={setClicksTotal}
        setSuperClicksTotal={setSuperClicksTotal}
      />

      <div className="topLeftMenu">
        <AuthBox
          user={user}
          username={username}
          authOpen={authOpen}
          setAuthOpen={setAuthOpen}
          authMode={authMode}
          setAuthMode={setAuthMode}
          form={form}
          setForm={setForm}
          handleAuth={handleAuth}
          handleLogout={handleLogout}
          showMessage={showMessage}
        />

        {user && (
          <UserMenu
            clicksTotal={clicksTotal}
            superClicksTotal={superClicksTotal}
            superClickEnabled={superClickEnabled}
            setSuperClickEnabled={setSuperClickEnabled}
            handleBuyClicks={handleBuyClicks}
            handleUpgradeSuperClick={handleUpgradeSuperClick}
            cooldownMessage={cooldownMessage}
            buyMenuOpen={buyMenuOpen}
            setBuyMenuOpen={setBuyMenuOpen}
          />
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