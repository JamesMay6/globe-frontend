import * as Cesium from "cesium";
import { API_URL } from '../config/config';
import { saveTileToDisk, loadTileFromDisk } from '../utils/deletedCellCache.js';

// === CONFIGURABLE CELL SIZE ===
// You can change these to tune precision/granularity:
const CELL_WIDTH_LAT = 0.01;  // e.g., 0.01 degrees latitude per cell
const CELL_WIDTH_LON = 0.01;  // e.g., 0.01 degrees longitude per cell

// Size of each fetch tile (larger than cell width, for batching):
const FETCH_TILE_SIZE_LAT = 0.12; // degrees
const FETCH_TILE_SIZE_LON = 0.12; // degrees

const fetchedBounds = new Set();
const drawnCells = new Set();

// Round coordinate down to nearest cell boundary for latitude:
const roundLat = (val) => Math.floor(val / CELL_WIDTH_LAT) * CELL_WIDTH_LAT;

// Round coordinate down to nearest cell boundary for longitude:
const roundLon = (val) => Math.floor(val / CELL_WIDTH_LON) * CELL_WIDTH_LON;

// Round for cache keys to multiples of FETCH_TILE_SIZE
const roundFetchLat = (val) => Math.floor(val / FETCH_TILE_SIZE_LAT) * FETCH_TILE_SIZE_LAT;
const roundFetchLon = (val) => Math.floor(val / FETCH_TILE_SIZE_LON) * FETCH_TILE_SIZE_LON;

export const normalizeCoord = (val, isLat = true) => isLat ? roundLat(val) : roundLon(val);

export const drawDeletedCell = (viewer, lat, lon) => {
  const latRounded = roundLat(lat);
  const lonRounded = roundLon(lon);
  const key = `${latRounded}:${lonRounded}`;
  if (drawnCells.has(key)) return;
  drawnCells.add(key);

  const paddingLat = CELL_WIDTH_LAT * 0.01; // 1% padding
  const paddingLon = CELL_WIDTH_LON * 0.01;

  const rectangle = Cesium.Rectangle.fromDegrees(
    lonRounded - paddingLon,
    latRounded - paddingLat,
    lonRounded + CELL_WIDTH_LON + paddingLon,
    latRounded + CELL_WIDTH_LAT + paddingLat
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

export const drawDeletedCells = (viewer, cells) => {
  const instances = [];

  for (const { lat, lon } of cells) {
    const latRounded = roundLat(lat);
    const lonRounded = roundLon(lon);
    const key = `${latRounded}:${lonRounded}`;
    if (drawnCells.has(key)) continue;
    drawnCells.add(key);

    const paddingLat = CELL_WIDTH_LAT * 0.01;
    const paddingLon = CELL_WIDTH_LON * 0.01;

    const rectangle = Cesium.Rectangle.fromDegrees(
      lonRounded - paddingLon,
      latRounded - paddingLat,
      lonRounded + CELL_WIDTH_LON + paddingLon,
      latRounded + CELL_WIDTH_LAT + paddingLat
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

// Cache key uses fetch tile boundaries rounded to multiples of fetch tile size
const getCacheKey = (minLat, maxLat, minLon, maxLon) => {
  return `${roundFetchLat(minLat)}:${roundFetchLat(maxLat)}:${roundFetchLon(minLon)}:${roundFetchLon(maxLon)}`;
};

export const fetchDeletedCells = async (viewer) => {
  const rect = viewer.camera.computeViewRectangle();
  if (!rect) return;

  const minLat = Cesium.Math.toDegrees(rect.south);
  const maxLat = Cesium.Math.toDegrees(rect.north);
  const minLon = Cesium.Math.toDegrees(rect.west);
  const maxLon = Cesium.Math.toDegrees(rect.east);

  // Calculate how many fetch tiles fit in the viewport:
  const latDivisions = Math.ceil((maxLat - minLat) / FETCH_TILE_SIZE_LAT);
  const lonDivisions = Math.ceil((maxLon - minLon) / FETCH_TILE_SIZE_LON);

  const fetchTasks = [];

  for (let i = 0; i < latDivisions; i++) {
    for (let j = 0; j < lonDivisions; j++) {
      const subMinLat = minLat + i * FETCH_TILE_SIZE_LAT;
      const subMaxLat = Math.min(maxLat, subMinLat + FETCH_TILE_SIZE_LAT);
      const subMinLon = minLon + j * FETCH_TILE_SIZE_LON;
      const subMaxLon = Math.min(maxLon, subMinLon + FETCH_TILE_SIZE_LON);

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
