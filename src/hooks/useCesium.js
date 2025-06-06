import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { normalizeCoord, drawDeletedCell } from "../utils/cesium";
import { useSupabaseSession } from "./useSupabaseSession";
import { useToast } from "./useToast";
import { fetchDeletedCells, deleteEarthCell } from "../api/earth";

export function useCesium({ onDeleteSuccess }) {
  const viewerRef = useRef(null);
  const { session } = useSupabaseSession();
  const { showMessage } = useToast();

  useEffect(() => {
    if (!session) return;

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

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction(async (movement) => {
        const ray = viewer.camera.getPickRay(movement.position);
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        if (!cartesian) return;

        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lat = normalizeCoord(Cesium.Math.toDegrees(cartographic.latitude));
        const lon = normalizeCoord(Cesium.Math.toDegrees(cartographic.longitude));

        drawDeletedCell(viewer, lat, lon);

        try {
          await deleteEarthCell({ lat, lon });
          showMessage("Earth deleted!", "success");
          onDeleteSuccess?.(); // Let parent refresh profile/totals
        } catch (err) {
          console.error("Delete failed", err);
          showMessage("Error deleting Earth", "error");
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    })();

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
    };
  }, [session]);

  return { viewerRef };
}