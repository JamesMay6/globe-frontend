import "cesium/Build/Cesium/Widgets/widgets.css";
import { useState } from "react";
import { useAuth } from './hooks/useAuth';
import { useSuperClickUpgrade } from './hooks/useSuperClickUpgrade';
import CesiumViewer from "./components/CesiumViewer";
import UserMenu from "./components/UserMenu";
import AuthBox from "./components/AuthBox";
import StatsMenu from "./components/StatsMenu";
import Leaderboard from "./components/LeaderboardMenu";
import { showMessage } from "./utils/showMessage";
import { buyClicks } from './services/api';

// ==================== APP ====================
export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [username, setUsername] = useState(localStorage.getItem("username") || null);
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const [clicksTotal, setClicksTotal] = useState(0);
  const [superClicksTotal, setSuperClicksTotal] = useState(0);
  const [superClickEnabled, setSuperClickEnabled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [buyMenuOpen, setBuyMenuOpen] = useState(false);
  const {
    user,
    handleAuth,
    handleLogout,
    fetchUserProfile
  } = useAuth(setUsername, setClicksTotal, setSuperClicksTotal);
  const { 
    loading: upgrading, 
    upgrade 
  } = useSuperClickUpgrade(fetchUserProfile);


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
            handleUpgradeSuperClick={upgrade}
            cooldownMessage={cooldownMessage}
            buyMenuOpen={buyMenuOpen}
            setBuyMenuOpen={setBuyMenuOpen}
          />
        )}
      </div>

        <StatsMenu />
        <Leaderboard />

    </>
  );
}