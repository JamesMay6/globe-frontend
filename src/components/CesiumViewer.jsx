import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import {
  CESIUM_TOKEN,
  MIN_ZOOM_LEVEL,
  ZOOM_FACTOR,
  INERTIA_ZOOM,
  ZOOM_OUT_LEVEL,
  SUPABASE_URL
} from "../config/config";
import {
  drawDeletedCell,
  fetchDeletedCells,
  normalizeCoord,
} from "../utils/cesiumCells";
import { deleteEarth } from "../services/api";

export default function CesiumViewer({
  user,
  superClickEnabled,
  fetchUserProfile,
  showMessage,
  clicksTotal,
  clicksUsed,
  setClicksTotal,
  setClicksUsed,
  superClicksTotal,
  setSuperClicksTotal
}) {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const clickInProgressRef = useRef(false);

  const userRef = useRef(null);
  const clicksTotalRef = useRef(0);
  const clicksUsedRef = useRef(0);
  const superClicksRef = useRef(0);
  const superClickEnabledRef = useRef(false);

  // ---------- Sync Refs ----------
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    clicksTotalRef.current = clicksTotal;
  }, [clicksTotal]);

  useEffect(() => {
    clicksUsedRef.current = clicksUsed;
  }, [clicksUsed]);

  useEffect(() => {
    superClicksRef.current = superClicksTotal;
  }, [superClicksTotal]);

  useEffect(() => {
    superClickEnabledRef.current = superClickEnabled;
  }, [superClickEnabled]);

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

      if (
        !superClickEnabledRef.current &&
        clicksTotalRef.current <= 0
      ) {
        showMessage("You're out of clicks!", "error");
        return;
      }

      if (
        superClickEnabledRef.current &&
        superClicksRef.current <= 0
      ) {
        showMessage("You're out of super clicks!", "error");
        return;
      }

      const positionCartographic = Cesium.Cartographic.fromCartesian(
        viewer.camera.position
      );

      if (
        !positionCartographic ||
        positionCartographic.height > MIN_ZOOM_LEVEL
      ) {
        showMessage("Zoom in closer to delete Earth", "error");
        return;
      }

      showMessage(
        superClickEnabledRef.current
          ? "Super Click deleting Earth"
          : "Deleting Earth",
        "warn"
      );

      const ray = viewer.camera.getPickRay(movement.position);
      const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (!cartesian) return;

      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lat = normalizeCoord(Cesium.Math.toDegrees(cartographic.latitude));
      const lon = normalizeCoord(Cesium.Math.toDegrees(cartographic.longitude));

      const data = await deleteEarth(lat, lon, superClickEnabledRef.current);

      if (data.alreadyDeleted) {
      showMessage("Earth is already deleted here", "error");
      return;
      }

      drawDeletedCell(viewer, lat, lon);

      if (
        superClickEnabledRef.current &&
        Array.isArray(data.coordinates)
      ) {
        data.coordinates.forEach(({ lat, lon }) =>
          drawDeletedCell(viewer, lat, lon)
        );
      }

      if (superClickEnabledRef.current) {
        const count = data.insertedCount ?? data.coordinates?.length ?? 0;
        showMessage(`Super Click deleted ${count} Earth coordinate${count === 1 ? "" : "s"}`);
      } else {
        showMessage("Earth deleted!");
      }
     
      setClicksTotal((prev) =>
        superClickEnabledRef.current ? prev : prev - 1
      );
      setClicksUsed((prev) =>
        superClickEnabledRef.current ? prev : prev + 1
      );
      setSuperClicksTotal((prev) =>
        superClickEnabledRef.current ? prev - 1 : prev
      );

       await fetchUserProfile();

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

      viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
          url: `${SUPABASE_URL}/tiles/{z}/{x}/{y}.png`,
          tilingScheme: new Cesium.WebMercatorTilingScheme(),
          maximumLevel: 18,
          credit: "Deleted Tiles",
        })
      );
      
      viewer.trackedEntity = undefined;

      const controller = viewer.scene.screenSpaceCameraController;
      controller.zoomFactor = ZOOM_FACTOR;
      controller.inertiaZoom = INERTIA_ZOOM;

      viewerRef.current = viewer;
      viewer.camera.flyTo({ 
        destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, ZOOM_OUT_LEVEL),
        });

      /*
      await fetchDeletedCells(viewer);

      viewer.camera.moveEnd.addEventListener(() =>
        fetchDeletedCells(viewer)
      );
      */

      handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement) => {
        const currentViewer = viewerRef.current;
        if (
          !currentViewer ||
          !currentViewer.scene ||
          !currentViewer.camera
        ) {
          console.warn("Viewer or scene not ready yet on click");
          return;
        }
        handleClick(currentViewer, movement);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      
      handler.setInputAction(() => {}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }

    initCesium();

    return () => {
      if (handler) {
        handler.destroy();
        handler = null;
      }
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
        viewerRef.current = null;
        viewer = null;
      }
    };
  }, []);

  const zoomOut = () => {
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          0.0,
          0.0,
          ZOOM_OUT_LEVEL
        ),
      });
    } else {
      console.warn("Viewer not ready yet");
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{ width: "100vw", height: "100vh" }}
      />
      <button className="zoom-out-button" onClick={zoomOut}>
        Show Full Earth
      </button>
    </>
  );
}
