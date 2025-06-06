import { useCesium } from "../hooks/useCesium";

/**
 * This component renders the Cesium 3D globe using a <div> and manages the Cesium viewer via a custom hook.
 */
export default function CesiumCanvas({ onDeleteSuccess }) {
  useCesium({ onDeleteSuccess });

  return (
    <div
      id="cesiumContainer"
      style={{ width: "100vw", height: "100vh", position: "absolute", top: 0, left: 0 }}
    />
  );
}