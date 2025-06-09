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

let primitiveLayer;

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
    if (primitiveLayer) {
      viewer.scene.primitives.remove(primitiveLayer);
    }
    primitiveLayer = new Cesium.GroundPrimitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance(),
      classificationType: Cesium.ClassificationType.BOTH,
    });
    viewer.scene.primitives.add(primitiveLayer);
  }
};

export const fetchDeletedCells = async (viewer) => {
  const rect = viewer.camera.computeViewRectangle();
  if (!rect) return;
  const minLat = Cesium.Math.toDegrees(rect.south);
  const maxLat = Cesium.Math.toDegrees(rect.north);
  const minLon = Cesium.Math.toDegrees(rect.west);
  const maxLon = Cesium.Math.toDegrees(rect.east);

  const res = await fetch(`${API_URL}/deleted?minLat=${minLat}&maxLat=${maxLat}&minLon=${minLon}&maxLon=${maxLon}`);
  const cells = await res.json();
  drawDeletedCells(viewer, cells);
};
