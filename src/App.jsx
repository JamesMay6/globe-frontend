import { useEffect } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// ✅ Force use of the UMD bundle
import Cesium from 'cesium/Build/Cesium/Cesium.js';

function App() {
  useEffect(() => {
    const viewer = new Cesium.Viewer('cesiumContainer', {
      terrainProvider: Cesium.createWorldTerrain(),
      baseLayerPicker: false,
    });
  }, []);

  return <div id="cesiumContainer" style={{ width: '100vw', height: '100vh' }} />;
}

export default App;
