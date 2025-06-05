const API_URL = import.meta.env.VITE_API_URL;

const fetchDeletedCells = async (viewer) => {
    const rect = viewer.camera.computeViewRectangle();
    if (!rect) return;

    const minLat = Cesium.Math.toDegrees(rect.south);
    const maxLat = Cesium.Math.toDegrees(rect.north);
    const minLon = Cesium.Math.toDegrees(rect.west);
    const maxLon = Cesium.Math.toDegrees(rect.east);

    const response = await fetch(
      `${API_URL}/deleted?minLat=${minLat}&maxLat=${maxLat}&minLon=${minLon}&maxLon=${maxLon}`
    );
    const cells = await response.json();
    cells.forEach(({ lat, lon }) => drawDeletedCell(viewer, lat, lon));
  };

  export default fetchDeletedCells;