import { useEffect } from "react";
import {
  Viewer,
  CesiumTerrainProvider,
  Ion,
  IonResource,
  UrlTemplateImageryProvider,
  Cartesian3,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

function App() {
  useEffect(() => {
    Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

    const viewer = new Viewer("cesiumContainer", {
      terrainProvider: new CesiumTerrainProvider({
        url: IonResource.fromAssetId(1),
      }),
      imageryProvider: new UrlTemplateImageryProvider({
        url: "https://assets.agi.com/stk-terrain/world/stk-terrain-4tiles/{z}/{x}/{y}.png",
        maximumLevel: 13,
      }),
      geocoder: true,
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
    });

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(-74.0, 40.7, 10000),
    });

    return () => {
      if (!viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  return <div id="cesiumContainer" style={{ width: "100vw", height: "100vh" }} />;
}

export default App;
