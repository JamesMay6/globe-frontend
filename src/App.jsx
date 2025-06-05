import "./styles/style.css";
import CesiumViewer from "./cesium/CesiumViewer";
import { useSession } from "./hooks/useSession";
import AuthBox from "./components/AuthBox";
import BuyMenu from "./components/BuyMenu";
import StatsMenu from "./components/StatsMenu";
import LeaderboardMenu from "./components/LeaderboardMenu";

function App() {
  const { user, setUser } = useSession(() => {});

  return (
    <>
      <CesiumViewer user={user} />
      <AuthBox user={user} setUser={setUser} />
      <BuyMenu user={user} />
      <StatsMenu />
      <LeaderboardMenu />
    </>
  );
}

export default App;