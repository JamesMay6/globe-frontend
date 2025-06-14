import { openDB } from 'idb';

const dbPromise = openDB('DeletedCellsDB', 1, {
  upgrade(db) {
    db.createObjectStore('tiles'); // key = tile cacheKey, value = cell array
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

export const clearTileCache = async () => {
  const db = await dbPromise;
  await db.clear('tiles');
};

export const clearTileFromDisk = async (cacheKey) => {
  const db = await dbPromise;
  await db.delete('tiles', cacheKey);
};