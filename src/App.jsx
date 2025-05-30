import { useEffect } from 'react';
import { Viewer, CesiumTerrainProvider, Ion, IonResource } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

function App() {
  useEffect(() => {
    // Set your Cesium Ion access token here
    Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxYWY2NGY4YS1kY2UxLTQ5OTItODczNy1kYmFmM2VjZGVlM2MiLCJpZCI6MzAxODU3LCJpYXQiOjE3NDcwODMxNzR9.P0nAM3Q4S1yQvWEmKSgo1l2nmUvJd9_xrnLL1ZeM43Q";
    

    const viewer = new Viewer('cesiumContainer', {
      terrainProvider: new CesiumTerrainProvider({
        url: IonResource.fromAssetId(1), // World Terrain asset ID on Cesium Ion
      }),
      baseLayerPicker: false,
    });

    return () => {
      if (!viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  return <div id="cesiumContainer" style={{ width: '100vw', height: '100vh' }} />;
}

export default App;
