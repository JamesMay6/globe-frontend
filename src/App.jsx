import { useEffect } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

function App() {
  useEffect(() => {
    import('cesium').then((module) => {
      const Cesium = module.default; // ✅ FIX: grab from `.default`

      const viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain(),
        baseLayerPicker: false,
      });
    });
  }, []);

  return <div id="cesiumContainer" style={{ width: '100vw', height: '100vh' }} />;
}

export default App;
