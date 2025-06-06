import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { createClient } from "@supabase/supabase-js";

// ==================== CONFIG ====================
const API_URL = import.meta.env.VITE_API_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const CESIUM_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN;
const isPaymentEnabled = import.meta.env.VITE_PAYMENT_ENABLED === "true";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== APP ====================
export default function App() {
  // ---------- State ----------
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [clicksTotal, setClicksTotal] = useState(0);
  const [superClicksTotal, setSuperClicksTotal] = useState(0);
  const [superClickEnabled, setSuperClickEnabled] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem("username") || null);
  const [totals, setTotals] = useState({ total: 0, expected_total: 0, percentage: 0 });
  const [topUsers, setTopUsers] = useState([]);
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [containerReady, setContainerReady] = useState(false);

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

  // ---------- DOM Ready Check ----------
  useEffect(() => {
    const check = () => {
      const el = document.getElementById("cesiumContainer");
      if (el) setContainerReady(true);
      else requestAnimationFrame(check);
    };
    check();
  }, []);

  // ==================== AUTH ====================
  const fakeEmail = (username) => `${username}@delete.theearth`;

  const fetchUserProfile = async (token) => {
    const accessToken = token || (await supabase.auth.getSession()).data?.session?.access_token;
    if (!accessToken) return;

    const res = await fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return;

    const data = await res.json();
    setUsername(data.username);
    localStorage.setItem("username", data.username);
    setClicksTotal(data.clicks_total);
    setSuperClicksTotal(data.super_clicks);
  };

  const handleAuth = async () => {
    const email = fakeEmail(form.username);
    try {
      if (authMode === "register") {
        const { data, error } = await supabase.auth.signUp({ email, password: form.password });
        if (error || !data.session) return alert(error?.message || "No session returned");
        setUser(data.session.user);
        await fetchUserProfile(data.session.access_token);
        await fetch(`${API_URL}/create-profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ id: data.user.id, username: form.username }),
        });
        alert("Registration successful!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: form.password });
        if (error || !data.session) return alert(error?.message || "No session returned");
        setUser(data.session.user);
        await fetchUserProfile(data.session.access_token);
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error during authentication.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername(null);
    localStorage.removeItem("username");
  };

  useEffect(() => {
    const initSession = async () => {
      setLoadingSession(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchUserProfile(session.access_token);
      }
      setLoadingSession(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        await fetchUserProfile(session.access_token);
      } else {
        setUser(null);
      }
    });

    initSession();
    return () => authListener.subscription.unsubscribe();
  }, []);

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

  // ==================== CESIUM ====================
  const normalizeCoord = (val) => Math.floor(val * 1000) / 1000;

  const drawnCells = new Set();

  const drawDeletedCells = (viewer, cells) => {
    const instances = [];

    for (const { lat, lon } of cells) {
      const key = `${lat}:${lon}`;
      if (drawnCells.has(key)) continue;
      drawnCells.add(key);

      const cellWidth = 0.001;
      const rectangle = Cesium.Rectangle.fromDegrees(
        lon,
        lat,
        lon + cellWidth,
        lat + cellWidth
      );

      instances.push(
        new Cesium.GeometryInstance({
          geometry: new Cesium.RectangleGeometry({
            rectangle,
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
          }),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
              Cesium.Color.BLACK.withAlpha(1.0)
            ),
          },
        })
      );
    }

    if (instances.length > 0) {
      viewer.scene.primitives.add(
        new Cesium.GroundPrimitive({
          geometryInstances: instances,
          appearance: new Cesium.PerInstanceColorAppearance(),
          classificationType: Cesium.ClassificationType.BOTH,
        })
      );
    }
  };

    const fetchDeletedCells = async (viewer) => {
    const rect = viewer.camera.computeViewRectangle();
    if (!rect) return;
    const minLat = Cesium.Math.toDegrees(rect.south);
    const maxLat = Cesium.Math.toDegrees(rect.north);
    const minLon = Cesium.Math.toDegrees(rect.west);
    const maxLon = Cesium.Math.toDegrees(rect.east);

    const res = await fetch(`${API_URL}/deleted?minLat=${minLat}&maxLat=${maxLat}&minLon=${minLon}&maxLon=${maxLon}`);
    const cells = await res.json();
    drawDeletedCells(viewer, cells);
  };

  const handleClick = async (viewer, movement) => {
    if (!userRef.current) return showMessage("You need to log in to delete Earth", "error");

    const isSuper = superClickEnabledRef.current;
    if (!isSuper && clicksRef.current <= 0) return showMessage("You're out of clicks!", "error");
    if (isSuper && superClicksRef.current <= 0) return showMessage("You're out of super clicks!", "error");

    showMessage(isSuper ? "Super Click deleting Earth" : "Deleting Earth", "warn");

    const ray = viewer.camera.getPickRay(movement.position);
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    if (!cartesian) return;

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const lat = normalizeCoord(Cesium.Math.toDegrees(cartographic.latitude));
    const lon = normalizeCoord(Cesium.Math.toDegrees(cartographic.longitude));

    drawDeletedCells(viewer, lat, lon);
    viewer.scene.requestRender();

    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      const res = await fetch(`${API_URL}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lat, lon, superClick: isSuper }),
      });

      const data = await res.json();
      if (data.alreadyDeleted) return showMessage("Earth already deleted here", "error");

      if (isSuper && Array.isArray(data.coordinates)) {
        data.coordinates.forEach(({ lat, lon }) => drawDeletedCells(viewer, lat, lon));
      }

      fetchTotals();
      fetchUserProfile();
      showMessage(isSuper ? "Earth deleted with Super Click" : "Earth deleted!");
    } catch (err) {
      console.error(err);
      showMessage("Error deleting Earth", "error");
    }
  };

  useEffect(() => {
    if (!containerReady) return;

    Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

    (async () => {
      const terrainProvider = await Cesium.createWorldTerrainAsync();
      const viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider,
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        geocoder: true,
        requestRenderMode: true,
        maximumRenderTimeChange: 0,
      });

      viewerRef.current = viewer;
      viewer.trackedEntity = undefined;

      const controller = viewer.scene.screenSpaceCameraController;
      controller.zoomFactor = 17.0;
      controller.inertiaZoom = 0.9;

      await fetchDeletedCells(viewer);
      fetchTotals();

      viewer.camera.moveEnd.addEventListener(() => fetchDeletedCells(viewer));

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement) => handleClick(viewer, movement), Cesium.ScreenSpaceEventType.LEFT_CLICK);
    })();
  }, [containerReady]);

  // ==================== UTILITY ====================
  function showMessage(text, type = "success", duration = 650) {
    const message = document.createElement("div");
    message.textContent = text;
    message.className = `toastMessage ${type}`;
    document.body.appendChild(message);
    setTimeout(() => {
      message.style.opacity = "0";
      setTimeout(() => message.remove(), 150);
    }, duration);
  }

  const handleBuyClicks = async (amount) => {
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
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
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
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

  const zoomOut = () => {
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, 20000000.0),
      });
    } else {
      console.warn("Viewer not ready yet");
    }
  }

    // ==================== RENDER ====================

  return (
    <>
      <div id="cesiumContainer" style={{ width: "100vw", height: "100vh" }} />
      <button class="zoom-out-button" onClick={zoomOut}>Show Full Earth</button>

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
                <button onClick={handleAuth}>
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
                  <button className="freeClicksButton" onClick={() => handleBuyClicks(5)}>Get 5 Free Clicks</button>
                  {cooldownMessage && (
                    <div style={{ color: "red", marginTop: "0.5rem" }}>{cooldownMessage}</div>
                  )}
                  
                  {!isPaymentEnabled && (
                    <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
                      Paid clicks coming soon
                    </div>
                  )}
                  {[{ clicks: 100, price: 1 }, { clicks: 1000, price: 5 }, { clicks: 5000, price: 10 }].map(
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
        <button onClick={() => setStatsOpen(!statsOpen)}>
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
        <button onClick={() => setLeaderboardOpen(!leaderboardOpen)}>
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