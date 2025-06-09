import * as Cesium from "cesium";
import {API_URL} from '../config/config';

export const normalizeCoord = (val) => Math.floor(val * 1000) / 1000;

export const drawDeletedCell = (viewer, lat, lon) => {
  const cellWidth = 0.001;
  const padding = 0.00005;
  const rectangle = Cesium.Rectangle.fromDegrees(
    lon - padding,
    lat - padding,
    lon + cellWidth + padding,
    lat + cellWidth + padding
  );
  viewer.entities.add({
    rectangle: {
      coordinates: rectangle,
      material: Cesium.Color.BLACK.withAlpha(1.0),
      classificationType: Cesium.ClassificationType.BOTH,
    },
  });
  viewer.scene.requestRender();
};

const drawnCells = new Set();

export const drawDeletedCells = (viewer, cells) => {
  const instances = [];

  for (const { lat, lon } of cells) {
    const key = `${lat}:${lon}`;
    if (drawnCells.has(key)) continue;
    drawnCells.add(key);

    const cellWidth = 0.001;
    const padding = 0.00005;
    const rectangle = Cesium.Rectangle.fromDegrees(
      lon - padding,
      lat - padding,
      lon + cellWidth + padding,
      lat + cellWidth + padding
    );
    instances.push(
      new Cesium.GeometryInstance({
        geometry: new Cesium.RectangleGeometry({
          rectangle,
          vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.BLACK.withAlpha(1.0)
          ),
        },
      })
    );
  }

  if (instances.length > 0) {
    viewer.scene.primitives.add(
      new Cesium.GroundPrimitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance(),
        classificationType: Cesium.ClassificationType.BOTH,
      })
    );
  }
};

export const fetchDeletedCells = async (viewer) => {
  const rect = viewer.camera.computeViewRectangle();
  if (!rect) return;

  const height = viewer.camera.positionCartographic.height;
  if (height > 10000000) return; // skip fetching if too zoomed out

  const west = Cesium.Math.toDegrees(rect.west);
  const south = Cesium.Math.toDegrees(rect.south);
  const east = Cesium.Math.toDegrees(rect.east);
  const north = Cesium.Math.toDegrees(rect.north);

  const bbox = `${west},${south},${east},${north}`;

  // Map height to zoom level (example mapping, adjust as needed)
  let z;
  if (height > 10000000) z = 2;
  else if (height > 5000000) z = 3;
  else if (height > 2500000) z = 4;
  else if (height > 1250000) z = 5;
  else if (height > 600000) z = 6;
  else z = 7;

  try {
    const res = await fetch(`${API_URL}/deleted-cells?bbox=${bbox}&z=${z}`);
    if (!res.ok) {
      console.error("Failed to fetch deleted cells");
      return;
    }
    const cells = await res.json();
    if (!Array.isArray(cells)) return;

    // Clear existing entities
    viewer.deletedCellEntities = viewer.deletedCellEntities || [];
    viewer.deletedCellEntities.forEach(entity => {
      viewer.entities.remove(entity);
    });
    viewer.deletedCellEntities = [];

    // Draw new cells
    for (const { lat, lon } of cells) {
      const entity = drawDeletedCell(viewer, lat, lon);
      viewer.deletedCellEntities.push(entity);
    }

  } catch (err) {
    console.error("Error fetching deleted cells:", err);
  }
};
