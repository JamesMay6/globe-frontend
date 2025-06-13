import * as Cesium from "cesium";
import {API_URL} from '../config/config';
import { saveTileToDisk, loadTileFromDisk } from '../utils/deletedCellCache.js';

const precision = 1000 //1000 = 3dp
const cellWidth = 0.001; //0.001 = 3dp
const padding = 0.0001;
const dpPrecision = 3
 
export const normalizeCoord = (val) => Math.floor(val * precision) / precision;
const fetchedBounds = new Set();

export const drawDeletedCell = (viewer, lat, lon) => {
  const key = `${lat}:${lon}`;
  if (drawnCells.has(key)) return;
  drawnCells.add(key);

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

/*primtives*/
let primitiveBatch = null;

export const initPrimitiveBatch = (viewer) => {
  primitiveBatch = new Cesium.PrimitiveCollection();
  viewer.scene.primitives.add(primitiveBatch);
};

export const drawDeletedCells = (viewer, cells) => {
  if (!primitiveBatch) initPrimitiveBatch(viewer);

  const instances = [];

  for (const { lat, lon } of cells) {
    const key = `${lat}:${lon}`;
    if (drawnCells.has(key)) continue;
    drawnCells.add(key);

    const rectangle = Cesium.Rectangle.fromDegrees(
      lon - padding,
      lat - padding,
      lon + cellWidth + padding,
      lat + cellWidth + padding
    );

    instances.push(new Cesium.GeometryInstance({
      geometry: new Cesium.RectangleGeometry({
        rectangle,
        height: 0, // aligned to ellipsoid
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.BLACK.withAlpha(1.0)
        ),
      },
    }));
  }

  if (instances.length > 0) {
    primitiveBatch.add(new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance({
        translucent: false,
        closed: true
      }),
    }));

    viewer.scene.requestRender();
  }
};


const getCacheKey = (minLat, maxLat, minLon, maxLon) => {
  const round = (x) => Math.floor(x * precision) / precision; 
  return `${round(minLat)}:${round(maxLat)}:${round(minLon)}:${round(maxLon)}`;
};

/* PARALLEL FETCH */
export async function fetchDeletedCells(viewer, bounds) {
    // After successfully fetching new bounds:
  if (bounds) {
    if (!viewer._fetchedBounds) viewer._fetchedBounds = [];
    viewer._fetchedBounds.push(bounds);
  }
  
  const buffer = 1.0; // in degrees; you can make this dynamic if desired

  const rect = viewer.camera.computeViewRectangle();
  if (!rect) return;

  const minLat = Cesium.Math.toDegrees(rect.south) - buffer;
  const maxLat = Cesium.Math.toDegrees(rect.north) + buffer;
  const minLon = Cesium.Math.toDegrees(rect.west) - buffer;
  const maxLon = Cesium.Math.toDegrees(rect.east) + buffer;

  const latDivisions = 6;
  const lonDivisions = 6;
  const latStep = (maxLat - minLat) / latDivisions;
  const lonStep = (maxLon - minLon) / lonDivisions;

  const fetchTasks = [];

  const round = (val) => parseFloat(val.toFixed(dpPrecision));

  for (let i = 0; i < latDivisions; i++) {
    for (let j = 0; j < lonDivisions; j++) {
      const subMinLat = round(minLat + i * latStep);
      const subMaxLat = round(subMinLat + latStep);
      const subMinLon = round(minLon + j * lonStep);
      const subMaxLon = round(subMinLon + lonStep);

      const cacheKey = getCacheKey(subMinLat, subMaxLat, subMinLon, subMaxLon);
      if (fetchedBounds.has(cacheKey)) continue;
      fetchedBounds.add(cacheKey);

      fetchTasks.push(fetchSubBox(subMinLat, subMaxLat, subMinLon, subMaxLon, viewer));
    }
  }

  await Promise.all(fetchTasks);
};

const fetchSubBox = async (minLat, maxLat, minLon, maxLon, viewer) => {
  const cacheKey = getCacheKey(minLat, maxLat, minLon, maxLon);

  const cached = await loadTileFromDisk(cacheKey);
  if (cached) {
    drawDeletedCells(viewer, cached);
    console.log("Loaded from disk:", cacheKey);
    return;
  }

  const batchSize = 1000;
  let lastLat = null;
  let lastLon = null;
  let allCells = [];

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
    allCells.push(...cells);

    const last = cells[cells.length - 1];
    lastLat = last.lat;
    lastLon = last.lon;

    if (cells.length < batchSize) break;
  }

  await saveTileToDisk(cacheKey, allCells);
  console.log(`Fetched from Supabase and cached: ${cacheKey}`);
};



/**
 * Prune drawn deleted cells (primitives or entities) outside the current camera view + buffer.
 * @param {Cesium.Viewer} viewer
 * @param {number} bufferDegrees - degrees of buffer around view rectangle
 */
export function pruneDrawnCellsOutsideView(viewer, bufferDegrees = 1) {
  if (!viewer || !viewer.scene || !viewer.camera) return;

  const scene = viewer.scene;
  const camera = viewer.camera;

  // Compute current view rectangle in radians
  const rect = camera.computeViewRectangle(scene.globe.ellipsoid);
  if (!rect) return;

  // Convert to degrees and add buffer
  let west = Cesium.Math.toDegrees(rect.west) - bufferDegrees;
  let south = Cesium.Math.toDegrees(rect.south) - bufferDegrees;
  let east = Cesium.Math.toDegrees(rect.east) + bufferDegrees;
  let north = Cesium.Math.toDegrees(rect.north) + bufferDegrees;

  // Clamp
  west = Math.max(-180, west);
  south = Math.max(-90, south);
  east = Math.min(180, east);
  north = Math.min(90, north);

  // Helper to check if a cell is inside viewport+buffer
  function inView(lat, lon) {
    return lat >= south && lat <= north && lon >= west && lon <= east;
  }

  // Assume your deleted cells are stored in viewer.entities with a property like `isDeletedCell`
  // Or if you store in primitives, adjust accordingly.

  // Prune viewer.entities:
  viewer.entities.values.forEach((entity) => {
    if (!entity.isDeletedCell) return;

    // Assuming each cell entity has a property 'cellLat' and 'cellLon'
    const cellLat = entity.cellLat;
    const cellLon = entity.cellLon;

    if (!inView(cellLat, cellLon)) {
      viewer.entities.remove(entity);
    }
  });

  // If you store deleted cells as primitives (rectangle primitives), prune those too:
  const primitivesToRemove = [];
  scene.primitives._primitives.forEach((prim) => {
    if (prim.isDeletedCell) {
      // Extract rectangle coords in degrees from primitive.rectangle
      // rectangle is Cesium.Rectangle in radians
      const rect = prim.rectangle;
      const primWest = Cesium.Math.toDegrees(rect.west);
      const primSouth = Cesium.Math.toDegrees(rect.south);
      const primEast = Cesium.Math.toDegrees(rect.east);
      const primNorth = Cesium.Math.toDegrees(rect.north);

      // Check if rectangle intersects the viewport + buffer
      const intersects =
        !(primEast < west || primWest > east || primNorth < south || primSouth > north);

      if (!intersects) {
        primitivesToRemove.push(prim);
      }
    }
  });

  primitivesToRemove.forEach((prim) => {
    scene.primitives.remove(prim);
  });
}

/**
 * Prune your fetched bounds cache, removing any bounds completely outside viewport + buffer.
 * 
 * @param {Cesium.Viewer} viewer
 * @param {number} bufferDegrees
 */
export function pruneFetchedBounds(viewer, bufferDegrees = 1) {
  if (!viewer) return;
  if (!viewer._fetchedBounds) return; // you need to set this somewhere

  const camera = viewer.camera;
  const scene = viewer.scene;

  const rect = camera.computeViewRectangle(scene.globe.ellipsoid);
  if (!rect) return;

  let west = Cesium.Math.toDegrees(rect.west) - bufferDegrees;
  let south = Cesium.Math.toDegrees(rect.south) - bufferDegrees;
  let east = Cesium.Math.toDegrees(rect.east) + bufferDegrees;
  let north = Cesium.Math.toDegrees(rect.north) + bufferDegrees;

  west = Math.max(-180, west);
  south = Math.max(-90, south);
  east = Math.min(180, east);
  north = Math.min(90, north);

  // Remove fetched bounds that do not intersect current view rectangle + buffer
  viewer._fetchedBounds = viewer._fetchedBounds.filter(bounds => {
    // bounds: {west, south, east, north}
    const noOverlap =
      bounds.east < west ||
      bounds.west > east ||
      bounds.north < south ||
      bounds.south > north;

    return !noOverlap;
  });
}

