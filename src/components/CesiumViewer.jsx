import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import { CESIUM_TOKEN, API_URL, MIN_ZOOM_LEVEL, ZOOM_FACTOR, INERTIA_ZOOM, ZOOM_OUT_LEVEL, SUPABASE } from '../config/config';
import { drawDeletedCell, fetchDeletedCells, normalizeCoord } from "../utils/cesiumCells";

export default function CesiumViewer({ user, superClickEnabled, fetchUserProfile, showMessage }) {
  const viewerRef = useRef(null);
  const containerRef = useRef(null); 
  const userRef = useRef(null);
  const clickInProgressRef = useRef(false); // Prevent rapid clicks

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const handleClick = async (viewer, movement) => {
    if (clickInProgressRef.current) return;
    clickInProgressRef.current = true;

    try {
      if (!viewer || !viewer.scene || !viewer.camera) {
        console.warn("Viewer not ready on click");
        return;
      }

      if (!userRef.current) {
        showMessage("You need to log in to delete Earth", "error");
        return;
      }

      if (!superClickEnabled && viewer.clicksLeft <= 0) {
        showMessage("You're out of clicks!", "error");
        return;
      }

      if (superClickEnabled && viewer.superClicksLeft <= 0) {
        showMessage("You're out of super clicks!", "error");
        return;
      }

      const positionCartographic = Cesium.Cartographic.fromCartesian(viewer.camera.position);
        if (!positionCartographic || positionCartographic.height > MIN_ZOOM_LEVEL) {
        showMessage("Zoom in closer to delete Earth", "error");
        return;
        }

      showMessage(superClickEnabled ? "Super Click deleting Earth" : "Deleting Earth", "warn");

      const ray = viewer.camera.getPickRay(movement.position);
      const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (!cartesian) return;

      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lat = normalizeCoord(Cesium.Math.toDegrees(cartographic.latitude));
      const lon = normalizeCoord(Cesium.Math.toDegrees(cartographic.longitude));

      drawDeletedCell(viewer, lat, lon);

      const token = (await SUPABASE.auth.getSession()).data?.session?.access_token;
      const res = await fetch(`${API_URL}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lat, lon, superClick: superClickEnabled }),
      });

      const data = await res.json();
      if (data.alreadyDeleted) {
        showMessage("Earth already deleted here", "error");
        return;
      }

      if (superClickEnabled && Array.isArray(data.coordinates)) {
        data.coordinates.forEach(({ lat, lon }) => drawDeletedCell(viewer, lat, lon));
      }

      showMessage(superClickEnabled ? "Earth deleted with Super Click" : "Earth deleted!");
      fetchUserProfile();
    } catch (err) {
      console.error(err);
      showMessage("Error deleting Earth", "error");
    } finally {
      clickInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let viewer;
    let handler;

    async function initCesium() {
      Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

      const terrainProvider = await Cesium.createWorldTerrainAsync();

      viewer = new Cesium.Viewer(containerRef.current, {
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
      controller.zoomFactor = ZOOM_FACTOR;
      controller.inertiaZoom = INERTIA_ZOOM;

        viewerRef.current = viewer;


      await fetchDeletedCells(viewer); fetchTotals();

      viewer.camera.moveEnd.addEventListener(() => fetchDeletedCells(viewer));

      handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement) => {
        const currentViewer = viewerRef.current;
        if (!currentViewer || !currentViewer.scene || !currentViewer.camera) {
          console.warn("Viewer or scene not ready yet on click");
          return;
        }
        handleClick(currentViewer, movement);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    initCesium();

    return () => {
      if (handler) {
        handler.destroy();
        handler = null;
      }
      if (viewer) {
        viewer.destroy();
        viewerRef.current = null;
        viewer = null;
      }
    };
  }, [user, superClickEnabled]);

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
      <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />
      <button className="zoom-out-button" onClick={zoomOut}>Show Full Earth</button>
    </>
  );
}
