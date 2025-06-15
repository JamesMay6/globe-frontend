import { openDB } from 'idb';

const dbPromise = openDB('DeletedCellsDB', 1, {
  upgrade(db) {
    db.createObjectStore('tiles'); // key = tile cacheKey, value = cell array
    db.createObjectStore('visited'); // key = tile cacheKey, value = true (for visited empty tile)
  },
});

export const saveTileToDisk = async (cacheKey, cells) => {
  const db = await dbPromise;
  await db.put('tiles', cells, cacheKey);
};

export const loadTileFromDisk = async (cacheKey) => {
  const db = await dbPromise;
  return await db.get('tiles', cacheKey);
};

export const markTileAsVisited = async (cacheKey) => {
  const db = await dbPromise;
  await db.put('visited', true, cacheKey);
};

export const isTileVisited = async (cacheKey) => {
  const db = await dbPromise;
  return await db.get('visited', cacheKey);
};

export const clearTileCache = async () => {
  const db = await dbPromise;
  await db.clear('tiles');
  await db.clear('visited');
};

export const clearTileFromDisk = async (cacheKey) => {
  const db = await dbPromise;
  await db.delete('tiles', cacheKey);
  await db.delete('visited', cacheKey);
};
