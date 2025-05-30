import { useEffect } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Viewer } from 'cesium';
import createWorldTerrain from 'cesium/Source/Core/createWorldTerrain';

function App() {
  useEffect(() => {
    const viewer = new Viewer('cesiumContainer', {
      terrainProvider: createWorldTerrain(),
      baseLayerPicker: false,
    });
  }, []);

  return <div id="cesiumContainer" style={{ width: '100vw', height: '100vh' }} />;
}

export default App;
