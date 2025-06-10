import "cesium/Build/Cesium/Widgets/widgets.css";
import { useState } from "react";
//Hooks
import { useAuth } from './hooks/useAuth';
import { useUserProfile } from './hooks/useUserProfile';
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
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [buyMenuOpen, setBuyMenuOpen] = useState(false);
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false);


  // Honor Order of Hooks
    const {
    user,
    handleAuth,
    handleLogout,
    fetchUserProfile
  } = useAuth();

  const {
    username,
    clicksTotal,
    clicksUsed,
    superClicks: superClicksTotal,
    setUsername,
    setClicksTotal,
    setClicksUsed,
    setSuperClicks: setSuperClicksTotal,
    superClickEnabled,
    setSuperClickEnabled,
    updateProfileFromData,
    loadProfile
  } = useUserProfile(user, fetchUserProfile);

  const { upgrade } = useSuperClickUpgrade(loadProfile);
  const { handleBuyClicks } = useBuyClicks(loadProfile, setCooldownMessage);

  const refreshUserProfile = async () => {
    const data = await fetchUserProfile();
    updateProfileFromData(data);
  };

  return (
    <>
      <CesiumViewer
        user={user}
        fetchUserProfile={refreshUserProfile}
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
            fetchUserProfile={refreshUserProfile}
          />
        )}
      </div>

        <StatsMenu />
        <AboutMenu />
        <Leaderboard />

    </>
  );
}