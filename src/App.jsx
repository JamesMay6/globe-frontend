import { useEffect } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import Cesium from 'cesium'; // ✅ This gives you the full UMD object

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
