import * as Cesium from "cesium";
import { API_URL } from "../config/config";
import {
  saveTileToDisk,
  loadTileFromDisk,
  markTileAsVisited,
  isTileVisited,
} from "../utils/deletedCellCache.js";

const precision = 1000;
const cellWidth = 0.001;
const padding = 0.0001;
const dpPrecision = 3;

export const normalizeCoord = (val) => Math.floor(val * precision) / precision;
export const fetchedBounds = new Set();

const drawnCells = new Set();
let primitiveBatch = null;

export const initPrimitiveBatch = (viewer) => {
  primitiveBatch = new Cesium.PrimitiveCollection();
  viewer.scene.primitives.add(primitiveBatch);
};

export const getCacheKey = (lat, lon) => {
  const tilePrecision = 0.25;
  const snap = (x) => Math.floor(x / tilePrecision) * tilePrecision;
  return `${snap(lat)}:${snap(lon)}`;
};

export function getCameraViewRectangle(viewer, buffer = 1.0) {
  const rectangle = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid);

  if (!rectangle) return null;

  const minLat = Cesium.Math.toDegrees(rectangle.south) - buffer;
  const maxLat = Cesium.Math.toDegrees(rectangle.north) + buffer;
  const minLon = Cesium.Math.toDegrees(rectangle.west) - buffer;
  const maxLon = Cesium.Math.toDegrees(rectangle.east) + buffer;

  return { minLat, maxLat, minLon, maxLon };
}

export const drawDeletedCells = async (viewer, cells) => {
  if (!primitiveBatch) initPrimitiveBatch(viewer);

  const instances = [];
  const grouped = new Map();

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

    instances.push(
      new Cesium.GeometryInstance({
        geometry: new Cesium.RectangleGeometry({
          rectangle,
          height: 0,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.BLACK.withAlpha(1.0)
          ),
        },
      })
    );

    const cacheKey = getCacheKey(lat, lon);
    if (!grouped.has(cacheKey)) grouped.set(cacheKey, []);
    grouped.get(cacheKey).push({ lat, lon });
  }

  if (instances.length > 0) {
    console.log("[drawDeletedCells] Drawing", instances.length, "new cells");

    // Calculate bounding rectangle for all cells in this batch for pruning
    const lats = cells.map((c) => c.lat);
    const lons = cells.map((c) => c.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats) + cellWidth;
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons) + cellWidth;

    const boundingRectangle = Cesium.Rectangle.fromDegrees(
      minLon,
      minLat,
      maxLon,
      maxLat
    );

    const primitive = new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance({
        translucent: false,
        closed: true,
      }),
    });

    primitive.isDeletedCell = true;
    primitive.rectangle = boundingRectangle;

    primitiveBatch.add(primitive);
    viewer.scene.requestRender();
  }

};

export const drawDeletedCell = async (viewer, lat, lon) => {
  await drawDeletedCells(viewer, [{ lat, lon }]);
};

export async function fetchDeletedCells(viewer) {
  const scene = viewer.scene;
  const camera = viewer.camera;
  if (!viewer._fetchedBounds) viewer._fetchedBounds = new Set();

  const buffer = 1.0;
  const rect = getCameraViewRectangle(viewer, buffer);
  if (!rect) return;

  const { minLat, maxLat, minLon, maxLon } = rect;
  const latDivisions = 6;
  const lonDivisions = 6;
  const latStep = (maxLat - minLat) / latDivisions;
  const lonStep = (maxLon - minLon) / lonDivisions;

  const round = (val) => parseFloat(val.toFixed(dpPrecision));
  const fetchTasks = [];

  for (let i = 0; i < latDivisions; i++) {
    for (let j = 0; j < lonDivisions; j++) {
      const subMinLat = round(minLat + i * latStep);
      const subMaxLat = round(subMinLat + latStep);
      const subMinLon = round(minLon + j * lonStep);
      const subMaxLon = round(subMinLon + lonStep);

      const tileLat = (subMinLat + subMaxLat) / 2;
      const tileLon = (subMinLon + subMaxLon) / 2;
      const cacheKey = getCacheKey(tileLat, tileLon);

      if (viewer._fetchedBounds.has(cacheKey)) continue;

      // Here, check disk cache & visited flag BEFORE deciding to fetch:
      const [cached, visited] = await Promise.all([
        loadTileFromDisk(cacheKey),
        isTileVisited(cacheKey),
      ]);

      if (cached && cached.length > 0) {
        console.log(`[fetchDeletedCells] Using cached tile ${cacheKey}`);
        await drawDeletedCells(viewer, cached);
        viewer._fetchedBounds.add(cacheKey);
        continue;
      }

      if (visited) {
        console.log(`[fetchDeletedCells] Tile ${cacheKey} previously marked empty`);
        viewer._fetchedBounds.add(cacheKey);
        continue;
      }

      // If not cached or visited, fetch from server
      fetchTasks.push(fetchSubBox(subMinLat, subMaxLat, subMinLon, subMaxLon, viewer, cacheKey));
    }
  }

  await Promise.all(fetchTasks);
}

const fetchSubBox = async (minLat, maxLat, minLon, maxLon, viewer, cacheKey) => {
  const batchSize = 5000;
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

    console.log(`[fetchSubBox] Fetched ${cells.length} cells for tile ${cacheKey}`);
    await drawDeletedCells(viewer, cells);
    allCells.push(...cells);

    const last = cells[cells.length - 1];
    lastLat = last.lat;
    lastLon = last.lon;

    if (cells.length < batchSize) {
      await markTileAsVisited(cacheKey);
      break;
    }
  }

  if (allCells.length > 0) {
    await saveTileToDisk(cacheKey, allCells);
    console.log(`[fetchSubBox] Saved ${allCells.length} cells to disk for tile ${cacheKey}`);
  } else {
    await markTileAsVisited(cacheKey);
    console.log(`[fetchSubBox] Marked tile ${cacheKey} as visited with no cells`);
  }

  if (viewer._fetchedBounds) viewer._fetchedBounds.add(cacheKey);
};

export function pruneDrawnCellsOutsideView(viewer, bufferDegrees = 1) {
  if (!viewer || !viewer.scene || !viewer.camera) return;
  if (!primitiveBatch) return;

  const scene = viewer.scene;
  const camera = viewer.camera;
  const buffer = 1.0;
  const rect = getCameraViewRectangle(viewer, buffer);
  if (!rect) return;

  let west = Cesium.Math.toDegrees(rect.west) - bufferDegrees;
  let south = Cesium.Math.toDegrees(rect.south) - bufferDegrees;
  let east = Cesium.Math.toDegrees(rect.east) + bufferDegrees;
  let north = Cesium.Math.toDegrees(rect.north) + bufferDegrees;

  west = Math.max(-180, west);
  south = Math.max(-90, south);
  east = Math.min(180, east);
  north = Math.min(90, north);

  const primitivesToRemove = [];

  primitiveBatch._primitives.forEach((prim) => {
    if (prim.isDeletedCell && prim.rectangle) {
      const rect = prim.rectangle;
      const primWest = Cesium.Math.toDegrees(rect.west);
      const primSouth = Cesium.Math.toDegrees(rect.south);
      const primEast = Cesium.Math.toDegrees(rect.east);
      const primNorth = Cesium.Math.toDegrees(rect.north);

      const intersects =
        !(primEast < west || primWest > east || primNorth < south || primSouth > north);

      if (!intersects) {
        primitivesToRemove.push(prim);
      }
    }
  });

  primitivesToRemove.forEach((prim) => {
    primitiveBatch.remove(prim);
  });
}

export function pruneFetchedBounds(viewer, bufferDegrees = 1) {
  if (!viewer || !viewer._fetchedBounds) return;

  const buffer = 1.0;
  const rect = getCameraViewRectangle(viewer, buffer);
  if (!rect) return;

  let west = Cesium.Math.toDegrees(rect.west) - bufferDegrees;
  let south = Cesium.Math.toDegrees(rect.south) - bufferDegrees;
  let east = Cesium.Math.toDegrees(rect.east) + bufferDegrees;
  let north = Cesium.Math.toDegrees(rect.north) + bufferDegrees;

  // Convert Set to Array, filter, then convert back to Set
  const filteredBounds = Array.from(viewer._fetchedBounds).filter((b) => {
    const parts = b.split(":").map(parseFloat);
    // Keep entries that are not bounding boxes (like cache keys "lat:lon")
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    const [minLat, maxLat, minLon, maxLon] = parts;

    const noOverlap =
      maxLon < west ||
      minLon > east ||
      maxLat < south ||
      minLat > north;

    return !noOverlap;
  });

  viewer._fetchedBounds = new Set(filteredBounds);
}

export const resetDrawnCells = () => {
  drawnCells.clear();
};
