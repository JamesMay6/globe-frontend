import * as Cesium from "cesium";
import { ZOOM_OUT_LEVEL } from "../config/config";

export function zoomOut(viewer) {
  if (viewer) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, ZOOM_OUT_LEVEL),
    });
  } else {
    console.warn("Viewer not ready yet");
  }
}