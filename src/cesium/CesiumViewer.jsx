import { useEffect, useRef } from "react";
import { Viewer } from "resium";
import { fetchDeletedCells } from "./fetchUtils";

const CesiumViewer = ({ user }) => {
  const viewerRef = useRef();

  useEffect(() => {
    const viewer = viewerRef.current.cesiumElement;
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.clock.shouldAnimate = false;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(() => fetchDeletedCells(viewer), Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return () => handler.destroy();
  }, []);

  return <Viewer full ref={viewerRef} />;
};

export default function CesiumViewer(props) {
  return <div>...</div>;
}