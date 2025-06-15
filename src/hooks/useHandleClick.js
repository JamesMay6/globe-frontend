import { useRef, useEffect } from "react";
import * as Cesium from "cesium";
import {
  drawDeletedCell,
  drawDeletedCells,
  normalizeCoord,
  getCacheKey,
  fetchedBounds
} from "../utils/cesiumCells";
import { deleteEarth, tweetUpgradedDelete } from "../services/api";
import { clearTileFromDisk } from "../utils/deletedCellCache";

export function useHandleClick({
  showMessage,
  fetchUserProfile,
  setClicksTotal,
  setClicksUsed,
  setSuperClicksTotal,
  setSuperClickEnabled,
  setUltraClicksTotal,
  setUltraClickEnabled,
  user,
  clicksTotal,
  clicksUsed,
  superClicksTotal,
  superClickEnabled,
  ultraClicksTotal,
  ultraClickEnabled,
}) {
  // Internal refs to keep latest values (avoid stale closures)
  const userRef = useRef(user);
  const clicksTotalRef = useRef(clicksTotal);
  const clicksUsedRef = useRef(clicksUsed);
  const superClicksRef = useRef(superClicksTotal);
  const superClickEnabledRef = useRef(superClickEnabled);
  const ultraClicksRef = useRef(ultraClicksTotal);
  const ultraClickEnabledRef = useRef(ultraClickEnabled);

  const clickInProgressRef = useRef(false);

  // Sync refs when props update
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

  async function handleClick(viewer, movement) {
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
        positionCartographic.height > 1500 // MIN_ZOOM_LEVEL can be imported if needed
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

      const data = await deleteEarth(
        lat,
        lon,
        superClickEnabledRef.current,
        ultraClickEnabledRef.current
      );

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

      if (
        (superClickEnabledRef.current || ultraClickEnabledRef.current) &&
        Array.isArray(data.coordinates)
      ) {
        for (const { lat: delLat, lon: delLon } of data.coordinates) {
          const cacheKey = getCacheKey(delLat, delLon);
          await clearTileFromDisk(cacheKey);
          fetchedBounds.delete(cacheKey);
        }
      } else {
        const cacheKey = getCacheKey(lat, lon);
        await clearTileFromDisk(cacheKey);
        fetchedBounds.delete(cacheKey);
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

     // DONT DO TWITTER YET

       /*
      if (superClickEnabledRef.current || ultraClickEnabledRef.current) {
        const type = ultraClickEnabledRef.current ? "Ultra" : "Super";
        const count = data.insertedCount ?? data.coordinates?.length ?? 0;

        try {
          const totals = await fetchTotals();
          const { total, expected_total, percentage } = totals;

          await tweetUpgradedDelete(
            type,
            count,
            userRef.current?.username || null,
            total,
            expected_total,
            percentage
          );
        } catch (err) {
          console.error("Tweeting failed:", err);
        }
      }
        */
        

      setClicksTotal((prev) =>
        superClickEnabledRef.current || ultraClickEnabledRef.current ? prev : prev - 1
      );

      setClicksUsed((prev) =>
        superClickEnabledRef.current || ultraClickEnabledRef.current ? prev : prev + 1
      );

      if (superClickEnabledRef.current) {
        setSuperClicksTotal((prev) => prev - 1);
        setSuperClickEnabled(false);
        superClickEnabledRef.current = false;
        setTimeout(() => {
          showMessage("Super Click Disabled", "warn");
        }, 1500);
      }

      if (ultraClickEnabledRef.current) {
        setUltraClicksTotal((prev) => prev - 1);
        setUltraClickEnabled(false);
        ultraClickEnabledRef.current = false;
        setTimeout(() => {
          showMessage("Ultra Click Disabled", "warn");
        }, 1500);
      }

      await fetchUserProfile();
    } catch (err) {
      console.error(err);
      showMessage("Error deleting Earth", "error");
    } finally {
      clickInProgressRef.current = false;
    }
  }

  return handleClick;
}
