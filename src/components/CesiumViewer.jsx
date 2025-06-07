import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import { CESIUM_TOKEN, API_URL, MIN_ZOOM_LEVEL, ZOOM_FACTOR, INERTIA_ZOOM, ZOOM_OUT_LEVEL, SUPABASE } from './config/config';
import { drawDeletedCell, fetchDeletedCells, normalizeCoord } from "./utils/cesiumCells";

export default function CesiumViewer({ user, superClickEnabled, fetchUserProfile, showMessage }) {
  const viewerRef = useRef(null);

  const handleClick = async (viewer, movement) => {
    if (!user) return showMessage("You need to log in to delete Earth", "error");

    if (!superClickEnabled && viewer.clicksLeft <= 0) return showMessage("You're out of clicks!", "error");
    if (superClickEnabled && viewer.superClicksLeft <= 0) return showMessage("You're out of super clicks!", "error");

    if (viewer.camera.positionCartographic.height > MIN_ZOOM_LEVEL)
      return showMessage("Zoom in closer to delete Earth", "error");

    showMessage(superClickEnabled ? "Super Click deleting Earth" : "Deleting Earth", "warn");

    const ray = viewer.camera.getPickRay(movement.position);
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    if (!cartesian) return;

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const lat = normalizeCoord(Cesium.Math.toDegrees(cartographic.latitude));
    const lon = normalizeCoord(Cesium.Math.toDegrees(cartographic.longitude));

    drawDeletedCell(viewer, lat, lon);

    try {
      const token = (await SUPABASE.auth.getSession()).data?.session?.access_token;
      const res = await fetch(`${API_URL}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lat, lon, superClick: superClickEnabled }),
      });

      const data = await res.json();
      if (data.alreadyDeleted) return showMessage("Earth already deleted here", "error");

      if (superClickEnabled && Array.isArray(data.coordinates)) {
        data.coordinates.forEach(({ lat, lon }) => drawDeletedCell(viewer, lat, lon));
      }

      showMessage(superClickEnabled ? "Earth deleted with Super Click" : "Earth deleted!");
      fetchUserProfile();
    } catch (err) {
      console.error(err);
      showMessage("Error deleting Earth", "error");
    }
  };

  useEffect(() => {
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

      const controller = viewer.scene.screenSpaceCameraController;
      controller.zoomFactor = ZOOM_FACTOR;
      controller.inertiaZoom = INERTIA_ZOOM;

      await fetchDeletedCells(viewer);
      viewer.camera.moveEnd.addEventListener(() => fetchDeletedCells(viewer));

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement) => handleClick(viewer, movement), Cesium.ScreenSpaceEventType.LEFT_CLICK);
    })();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [user, superClickEnabled]); // re-attach handlers on auth or click mode change

  // Expose zoomOut button here or lift up
  const zoomOut = () => {
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, ZOOM_OUT_LEVEL),
      });
    } else {
      console.warn("Viewer not ready yet");
    }
  };

  return (
    <>
      <div id="cesiumContainer" style={{ width: "100vw", height: "100vh" }} />
      <button className="zoom-out-button" onClick={zoomOut}>Show Full Earth</button>
    </>
  );
}
