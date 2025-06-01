import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { createClient } from "@supabase/supabase-js";

const API_URL = import.meta.env.VITE_API_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function App() {
  const viewerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // or "register"
  const [form, setForm] = useState({ username: "", password: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [totals, setTotals] = useState({ total: 0, expected_total: 0, percentage: 0 });
  const [topUsers, setTopUsers] = useState([]);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  const normalizeCoord = (value) => Math.floor(value * 1000) / 1000;

  const fakeEmail = (username) => `${username}@delete.theearth`;

  const drawDeletedCell = (viewer, lat, lon) => {
    const cellWidth = 0.001;
    const padding = 0.00005;
    const rect = Cesium.Rectangle.fromDegrees(
      lon - padding,
      lat - padding,
      lon + cellWidth + padding,
      lat + cellWidth + padding
    );
    viewer.entities.add({
      rectangle: {
        coordinates: rect,
        material: Cesium.Color.BLACK.withAlpha(1.0),
        classificationType: Cesium.ClassificationType.BOTH,
      },
    });
  };

  const fetchDeletedCells = async (viewer) => {
    const rect = viewer.camera.computeViewRectangle();
    if (!rect) return;

    const minLat = Cesium.Math.toDegrees(rect.south);
    const maxLat = Cesium.Math.toDegrees(rect.north);
    const minLon = Cesium.Math.toDegrees(rect.west);
    const maxLon = Cesium.Math.toDegrees(rect.east);

    const response = await fetch(
      `${API_URL}/deleted?minLat=${minLat}&maxLat=${maxLat}&minLon=${minLon}&maxLon=${maxLon}`
    );
    const cells = await response.json();
    cells.forEach(({ lat, lon }) => drawDeletedCell(viewer, lat, lon));
  };

  const fetchTotals = async () => {
    try {
      const res = await fetch(`${API_URL}/total-deletions`);
      const data = await res.json();
      setTotals(data);
    } catch (e) {
      console.error("Error fetching totals:", e);
    }
  };

  //TOP USERS
  const fetchTopUsers = async () => {
  try {
    const res = await fetch(`${API_URL}/top-users`);
    const data = await res.json();
    setTopUsers(data);
  } catch (e) {
    console.error("Error fetching top users:", e);
  }
  };

  useEffect(() => {
  if (leaderboardOpen) {
    fetchTopUsers();
  }
}, [leaderboardOpen]);

//HANDLE CLICK ON GLOBE
  const handleClick = async (viewer, movement) => {
  if (!user) {
    alert("You need to log in to delete cells.");
    return;
  }
    const ray = viewer.camera.getPickRay(movement.position);
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    if (!cartesian) return;

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const lat = normalizeCoord(Cesium.Math.toDegrees(cartographic.latitude));
    const lon = normalizeCoord(Cesium.Math.toDegrees(cartographic.longitude));

    await fetch(`${API_URL}/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.access_token}`,
      },
      body: JSON.stringify({ lat, lon }),
    });

    drawDeletedCell(viewer, lat, lon);
    viewer.scene.requestRender();
    fetchTotals();
  };

  useEffect(() => {
    Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

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

      await fetchDeletedCells(viewer);
      fetchTotals();

      viewer.camera.moveEnd.addEventListener(() => {
        fetchDeletedCells(viewer);
      });

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement) => {
        handleClick(viewer, movement);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    })();

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
    };
  }, [user]);

  //AUTHORISATION USERS
  const handleAuth = async () => {
  const email = fakeEmail(form.username);

  try {
    if (authMode === "register") {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
      });
      if (error) {
        alert(`Registration failed: ${error.message}`);
        return;
      }
      if (!data.session || !data.user) {
        alert("Registration succeeded but no session or user returned.");
        return;
      }

      setUser(data.session);

      // Call your API to create profile
      const res = await fetch(`${API_URL}/create-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ id: data.user.id, username: form.username }),
      });

      if (!res.ok) {
        const errText = await res.text();
        alert("Error creating profile: " + errText);
        return;
      }

      alert("Registration successful!");
    } else {
      // Login flow
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });
      if (error) {
        alert(`Login failed: ${error.message}`);
        return;
      }
      if (!data.session) {
        alert("Login succeeded but no session returned.");
        return;
      }

      setUser(data.session);
    }
  } catch (err) {
    console.error("Authentication error:", err);
    alert("An unexpected error occurred.");
  }
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  

  return (
    <>
      <div id="cesiumContainer" style={{ width: "100vw", height: "100vh" }} />

      {!user && (
        <div className="authBox">
          <h2>{authMode === "login" ? "Login" : "Register"}</h2>
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
        </div>
      )}

      {user && (
        <div className="authBox">
          <div>Welcome, {form.username}</div>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      )}

      <div id="statsMenu">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "Hide Stats ▲" : "Show Stats ▼"}
        </button>

        {menuOpen && (
          <div className="statsContent">
            <div><strong>Current Deleted:</strong> {totals.total.toLocaleString()}</div>
            <div><strong>Total: </strong> {totals.expected_total.toLocaleString()}</div>
            <div><strong>% Deleted:</strong> {totals.percentage?.toFixed(10)}%</div>
          </div>
        )}
      </div>

      <div id="leaderboardMenu">
        <button onClick={() => setLeaderboardOpen(!leaderboardOpen)}>
          {leaderboardOpen ? "Hide Leaderboard ▲" : "Show Leaderboard ▼"}
        </button>

        {leaderboardOpen && (
          <div className="leaderboardContent">
            <ol>
              {topUsers.map(({ username, clicks_total }, index) => (
                <li key={username} className={`rank-${index + 1}`}>
                  <span className="username">{username}</span>
                  <span className="score">{clicks_total.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
