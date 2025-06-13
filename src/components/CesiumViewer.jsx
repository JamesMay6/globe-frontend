import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import {
  CESIUM_TOKEN,
  MIN_ZOOM_LEVEL,
  ZOOM_FACTOR,
  INERTIA_ZOOM,
  ZOOM_OUT_LEVEL,
  BACKEND_URL
} from "../config/config";
import {
  drawDeletedCell,
  drawDeletedCells,
  fetchDeletedCells,
  normalizeCoord,
  pruneDrawnCellsOutsideView,
  pruneFetchedBounds
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
  setSuperClicksTotal,
  ultraClicksTotal,
  setUltraClicksTotal,
  ultraClickEnabled,
  setSuperClickEnabled,
  setUltraClickEnabled
}) {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const clickInProgressRef = useRef(false);

  const userRef = useRef(null);
  const clicksTotalRef = useRef(0);
  const clicksUsedRef = useRef(0);
  const superClicksRef = useRef(0);
  const superClickEnabledRef = useRef(false);
  const ultraClicksRef = useRef(0);
  const ultraClickEnabledRef = useRef(false);

  const lastFetchedRef = useRef({ lat: null, lon: null, zoom: null });

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

   useEffect(() => {
    ultraClicksRef.current = ultraClicksTotal;
  }, [ultraClicksTotal]);

  useEffect(() => {
    ultraClickEnabledRef.current = ultraClickEnabled;
  }, [ultraClickEnabled]);

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

      if (
        ultraClickEnabledRef.current &&
        ultraClicksRef.current <= 0
      ) {
        showMessage("You're out of ultra clicks!", "error");
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
        ultraClickEnabledRef.current
          ? "Ultra Click deleting Earth"
          : superClickEnabledRef.current
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

      const data = await deleteEarth(lat, lon, superClickEnabledRef.current, ultraClickEnabledRef.current);

      if (data.alreadyDeleted) {
      showMessage("Earth is already deleted here", "error");
      return;
      }

      if (
        (superClickEnabledRef.current || ultraClickEnabledRef.current) &&
        Array.isArray(data.coordinates)
      ) {
        drawDeletedCells(viewer, data.coordinates);
      } else {
        drawDeletedCell(viewer, lat, lon);
      }

      if (ultraClickEnabledRef.current) {
        const count = data.insertedCount ?? data.coordinates?.length ?? 0;
        showMessage(`Ultra Click deleted ${count} Earth coordinate${count === 1 ? "" : "s"}`);
      } else if (superClickEnabledRef.current) {
        const count = data.insertedCount ?? data.coordinates?.length ?? 0;
        showMessage(`Super Click deleted ${count} Earth coordinate${count === 1 ? "" : "s"}`);
      } else {
        showMessage("Earth deleted!");
      }

      setClicksTotal((prev) =>
        superClickEnabledRef.current || ultraClickEnabledRef.current ? prev : prev - 1
      );

      setClicksUsed((prev) =>
        superClickEnabledRef.current || ultraClickEnabledRef.current ? prev : prev + 1
      );

      // After decrementing super clicks:
      if (superClickEnabledRef.current) {
        setSuperClicksTotal(prev => prev - 1);

        // Disable super click after successful use
        setSuperClickEnabled(false);
        superClickEnabledRef.current = false; 
        setTimeout(() => {
          showMessage("Super Click Disabled", "warn");
        }, 1500); // 500ms delay
      }

      // After decrementing ultra clicks:
      if (ultraClickEnabledRef.current) {
        setUltraClicksTotal(prev => prev - 1);

        // Disable ultra click after successful use
        setUltraClickEnabled(false);
        ultraClickEnabledRef.current = false;
        setTimeout(() => {
          showMessage("Ultra Click Disabled", "warn");
        }, 1500); // 500ms delay
        
      }

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

      //const terrainProvider = await Cesium.createWorldTerrainAsync(); //3d terrain
      const terrainProvider = new Cesium.EllipsoidTerrainProvider(); // flat, no elevation
      const imageryProvider = await Cesium.IonImageryProvider.fromAssetId(2); //Bing Ariel
      //const imageryProvider = await Cesium.IonImageryProvider.fromAssetId(3954); //Sentinal

      // Initialize the Cesium Viewer
      viewer = new Cesium.Viewer(containerRef.current, {
        terrainProvider: terrainProvider,
        baseLayer: new Cesium.ImageryLayer(imageryProvider),
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

      viewer._fetchedBounds = [];
      
      viewer.trackedEntity = undefined;

      const controller = viewer.scene.screenSpaceCameraController;
      controller.zoomFactor = ZOOM_FACTOR;
      controller.inertiaZoom = INERTIA_ZOOM;

      viewerRef.current = viewer;
      viewer.camera.flyTo({ 
        destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, ZOOM_OUT_LEVEL),
        });
        
      setTimeout(() => {
        const input = document.querySelector(".cesium-geocoder-input");
        if (input) {
          input.addEventListener("focus", (e) => {
            // Put the cursor at the end
            requestAnimationFrame(() => {
              input.setSelectionRange(input.value.length, input.value.length);
            });
          });

          // Ensure it doesn't auto-focus on page load
          input.blur();

          // Optional styling to stop shifting
          input.style.whiteSpace = "nowrap";
          input.style.overflow = "hidden";
          input.style.textOverflow = "ellipsis";
        }

        // Remove focus from the whole geocoder container if needed
        const geocoderContainer = document.querySelector(".cesium-geocoder");
        if (geocoderContainer) {
          geocoderContainer.setAttribute("tabindex", "-1");
        }
      }, 300);

      let pruneTimeout = null;

      viewer.camera.moveEnd.addEventListener(() => {
        const camera = viewer.camera;
        const scene = viewer.scene;
        const ellipsoid = scene.globe.ellipsoid;

        // Compute viewport bounds as before...
        const rect = camera.computeViewRectangle(ellipsoid);
        if (!rect) return;

        let west = Cesium.Math.toDegrees(rect.west) - 1;
        let south = Cesium.Math.toDegrees(rect.south) - 1;
        let east = Cesium.Math.toDegrees(rect.east) + 1;
        let north = Cesium.Math.toDegrees(rect.north) + 1;

        west = Math.max(-180, west);
        south = Math.max(-90, south);
        east = Math.min(180, east);
        north = Math.min(90, north);

        // Existing fetch logic ...
        const last = lastFetchedRef.current;
        const centerLat = ((north + south) / 2).toFixed(3);
        const centerLon = ((east + west) / 2).toFixed(3);

        const movedEnough =
          last.lat === null ||
          last.lon === null ||
          Math.abs(centerLat - last.lat) >= 0.5 ||
          Math.abs(centerLon - last.lon) >= 0.5;

        if (movedEnough) {
          lastFetchedRef.current = {
            lat: parseFloat(centerLat),
            lon: parseFloat(centerLon),
          };

          fetchDeletedCells(viewer, { west, south, east, north }).catch(console.error);
        }

        // Debounce pruning
        if (pruneTimeout) clearTimeout(pruneTimeout);
        pruneTimeout = setTimeout(() => {
          pruneDrawnCellsOutsideView(viewer, 1);
          pruneFetchedBounds(viewer, 1);
        }, 500);
      });



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

            fetchDeletedCells(viewer).catch(err => {
          console.error("Failed to fetch deleted cells:", err);
    });
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
        ref={containerRef} className="cesium-container"/>
      <button className="zoom-out-button" onClick={zoomOut}>
        🌍
      </button>
    </>
  );
}
