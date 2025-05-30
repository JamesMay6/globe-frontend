import { useEffect } from 'react';
import { Viewer, createWorldTerrain } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

function App() {
  useEffect(() => {
    const viewer = new Viewer('cesiumContainer', {
      terrainProvider: createWorldTerrain(),
      baseLayerPicker: false,
    });

    return () => {
      if (!viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  return <div id="cesiumContainer" style={{ width: '100vw', height: '100vh' }} />;
}

export default App;
