import "cesium/Build/Cesium/Widgets/widgets.css";
import { useState } from "react";
//Hooks
import { useAuth } from './hooks/useAuth';
import { useSuperClickUpgrade } from './hooks/useSuperClickUpgrade';
import { useBuyClicks } from "./hooks/useBuyClicks";
//Utils
import { showMessage } from "./utils/showMessage";
//Components
import CesiumViewer from "./components/CesiumViewer";
import UserMenu from "./components/UserMenu";
import AuthBox from "./components/AuthBox";
import StatsMenu from "./components/StatsMenu";
import Leaderboard from "./components/LeaderboardMenu";

export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [username, setUsername] = useState(localStorage.getItem("username") || null);
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const [clicksTotal, setClicksTotal] = useState(0);
  const [clicksUsed, setClicksUsed] = useState(0);
  const [superClicksTotal, setSuperClicksTotal] = useState(0);
  const [superClickEnabled, setSuperClickEnabled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [buyMenuOpen, setBuyMenuOpen] = useState(false);

  // Honor Order of Hooks
  const {
    user,
    handleAuth,
    handleLogout,
    fetchUserProfile
  } = useAuth(setUsername, setClicksTotal, setSuperClicksTotal, setClicksUsed);
  const { upgrade } = useSuperClickUpgrade(fetchUserProfile);
  const { handleBuyClicks } = useBuyClicks(fetchUserProfile, setCooldownMessage);

  return (
    <>
      <CesiumViewer
        user={user}
        fetchUserProfile={fetchUserProfile}
        showMessage={showMessage}
        superClickEnabled={superClickEnabled}
        clicksTotal={clicksTotal}
        clicksUsed={clicksUsed} 
        superClicksTotal={superClicksTotal}
        setClicksTotal={setClicksTotal}
        setClicksUsed={setClicksUsed} 
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
            clicksUsed={clicksUsed} 
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