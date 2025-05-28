import { useEffect } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

function App() {
  useEffect(() => {
    // Dynamically load Cesium since it is not a real ESM
    import('cesium/Build/Cesium/Cesium').then((Cesium) => {
      const viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain(),
        baseLayerPicker: false,
      });
    });
  }, []);

  return <div id="cesiumContainer" style={{ width: '100vw', height: '100vh' }} />;
}

export default App;
