import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import {
  CESIUM_TOKEN,
  MIN_ZOOM_LEVEL,
  ZOOM_FACTOR,
  INERTIA_ZOOM,
  ZOOM_OUT_LEVEL,
  IMAGERY_PROVIDER_KEY
} from "../config/config";
import {
  fetchDeletedCells,
  pruneDrawnCellsOutsideView,
  pruneFetchedBounds,
  resetDrawnCells 
} from "../utils/cesiumCells";
import { getImageryProvider } from "../utils/getImageryProvider";
import { useHandleClick } from "../hooks/useHandleClick";
import { zoomOut } from "../utils/zoomOut";

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
  const lastFetchedRef = useRef({ lat: null, lon: null, zoom: null });
  const handleClick = useHandleClick({
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
    setUltraClickEnabled,
  });
  
  useEffect(() => {
    if (!containerRef.current) return;

    let viewer;
    let handler;

    async function initCesium() {
      resetDrawnCells(); // ← clears memory of previously drawn cells

      Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

      const terrainProvider = new Cesium.EllipsoidTerrainProvider(); 
      const imageryProvider = await getImageryProvider(IMAGERY_PROVIDER_KEY);

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

      viewer._fetchedBounds = new Set();
      
      viewer.trackedEntity = undefined;

      const controller = viewer.scene.screenSpaceCameraController;
      controller.zoomFactor = ZOOM_FACTOR;
      controller.inertiaZoom = INERTIA_ZOOM;

      viewerRef.current = viewer;
      viewer.camera.flyTo({ 
        destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, ZOOM_OUT_LEVEL),
        });

      setTimeout(() => {
        fetchDeletedCells(viewer).catch(console.error);
      }, 1000);
        
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

      //Mapbox log credit
      const mapboxLogoCredit = new Cesium.Credit(
        '<a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer">' +
        '<img src="https://docs.mapbox.com/help/demos/custom-markers-gl-js/mapbox-icon.png" ' +
        'alt="Mapbox Logo" class="mapboxlogo">' +
        '</a>'
      );

      viewer._cesiumWidget._creditContainer.appendChild(mapboxLogoCredit.element);

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
          viewer.camera.changed || 
          Math.abs(centerLat - last.lat) >= 0.5 ||
          Math.abs(centerLon - last.lon) >= 0.5;

        if (movedEnough) {
          lastFetchedRef.current = {
            lat: parseFloat(centerLat),
            lon: parseFloat(centerLon),
          };

          fetchDeletedCells(viewer.scene.primitives, { west, south, east, north }).catch(console.error);
        }

        // Debounce pruning
        if (pruneTimeout) clearTimeout(pruneTimeout);
        pruneTimeout = setTimeout(() => {
          pruneDrawnCellsOutsideView(viewer.scene.primitives, viewer, 1);
          pruneFetchedBounds(viewer.scene.primitives, viewer, 1);
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
