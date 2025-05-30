import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

const API_URL = import.meta.env.APP_API_URL

function App() {
  const viewerRef = useRef(null);

  // Round lat/lon to 3 decimal places
  const roundCoord = (value) => Math.round(value * 1000) / 1000;

  // Create rectangle geometry for a grid cell
  const drawDeletedCell = (viewer, lat, lon) => {
    const cellWidth = 0.001;
    const rect = Cesium.Rectangle.fromDegrees(
      lon,
      lat,
      lon + cellWidth,
      lat + cellWidth
    );

    viewer.entities.add({
      rectangle: {
        coordinates: rect,
        material: Cesium.Color.BLACK.withAlpha(0.6),
        classificationType: Cesium.ClassificationType.BOTH,
      },
    });
  };

  // Load deleted cells within current view
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

  // Convert click to lat/lon
  const handleClick = async (viewer, movement) => {
    const ray = viewer.camera.getPickRay(movement.position);
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    if (!cartesian) return;

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const lat = roundCoord(Cesium.Math.toDegrees(cartographic.latitude));
    const lon = roundCoord(Cesium.Math.toDegrees(cartographic.longitude));

    // Post to backend
    await fetch(`${API_URL}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon }),
    });

    // Draw cell immediately
    drawDeletedCell(viewer, lat, lon);
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

      // Refresh deleted cells on camera move end
      viewer.camera.moveEnd.addEventListener(() => {
        fetchDeletedCells(viewer);
      });

      // Click handler
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

  return <div id="cesiumContainer" style={{ width: "100vw", height: "100vh" }} />;
}

export default App;
