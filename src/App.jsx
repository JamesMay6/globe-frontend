import "cesium/Build/Cesium/Widgets/widgets.css";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
//Hooks
import { useAuth } from './hooks/useAuth';
import { useUserProfile } from './hooks/useUserProfile';
import { useSuperClickUpgrade, useUltraClickUpgrade} from './hooks/useSuperClickUpgrade';
import { useBuyClicks } from "./hooks/useBuyClicks";
//Utils
import { showMessage } from "./utils/showMessage";
//Components
import CesiumViewer from "./components/CesiumViewer";
import UserMenu from "./components/UserMenu";
import AuthBox from "./components/AuthBox";
import StatsMenu from "./components/StatsMenu";
import Leaderboard from "./components/LeaderboardMenu";
import AboutMenu from "./components/AboutMenu";
import ResetKeyModal from './components/ResetKeyModal';
import { AuthProvider } from "./components/AuthProvider";

//css
import "./styles/aboutMenu.css";
import "./styles/toast.css";
import "./styles/leaderboardMenu.css";
import "./styles/statsMenu.css";
import "./styles/cesiumWidgets.css";
import "./styles/authBox.css";
import "./styles/userMenu.css";
import "./styles/mobile.css";
import "./styles/modalOverlay.css";


export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [buyMenuOpen, setBuyMenuOpen] = useState(false);
  const [resetKey, setResetKey] = useState(null); // NEW
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Honor Order of Hooks
    const {
    user,
    handleAuth,
    handleLogout,
    fetchUserProfile,
    showPassword,
    setShowPassword
  } = useAuth(setErrorMessage, setShowErrorModal);

  const {
    username,
    clicksTotal,
    clicksUsed,
    superClicks: superClicksTotal,
    ultraClicks: ultraClicksTotal,
    setUsername,
    setClicksTotal,
    setClicksUsed,
    setSuperClicks: setSuperClicksTotal,
    setUltraClicks: setUltraClicksTotal,
    superClickEnabled,
    setSuperClickEnabled,
    updateProfileFromData,
    loadProfile
  } = useUserProfile(user, fetchUserProfile);

  const { upgrade } = useSuperClickUpgrade(loadProfile);
  const { ultraUpgrade } = useUltraClickUpgrade(loadProfile);

  const { handleBuyClicks } = useBuyClicks(loadProfile, setCooldownMessage);

  const refreshUserProfile = async () => {
    const data = await fetchUserProfile();
    updateProfileFromData(data);
  };

  const location = useLocation();

  useEffect(() => {
  const params = new URLSearchParams(location.search);
  const paymentStatus = params.get("payment");

  if (paymentStatus === "success") {
    showMessage("Payment successful! Your clicks have been credited","success",5000);
    window.history.replaceState({}, document.title, "/");
  } else if (paymentStatus === "cancelled") {
    showMessage("Payment was cancelled. No clicks were purchased","warn",5000);
    window.history.replaceState({}, document.title, "/");
  }
}, [location]);

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
        ultraClicksTotal={ultraClicksTotal}
        setClicksTotal={setClicksTotal}
        setClicksUsed={setClicksUsed} 
        setSuperClicksTotal={setSuperClicksTotal}
        setUltraClicksTotal={setUltraClicksTotal}
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
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          resetKey={resetKey}
          setResetKey={setResetKey}
          errorMessage={errorMessage}
          setShowErrorModal={setShowErrorModal}
        />

        {user && (
          <UserMenu
            clicksTotal={clicksTotal}
            clicksUsed={clicksUsed} 
            superClicksTotal={superClicksTotal}
            ultraClicksTotal={ultraClicksTotal}
            superClickEnabled={superClickEnabled}
            setSuperClickEnabled={setSuperClickEnabled}
            handleBuyClicks={handleBuyClicks}
            handleUpgradeSuperClick={upgrade}
            handleUpgradeUltraClick={ultraUpgrade}
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
        <ResetKeyModal resetKey={resetKey} onClose={() => setResetKey(null)} />
        <AuthProvider>
          <App />
        </AuthProvider>
        
        {showErrorModal && (
          <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Error</h2>
              <p>{errorMessage}</p>
              <button onClick={() => setShowErrorModal(false)}>Close</button>
            </div>
          </div>
          )}
    </>
  );
}