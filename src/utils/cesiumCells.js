import * as Cesium from "cesium";
import { API_URL } from "../config/config";
import { saveTileToDisk, loadTileFromDisk } from "../utils/deletedCellCache.js";

const precision = 1000;
const cellWidth = 0.001;
const padding = 0.0001;
const dpPrecision = 3;

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

  const primitive = new Cesium.GroundPrimitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance(),
    classificationType: Cesium.ClassificationType.BOTH,
  });
  primitive.isDeletedCell = true;

  viewer.scene.primitives.add(primitive);
  viewer.scene.requestRender();
};

const drawnCells = new Set();

/* Primitive batch */
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
  }

  if (instances.length > 0) {
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
};

/* Coarse tile cache key */
const tilePrecision = 0.25;
const getCacheKey = (lat, lon) => {
  const snap = (x) => Math.floor(x / tilePrecision) * tilePrecision;
  return `${snap(lat)}:${snap(lon)}`;
};

/* Main tile fetch */
export async function fetchDeletedCells(viewer, bounds) {
  if (bounds) {
    if (!viewer._fetchedBounds) viewer._fetchedBounds = [];
    viewer._fetchedBounds.push(bounds);
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
    const tileSize = tilePrecision; // 0.25

    const startLat = Math.floor(minLat / tileSize) * tileSize;
    const endLat   = Math.ceil(maxLat / tileSize) * tileSize;
    const startLon = Math.floor(minLon / tileSize) * tileSize;
    const endLon   = Math.ceil(maxLon / tileSize) * tileSize;

    for (let lat = startLat; lat < endLat; lat += tileSize) {
      for (let lon = startLon; lon < endLon; lon += tileSize) {
    const cacheKey = getCacheKey(lat + tileSize / 2, lon + tileSize / 2);

      if (fetchedBounds.has(cacheKey)) continue;

      const cached = await loadTileFromDisk(cacheKey);
      if (cached && cached.length > 0) {
        drawDeletedCells(viewer, cached);
        fetchedBounds.add(cacheKey);
        console.log("Loaded from disk:", cacheKey);
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
  const cached = await loadTileFromDisk(cacheKey);
  if (cached && cached.length > 0) {
    drawDeletedCells(viewer, cached);
    console.log("Loaded from disk:", cacheKey);
    fetchedBounds.add(cacheKey);
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

  if (allCells.length > 0) {
    await saveTileToDisk(cacheKey, allCells);
    console.log(`Fetched and cached: ${cacheKey}`);
    fetchedBounds.add(cacheKey);
  } else {
    console.log(`Fetched empty tile: ${cacheKey}`);
  }
};

/* Prune drawn cells outside view */
export function pruneDrawnCellsOutsideView(viewer, bufferDegrees = 1) {
  if (!viewer || !viewer.scene || !viewer.camera) return;

  const scene = viewer.scene;
  const camera = viewer.camera;
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

  const primitivesToRemove = [];
  scene.primitives._primitives.forEach((prim) => {
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
    scene.primitives.remove(prim);
  });
}

/* Prune old fetched bounds */
export function pruneFetchedBounds(viewer, bufferDegrees = 1) {
  if (!viewer || !viewer._fetchedBounds) return;

  const rect = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid);
  if (!rect) return;

  let west = Cesium.Math.toDegrees(rect.west) - bufferDegrees;
  let south = Cesium.Math.toDegrees(rect.south) - bufferDegrees;
  let east = Cesium.Math.toDegrees(rect.east) + bufferDegrees;
  let north = Cesium.Math.toDegrees(rect.north) + bufferDegrees;

  viewer._fetchedBounds = viewer._fetchedBounds.filter((b) => {
    const noOverlap =
      b.maxLon < west ||
      b.minLon > east ||
      b.maxLat < south ||
      b.minLat > north;
    return !noOverlap;
  });
}
