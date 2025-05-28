
import { Viewer, ScreenSpaceEventHandler, ScreenSpaceEventType, Color, Rectangle, Entity } from "cesium";

const BACKEND_URL = "https://globe-backend-r15v.onrender.com"; // <-- Your actual backend

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrainProvider: Cesium.createWorldTerrain(),
  baseLayerPicker: false,
});

const deletedCells = new Set();

function snapToGrid(value) {
  return Math.round(value * 1000) / 1000;
}

function getCellId(lat, lon) {
  return `${snapToGrid(lat)}_${snapToGrid(lon)}`;
}

function drawDeletedCell(lat, lon) {
  const size = 0.001;
  const rect = Cesium.Rectangle.fromDegrees(lon, lat, lon + size, lat + size);
  viewer.entities.add({
    rectangle: {
      coordinates: rect,
      material: Cesium.Color.BLACK.withAlpha(0.6),
    },
  });
}

const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction((click) => {
  const cartesian = viewer.scene.pickPosition(click.position);
  if (!cartesian) return;

  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);
  const lon = Cesium.Math.toDegrees(cartographic.longitude);
  const id = getCellId(lat, lon);

  if (!deletedCells.has(id)) {
    deletedCells.add(id);
    drawDeletedCell(snapToGrid(lat), snapToGrid(lon));
    
    fetch(`${BACKEND_URL}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: snapToGrid(lat), lon: snapToGrid(lon) }),
    });
    console.log("Deleted:", id);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

async function loadDeletedCellsInView() {
  const rectangle = viewer.camera.computeViewRectangle();
  if (!rectangle) return;

  const minLat = Cesium.Math.toDegrees(rectangle.south);
  const maxLat = Cesium.Math.toDegrees(rectangle.north);
  const minLon = Cesium.Math.toDegrees(rectangle.west);
  const maxLon = Cesium.Math.toDegrees(rectangle.east);

  const url = (`${BACKEND_URL}/deleted?minLat=${minLat}&maxLat=${maxLat}&minLon=${minLon}&maxLon=${maxLon}`);
  const response = await fetch(url);
  const cells = await response.json();

  cells.forEach(({ lat, lon }) => {
    const id = getCellId(lat, lon);
    if (!deletedCells.has(id)) {
      deletedCells.add(id);
      drawDeletedCell(lat, lon);
    }
  });
}

viewer.camera.moveEnd.addEventListener(loadDeletedCellsInView);
