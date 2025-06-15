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
    const primitive = new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance({
        translucent: false,
        closed: true,
      }),
    });
    primitive.isDeletedCell = true;
    primitiveBatch.add(primitive);
    viewer.scene.requestRender();
  }

  for (const [cacheKey, newCoords] of grouped.entries()) {
    const cached = (await loadTileFromDisk(cacheKey)) || [];
    const merged = [
      ...cached,
      ...newCoords.filter(
        (c) => !cached.some((e) => e.lat === c.lat && e.lon === c.lon)
      ),
    ];
    await saveTileToDisk(cacheKey, merged);
    fetchedBounds.add(cacheKey);
    if (viewer._fetchedBounds) viewer._fetchedBounds.add(cacheKey);
    console.log(`[drawDeletedCells] Cache updated for tile ${cacheKey} with ${merged.length} total cells`);
  }
};

export const drawDeletedCell = async (viewer, lat, lon) => {
  await drawDeletedCells(viewer, [{ lat, lon }]);
};

export async function fetchDeletedCells(viewer, bounds) {
  if (!viewer._fetchedBounds) viewer._fetchedBounds = new Set();

  if (bounds) {
    const boundsKey = `${bounds.minLat}:${bounds.maxLat}:${bounds.minLon}:${bounds.maxLon}`;
    viewer._fetchedBounds.add(boundsKey);
  }

  const buffer = 1.0;
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

      const cached = await loadTileFromDisk(cacheKey);
      if (cached && cached.length > 0) {
        console.log(`[fetchDeletedCells] Using cached tile ${cacheKey}`);
        await drawDeletedCells(viewer, cached);
        viewer._fetchedBounds.add(cacheKey);
        continue;
      }

      const visited = await isTileVisited(cacheKey);
      if (visited) {
        console.log(`[fetchDeletedCells] Tile ${cacheKey} previously marked empty`);
        viewer._fetchedBounds.add(cacheKey);
        continue;
      }

      fetchTasks.push(
        fetchSubBox(subMinLat, subMaxLat, subMinLon, subMaxLon, viewer, cacheKey)
      );
    }
  }

  await Promise.all(fetchTasks);
}

const fetchSubBox = async (minLat, maxLat, minLon, maxLon, viewer, cacheKey) => {
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

    console.log(`[fetchSubBox] Fetched ${cells.length} cells for tile ${cacheKey}`);
    await drawDeletedCells(viewer, cells);
    allCells.push(...cells);

    const last = cells[cells.length - 1];
    lastLat = last.lat;
    lastLon = last.lon;

    if (cells.length < batchSize) break;
  }

  if (allCells.length > 0) {
    await saveTileToDisk(cacheKey, allCells);
    console.log(`[fetchSubBox] Saved ${allCells.length} cells to disk for tile ${cacheKey}`);
  } else {
    await markTileAsVisited(cacheKey);
    console.log(`[fetchSubBox] Marked tile ${cacheKey} as visited with 0 cells`);
  }

  if (viewer._fetchedBounds) viewer._fetchedBounds.add(cacheKey);
};
