import * as Cesium from "cesium";
import {API_URL} from '../config/config';

export const normalizeCoord = (val) => Math.floor(val * 1000) / 1000;
const fetchedBounds = new Set();

export const drawDeletedCell = (viewer, lat, lon) => {
  const key = `${lat}:${lon}`;
  if (drawnCells.has(key)) return;
  drawnCells.add(key);

  const cellWidth = 0.001;
  const padding = 0.00008;
  const rectangle = Cesium.Rectangle.fromDegrees(
    lon - padding,
    lat - padding,
    lon + cellWidth + padding,
    lat + cellWidth + padding
  );

  const instance = new Cesium.GeometryInstance({
    geometry: new Cesium.RectangleGeometry({
      rectangle,
      vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.BLACK.withAlpha(1.0)
      ),
    },
  });

  viewer.scene.primitives.add(
    new Cesium.GroundPrimitive({
      geometryInstances: instance,
      appearance: new Cesium.PerInstanceColorAppearance(),
      classificationType: Cesium.ClassificationType.BOTH,
    })
  );

  viewer.scene.requestRender();
};

const drawnCells = new Set();

/* GROUND PRIMITIVE ONLY */
export const drawDeletedCells = (viewer, cells) => {
  const instances = [];

  for (const { lat, lon } of cells) {
    const key = `${lat}:${lon}`;
    if (drawnCells.has(key)) continue;
    drawnCells.add(key);

    const cellWidth = 0.001;
    const padding = 0.00008;
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

const getCacheKey = (minLat, maxLat, minLon, maxLon) => {
  const round = (x) => Math.floor(x * 100) / 100; // 3 decimal places
  return `${round(minLat)}:${round(maxLat)}:${round(minLon)}:${round(maxLon)}`;
};



/* SEQUENTIAL FETCH
export const fetchDeletedCells = async (viewer) => {
  const rect = viewer.camera.computeViewRectangle();
  if (!rect) return;

  const minLat = Cesium.Math.toDegrees(rect.south);
  const maxLat = Cesium.Math.toDegrees(rect.north);
  const minLon = Cesium.Math.toDegrees(rect.west);
  const maxLon = Cesium.Math.toDegrees(rect.east);

  const cacheKey = getCacheKey(minLat, maxLat, minLon, maxLon);
  if (fetchedBounds.has(cacheKey)) {
    console.log("Skipping fetch — already cached:", cacheKey);
    return;
  }

  fetchedBounds.add(cacheKey);

  const batchSize = 1000;
  let lastLat = null;
  let lastLon = null;
  let totalFetched = 0;

  while (true) {
    const url = new URL(`${API_URL}/deleted`);
    url.searchParams.append("minLat", minLat);
    url.searchParams.append("maxLat", maxLat);
    url.searchParams.append("minLon", minLon);
    url.searchParams.append("maxLon", maxLon);
    url.searchParams.append("limit", batchSize);

    if (lastLat !== null && lastLon !== null) {
      url.searchParams.append("lastLat", lastLat);
      url.searchParams.append("lastLon", lastLon);
    }

    const res = await fetch(url);
    const cells = await res.json();

    if (!cells || cells.length === 0) break;

    drawDeletedCells(viewer, cells);
    totalFetched += cells.length;

    // Update lastLat and lastLon with the last item from this batch
    const lastCell = cells[cells.length - 1];
    lastLat = lastCell.lat;
    lastLon = lastCell.lon;

    // Optional: Break if fewer than batchSize returned, no more data
    if (cells.length < batchSize) break;
  }

  console.log(`Fetched and rendered ${totalFetched} cells for box ${cacheKey}`);

};
*/

/* PARALLEL FETCH */
export const fetchDeletedCells = async (viewer) => {
  const rect = viewer.camera.computeViewRectangle();
  if (!rect) return;

  const minLat = Cesium.Math.toDegrees(rect.south);
  const maxLat = Cesium.Math.toDegrees(rect.north);
  const minLon = Cesium.Math.toDegrees(rect.west);
  const maxLon = Cesium.Math.toDegrees(rect.east);

  const latDivisions = 6; // Increase for finer granularity
  const lonDivisions = 6;
  const latStep = (maxLat - minLat) / latDivisions;
  const lonStep = (maxLon - minLon) / lonDivisions;

  const fetchTasks = [];

  for (let i = 0; i < latDivisions; i++) {
    for (let j = 0; j < lonDivisions; j++) {
      const subMinLat = minLat + i * latStep;
      const subMaxLat = subMinLat + latStep;
      const subMinLon = minLon + j * lonStep;
      const subMaxLon = subMinLon + lonStep;

      const cacheKey = getCacheKey(subMinLat, subMaxLat, subMinLon, subMaxLon);
      if (fetchedBounds.has(cacheKey)) continue;
      fetchedBounds.add(cacheKey);

      const url = new URL(`${API_URL}/deleted`);
      url.searchParams.set("minLat", subMinLat);
      url.searchParams.set("maxLat", subMaxLat);
      url.searchParams.set("minLon", subMinLon);
      url.searchParams.set("maxLon", subMaxLon);
      url.searchParams.set("limit", 1000);

      fetchTasks.push(
        fetch(url)
          .then((res) => res.json())
          .then((cells) => ({ cacheKey, cells }))
      );
    }
  }

  const results = await Promise.all(fetchTasks);

  let total = 0;
  for (const { cacheKey, cells } of results) {
    if (!cells || cells.length === 0) continue;
    drawDeletedCells(viewer, cells);
    total += cells.length;
  }

  console.log(`Parallel fetched ${total} cells.`);
};


