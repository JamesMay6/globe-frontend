import { useEffect } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

function App() {
  useEffect(() => {
    Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

    const viewer = async () => {
          const terrainProvider = await Cesium.createWorldTerrainAsync();
          const viewer = new Cesium.Viewer(container, {
            terrainProvider,
            imageryProvider: new Cesium.OpenStreetMapImageryProvider({
              url: "https://a.tile.openstreetmap.org/",
            }),
            animation: false,
            timeline: false,
            homeButton: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            requestRenderMode: true,
            maximumRenderTimeChange: 0,
            contextOptions: { requestWebgl2: true },
          });
        };

    return () => {
      if (!viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  return <div id="cesiumContainer" style={{ width: "100vw", height: "100vh" }} />;
}

export default App;
