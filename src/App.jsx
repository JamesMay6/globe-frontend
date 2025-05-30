import { useEffect } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

function App() {
  useEffect(() => {
    import('cesium').then((Cesium) => {
      // Cesium here is the global UMD Cesium object
      const viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain(),
        baseLayerPicker: false,
      });
    });
  }, []);

  return <div id="cesiumContainer" style={{ width: '100vw', height: '100vh' }} />;
}

export default App;
