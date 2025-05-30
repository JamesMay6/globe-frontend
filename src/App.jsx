import { useEffect } from "react";
import {
  Viewer,
  CesiumTerrainProvider,
  Ion,
  IonResource,
  Geocoder,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

function App() {
  useEffect(() => {
    Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

    const viewer = new Viewer("cesiumContainer", {
      terrainProvider: new CesiumTerrainProvider({
        url: IonResource.fromAssetId(1),
      }),
      baseLayerPicker: false,
      timeline: false,
      animation: false,
      fullscreenButton: false,
      vrButton: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      infoBox: false,
      selectionIndicator: false,
      geocoder: false, // we'll add it manually
    });

    // Add Geocoder widget manually to control its position and styling
    const geocoder = new Geocoder({
      container: document.getElementById("geocoderContainer"),
      viewer: viewer,
      scene: viewer.scene,
    });

    // Ensure globe is shown (disable any globe hiding)
    viewer.scene.globe.show = true;

    return () => {
      if (!viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  return (
    <>
      {/* Cesium Container */}
      <div id="cesiumContainer" style={{ width: "100vw", height: "100vh" }} />

      {/* Geocoder container positioned over Cesium container */}
      <div
        id="geocoderContainer"
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1,
          width: "300px",
          backgroundColor: "white",
          padding: "5px",
          borderRadius: "4px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        }}
      />
    </>
  );
}

export default App;
