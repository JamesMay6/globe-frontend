import React, { useEffect, useRef, useState, useCallback, useMemo, useReducer } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { createClient } from "@supabase/supabase-js";

// ==================== CONSTANTS ====================
const CONFIG = {
  API_URL: import.meta.env.VITE_API_URL,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  CESIUM_TOKEN: import.meta.env.VITE_CESIUM_ION_TOKEN,
  IS_PAYMENT_ENABLED: import.meta.env.VITE_PAYMENT_ENABLED === "true",
  CELL_WIDTH: 0.001,
  CELL_PADDING: 0.00005,
  ZOOM_FACTOR: 17.0,
  INERTIA_ZOOM: 0.9,
  MESSAGE_DURATION: 650,
  DEBOUNCE_DELAY: 300,
};

// ==================== SUPABASE CLIENT ====================
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ==================== UTILITY FUNCTIONS ====================
const fakeEmail = (username) => `${username}@delete.theearth`;
const normalizeCoord = (value) => Math.floor(value * 1000) / 1000;

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Toast notification system
class ToastManager {
  static show(text, type = "success", duration = CONFIG.MESSAGE_DURATION) {
    const existingToasts = document.querySelectorAll('.toastMessage');
    existingToasts.forEach(toast => toast.remove());

    const message = document.createElement("div");
    message.textContent = text;
    message.className = `toastMessage ${type}`;
    document.body.appendChild(message);

    setTimeout(() => {
      message.style.opacity = "0";
      setTimeout(() => message.remove(), 150);
    }, duration);
  }
}

// ==================== GAME STATE REDUCER ====================
const gameStateReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TOTALS':
      return { ...state, totals: action.payload };
    case 'SET_TOP_USERS':
      return { ...state, topUsers: action.payload };
    case 'SET_CLICKS':
      return { ...state, clicksTotal: action.payload };
    case 'SET_SUPER_CLICKS':
      return { ...state, superClicksTotal: action.payload };
    case 'TOGGLE_SUPER_CLICK':
      return { ...state, superClickEnabled: !state.superClickEnabled };
    case 'SET_COOLDOWN_MESSAGE':
      return { ...state, cooldownMessage: action.payload };
    default:
      return state;
  }
};

const initialGameState = {
  totals: { total: 0, expected_total: 0, percentage: 0 },
  topUsers: [],
  clicksTotal: 0,
  superClicksTotal: 0,
  superClickEnabled: false,
  cooldownMessage: null,
};

// ==================== UI STATE REDUCER ====================
const uiStateReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_MENU':
      return { ...state, [action.menu]: !state[action.menu] };
    case 'SET_AUTH_MODE':
      return { ...state, authMode: action.payload };
    case 'SET_FORM':
      return { ...state, form: { ...state.form, ...action.payload } };
    case 'RESET_FORM':
      return { ...state, form: { username: "", password: "" } };
    default:
      return state;
  }
};

const initialUIState = {
  leaderboardOpen: false,
  statsOpen: false,
  authOpen: false,
  buyMenuOpen: false,
  authMode: "login",
  form: { username: "", password: "" },
};

// ==================== CESIUM HELPERS ====================
const CesiumHelpers = {
  drawDeletedCell: (viewer, lat, lon) => {
    const rect = Cesium.Rectangle.fromDegrees(
      lon - CONFIG.CELL_PADDING,
      lat - CONFIG.CELL_PADDING,
      lon + CONFIG.CELL_WIDTH + CONFIG.CELL_PADDING,
      lat + CONFIG.CELL_WIDTH + CONFIG.CELL_PADDING
    );
    
    viewer.entities.add({
      rectangle: {
        coordinates: rect,
        material: Cesium.Color.BLACK.withAlpha(1.0),
        classificationType: Cesium.ClassificationType.BOTH,
      },
    });
  },

  setupViewer: async () => {
  await new Promise(requestAnimationFrame);
  const container = document.getElementById("cesiumContainer");
  if (!container) throw new Error("Cesium container not found");
  
  Cesium.Ion.defaultAccessToken = CONFIG.CESIUM_TOKEN;
    
  const terrainProvider = await Cesium.createWorldTerrainAsync();
  const viewer = new Cesium.Viewer(container, "cesiumContainer", {
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

    viewer.trackedEntity = undefined;

    const controller = viewer.scene.screenSpaceCameraController;
    controller.zoomFactor = CONFIG.ZOOM_FACTOR;
    controller.inertiaZoom = CONFIG.INERTIA_ZOOM;

    return viewer;
  },

  getViewBounds: (viewer) => {
    const rect = viewer.camera.computeViewRectangle();
    if (!rect) return null;

    return {
      minLat: Cesium.Math.toDegrees(rect.south),
      maxLat: Cesium.Math.toDegrees(rect.north),
      minLon: Cesium.Math.toDegrees(rect.west),
      maxLon: Cesium.Math.toDegrees(rect.east),
    };
  },

  getClickCoordinates: (viewer, movement) => {
    const ray = viewer.camera.getPickRay(movement.position);
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    
    if (!cartesian) return null;

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    return {
      lat: normalizeCoord(Cesium.Math.toDegrees(cartographic.latitude)),
      lon: normalizeCoord(Cesium.Math.toDegrees(cartographic.longitude)),
    };
  },
};

// ==================== API CLIENT ====================
class APIClient {
  static async request(endpoint, options = {}) {
    const url = `${CONFIG.API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    return response.json();
  }

  static async authenticatedRequest(endpoint, options = {}) {
    const session = await supabase.auth.getSession();
    const token = session.data?.session?.access_token;
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    return this.request(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  static async fetchDeletedCells(bounds) {
    const { minLat, maxLat, minLon, maxLon } = bounds;
    return this.request(`/deleted?minLat=${minLat}&maxLat=${maxLat}&minLon=${minLon}&maxLon=${maxLon}`);
  }

  static async fetchTotals() {
    return this.request('/total-deletions');
  }

  static async fetchTopUsers() {
    return this.request('/top-users');
  }

  static async fetchUserProfile() {
    return this.authenticatedRequest('/profile');
  }

  static async deleteCell(lat, lon, superClick = false) {
    return this.authenticatedRequest('/delete', {
      method: 'POST',
      body: JSON.stringify({ lat, lon, superClick }),
    });
  }

  static async buyClicks(amount) {
    return this.authenticatedRequest('/buy-clicks', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  static async createProfile(id, username) {
    const session = await supabase.auth.getSession();
    const token = session.data?.session?.access_token;
    
    return this.request('/create-profile', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, username }),
    });
  }

  static async upgradeSuperClick() {
    return this.authenticatedRequest('/profile/upgrade-super-click', {
      method: 'POST',
    });
  }
}

// ==================== MAIN APP COMPONENT ====================
function App() {
  // ========== STATE MANAGEMENT ==========
  const viewerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem("username") || null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState(null);
  
  // Game state
  const [gameState, dispatchGame] = useReducer(gameStateReducer, initialGameState);
  
  // UI state
  const [uiState, dispatchUI] = useReducer(uiStateReducer, initialUIState);

  // Refs for stable references in event handlers
  const userRef = useRef(null);
  const gameStateRef = useRef(gameState);

  // Update refs when state changes
  useEffect(() => {
    userRef.current = user;
    gameStateRef.current = gameState;
  }, [user, gameState]);

  // ========== MEMOIZED VALUES ==========
  const cesiumConfig = useMemo(() => ({
    terrainProvider: null, // Will be set async
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    geocoder: true,
    requestRenderMode: true,
    maximumRenderTimeChange: 0,
  }), []);

  // ========== API FUNCTIONS ==========
  const fetchUserProfile = useCallback(async () => {
    try {
      const data = await APIClient.fetchUserProfile();
      setUsername(data.username);
      localStorage.setItem("username", data.username);
      dispatchGame({ type: 'SET_CLICKS', payload: data.clicks_total });
      dispatchGame({ type: 'SET_SUPER_CLICKS', payload: data.super_clicks });
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setError("Failed to load user profile");
    }
  }, []);

  const fetchTotals = useCallback(async () => {
    try {
      const data = await APIClient.fetchTotals();
      dispatchGame({ type: 'SET_TOTALS', payload: data });
    } catch (err) {
      console.error("Error fetching totals:", err);
    }
  }, []);

  const fetchTopUsers = useCallback(async () => {
    try {
      const data = await APIClient.fetchTopUsers();
      dispatchGame({ type: 'SET_TOP_USERS', payload: data });
    } catch (err) {
      console.error("Error fetching top users:", err);
    }
  }, []);

  const fetchDeletedCells = useCallback(async (viewer) => {
    try {
      const bounds = CesiumHelpers.getViewBounds(viewer);
      if (!bounds) return;

      const cells = await APIClient.fetchDeletedCells(bounds);
      cells.forEach(({ lat, lon }) => CesiumHelpers.drawDeletedCell(viewer, lat, lon));
    } catch (err) {
      console.error("Error fetching deleted cells:", err);
    }
  }, []);

  // Debounced version for camera movements
  const debouncedFetchCells = useCallback(
    debounce((viewer) => fetchDeletedCells(viewer), CONFIG.DEBOUNCE_DELAY),
    [fetchDeletedCells]
  );

  // ========== EVENT HANDLERS ==========
  const handleClick = useCallback(async (viewer, movement) => {
    const currentUser = userRef.current;
    const currentGameState = gameStateRef.current;

    if (!currentUser) {
      ToastManager.show("You need to log in to delete Earth", "error");
      return;
    }

    const isSuper = currentGameState.superClickEnabled;

    if (!isSuper && currentGameState.clicksTotal <= 0) {
      ToastManager.show("You're out of clicks! Buy more to keep deleting", "error");
      return;
    }

    if (isSuper && currentGameState.superClicksTotal <= 0) {
      ToastManager.show("You're out of super clicks. Upgrade your clicks!", "error");
      return;
    }

    ToastManager.show(isSuper ? "Super Deleting Earth..." : "Deleting Earth...", "warn");

    const coords = CesiumHelpers.getClickCoordinates(viewer, movement);
    if (!coords) return;

    const { lat, lon } = coords;
    viewer.trackedEntity = undefined;

    // Optimistically draw the cell
    CesiumHelpers.drawDeletedCell(viewer, lat, lon);
    viewer.scene.requestRender();

    try {
      const data = await APIClient.deleteCell(lat, lon, isSuper);

      if (data.alreadyDeleted) {
        ToastManager.show("Earth is already deleted here", "error");
        return;
      }

      // Draw additional cells for super clicks
      if (isSuper && Array.isArray(data.coordinates)) {
        data.coordinates.forEach(({ lat, lon }) => {
          CesiumHelpers.drawDeletedCell(viewer, lat, lon);
        });
      }

      ToastManager.show(isSuper ? "Super Earth deleted!" : "Earth deleted");
      fetchTotals();
      fetchUserProfile();
    } catch (error) {
      console.error("Delete request failed:", error);
      ToastManager.show("Error deleting Earth.", "error");
    }
  }, [fetchTotals, fetchUserProfile]);

  const handleAuth = useCallback(async () => {
    const email = fakeEmail(uiState.form.username);
    
    try {
      setError(null);
      
      if (uiState.authMode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: uiState.form.password,
        });
        
        if (error) throw new Error(error.message);
        if (!data.session || !data.user) throw new Error("No session returned");

        setUser(data.session.user);
        await APIClient.createProfile(data.user.id, uiState.form.username);
        await fetchUserProfile();
        
        ToastManager.show("Registration successful!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: uiState.form.password,
        });
        
        if (error) throw new Error(error.message);
        if (!data.session) throw new Error("No session returned");

        setUser(data.session.user);
        await fetchUserProfile();
      }
      
      dispatchUI({ type: 'RESET_FORM' });
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err.message);
      ToastManager.show(`Authentication failed: ${err.message}`, "error");
    }
  }, [uiState.form, uiState.authMode, fetchUserProfile]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername(null);
    localStorage.removeItem("username");
  }, []);

  const handleBuyClicks = useCallback(async (clickAmount) => {
    try {
      dispatchGame({ type: 'SET_COOLDOWN_MESSAGE', payload: null });
      
      const data = await APIClient.buyClicks(clickAmount);
      ToastManager.show(`Purchased ${clickAmount.toLocaleString()} clicks!`);
      fetchUserProfile();
    } catch (err) {
      console.error("Buy clicks failed:", err);
      
      if (err.message.includes('429') && clickAmount === 200) {
        dispatchGame({ type: 'SET_COOLDOWN_MESSAGE', payload: err.message });
      } else {
        ToastManager.show(`Purchase failed: ${err.message}`, "error");
      }
    }
  }, [fetchUserProfile]);

  const handleUpgradeSuperClick = useCallback(async () => {
    try {
      const data = await APIClient.upgradeSuperClick();
      ToastManager.show(data.message || "Upgrade successful!");
      fetchUserProfile();
    } catch (err) {
      console.error("Upgrade error:", err);
      ToastManager.show(err.message || "Upgrade failed", "error");
    }
  }, [fetchUserProfile]);

  // ========== EFFECTS ==========
  
  // Initialize authentication - runs once
  useEffect(() => {
    const initAuth = async () => {
      setLoadingSession(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser(session.user);
          await fetchUserProfile();
        }
      } catch (err) {
        console.error("Session initialization failed:", err);
        setError("Failed to initialize session");
      } finally {
        setLoadingSession(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth change:", event, session);
      
      if (session) {
        setUser(session.user);
        await fetchUserProfile();
      } else {
        setUser(null);
      }
    });

    initAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Initialize Cesium viewer - runs once
  useEffect(() => {
    let viewer = null;
    let handler = null;

    const initCesium = async () => {
      try {
        viewer = await CesiumHelpers.setupViewer();
        viewerRef.current = viewer;

        await fetchDeletedCells(viewer);
        fetchTotals();

        // Set up event handlers
        viewer.camera.moveEnd.addEventListener(() => {
          debouncedFetchCells(viewer);
        });

        handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement) => {
          handleClick(viewer, movement);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      } catch (err) {
        console.error("Cesium initialization failed:", err);
        setError("Failed to initialize 3D viewer");
      }
    };

    initCesium();

    return () => {
      if (handler && !handler.isDestroyed()) {
        handler.destroy();
      }
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, [fetchDeletedCells, fetchTotals, debouncedFetchCells, handleClick]);

  // Fetch leaderboard when opened
  useEffect(() => {
    if (uiState.leaderboardOpen) {
      fetchTopUsers();
    }
  }, [uiState.leaderboardOpen, fetchTopUsers]);

  // Handle mobile keyboard for auth inputs
  useEffect(() => {
    if (!uiState.authOpen) return;

    const authBox = document.querySelector(".authBox");
    if (!authBox) return;

    const inputs = authBox.querySelectorAll("input");
    const handlers = [];

    inputs.forEach((input) => {
      const handleFocus = () => (authBox.style.bottom = "200px");
      const handleBlur = () => (authBox.style.bottom = "20px");

      input.addEventListener("focus", handleFocus);
      input.addEventListener("blur", handleBlur);
      
      handlers.push(() => {
        input.removeEventListener("focus", handleFocus);
        input.removeEventListener("blur", handleBlur);
      });
    });

    return () => {
      handlers.forEach(cleanup => cleanup());
    };
  }, [uiState.authOpen]);

  // ========== RENDER ==========
  if (loadingSession) {
    return (
      <div className="loading-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div>Error: {error}</div>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  return (
    <>      
      <div id="cesiumContainer" style={{ width: "100vw", height: "100vh" }} />
      
      <div className="topLeftMenu">
        {!user ? (
          <div className={`authBox ${uiState.authOpen ? "expanded" : ""}`}>
            <button onClick={() => dispatchUI({ type: 'TOGGLE_MENU', menu: 'authOpen' })}>
              {uiState.authOpen ? "Hide Login / Register ▲" : "Show Login / Register  ▼"}
            </button>
            {uiState.authOpen && (
              <>
                <input
                  type="text"
                  placeholder="Username"
                  value={uiState.form.username}
                  onChange={(e) => dispatchUI({ 
                    type: 'SET_FORM', 
                    payload: { username: e.target.value } 
                  })}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={uiState.form.password}
                  onChange={(e) => dispatchUI({ 
                    type: 'SET_FORM', 
                    payload: { password: e.target.value } 
                  })}
                />
                <button onClick={handleAuth}>
                  {uiState.authMode === "login" ? "Log In" : "Register"}
                </button>
                <button onClick={() => dispatchUI({ 
                  type: 'SET_AUTH_MODE', 
                  payload: uiState.authMode === "login" ? "register" : "login" 
                })}>
                  Switch to {uiState.authMode === "login" ? "Register" : "Login"}
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
              <button onClick={() => dispatchUI({ type: 'TOGGLE_MENU', menu: 'buyMenuOpen' })}>
                {uiState.buyMenuOpen ? "Hide User Menu ▲" : "Show User Menu ▼"}
              </button>
              {uiState.buyMenuOpen && (
                <div className="buyContent">
                  <div className="clicksAvailable">
                    <div><strong>Available Clicks:</strong> {gameState.clicksTotal}</div>
                    <div><strong>Available Super Clicks:</strong> {gameState.superClicksTotal}</div>
                  </div>
                  <div className="superClickToggle" style={{ marginTop: "1rem" }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={gameState.superClickEnabled}
                        onChange={() => dispatchGame({ type: 'TOGGLE_SUPER_CLICK' })}
                      />
                      Enable Super Click
                    </label>
                  </div>
                  <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
                    Purchase Clicks
                  </div>
                  <button className="freeClicksButton" onClick={() => handleBuyClicks(5)}>
                    Get 5 Free Clicks
                  </button>
                  {gameState.cooldownMessage && (
                    <div style={{ color: "red", marginTop: "0.5rem" }}>
                      {gameState.cooldownMessage}
                    </div>
                  )}
                  
                  {!CONFIG.IS_PAYMENT_ENABLED && (
                    <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
                      Paid clicks coming soon
                    </div>
                  )}
                  {[
                    { clicks: 100, price: 1 }, 
                    { clicks: 1000, price: 5 }, 
                    { clicks: 5000, price: 10 }
                  ].map(({ clicks, price }) => (
                    <button
                      key={clicks}
                      onClick={() => handleBuyClicks(clicks)}
                      disabled={!CONFIG.IS_PAYMENT_ENABLED}
                    >
                      Buy {clicks.toLocaleString()} (£{price}) 
                    </button>
                  ))}
                  <div className="upgradesMenu">
                    <div style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#999" }}>
                      Upgrade Clicks - Delete More!
                    </div>
                    <button onClick={handleUpgradeSuperClick} className="superClickButton">
                      Upgrade to a Super Click
                    </button>
                    <p className="info-text">
                      Use 200 clicks to get 1 Super Click, which deletes over 500 coordinates at once!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="statsMenu">
        <button onClick={() => dispatchUI({ type: 'TOGGLE_MENU', menu: 'statsOpen' })}>
          {uiState.statsOpen ? "Hide Stats ▼" : "Show Stats ▲"}
        </button>
        {uiState.statsOpen && (
          <div className="statsContent">
            <div><strong>Current Deleted:</strong> {gameState.totals.total.toLocaleString()}</div>
            <div><strong>Total: </strong> {gameState.totals.expected_total.toLocaleString()}</div>
            <div><strong>% Deleted:</strong> {gameState.totals.percentage?.toFixed(10)}%</div>
          </div>
        )}
      </div>

      <div className="leaderboardMenu">
        <button onClick={() => dispatchUI({ type: 'TOGGLE_MENU', menu: 'leaderboardOpen' })}>
          {uiState.leaderboardOpen ? "Hide Leaderboard ▼" : "Show Leaderboard ▲"}
        </button>
        {uiState.leaderboardOpen && (
          <div className="leaderboardContent">
            <ol>
              {gameState.topUsers.map(({ username, clicks_used }, index) => (
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

export default App;