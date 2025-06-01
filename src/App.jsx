import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const viewerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [totals, setTotals] = useState({ total: 0, expected_total: 0, percentage: 0 });

  const normalizeCoord = (value) => Math.floor(value * 1000) / 1000;

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

  const handleClick = async (viewer, movement) => {
    const ray = viewer.camera.getPickRay(movement.position);
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    if (!cartesian) return;

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const lat = normalizeCoord(Cesium.Math.toDegrees(cartographic.latitude));
    const lon = normalizeCoord(Cesium.Math.toDegrees(cartographic.longitude));

    await fetch(`${API_URL}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon }),
    });

    drawDeletedCell(viewer, lat, lon);
    viewer.scene.requestRender();

    fetchTotals(); // Update after each click
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
  }, []);

  return (
    <>
      <div id="cesiumContainer" style={{ width: "100vw", height: "100vh" }} />

      <div id="statsMenu">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "Hide Stats ▲" : "Show Stats ▼"}
        </button>

        {menuOpen && (
          <div className="statsContent">
            <div><strong>Total Deleted:</strong> {totals.total.toLocaleString()}</div>
            <div><strong>Expected Total:</strong> {totals.expected_total.toLocaleString()}</div>
            <div><strong>% Destroyed:</strong> {totals.percentage?.toFixed(6)}%</div>
          </div>
        )}
      </div>

    </>
  );
}

export default App;
