const WALLPAPER_DB_NAME = 'calsnap-assets';
const WALLPAPER_STORE_NAME = 'wallpapers';
const WALLPAPER_DB_VERSION = 1;
export const WALLPAPER_ASSET_PREFIX = 'wallpaper-asset://';

const hasIndexedDb = () => typeof window !== 'undefined' && 'indexedDB' in window;

const openWallpaperDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = window.indexedDB.open(WALLPAPER_DB_NAME, WALLPAPER_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(WALLPAPER_STORE_NAME)) {
        database.createObjectStore(WALLPAPER_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open wallpaper database.'));
  });

const resolveAssetKey = (reference: string) =>
  reference.startsWith(WALLPAPER_ASSET_PREFIX)
    ? reference.slice(WALLPAPER_ASSET_PREFIX.length)
    : reference;

export const createWallpaperAssetReference = (userId: string | undefined) =>
  `${WALLPAPER_ASSET_PREFIX}${userId ?? 'guest'}`;

export const isWallpaperAssetReference = (value: string | undefined | null): value is string =>
  typeof value === 'string' && value.startsWith(WALLPAPER_ASSET_PREFIX);

export const saveWallpaperAsset = async (reference: string, dataUrl: string) => {
  const database = await openWallpaperDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(WALLPAPER_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(WALLPAPER_STORE_NAME);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save wallpaper asset.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Wallpaper asset save was aborted.'));

    store.put(dataUrl, resolveAssetKey(reference));
  });

  database.close();
};

export const loadWallpaperAsset = async (reference: string) => {
  const database = await openWallpaperDb();

  const result = await new Promise<string | null>((resolve, reject) => {
    const transaction = database.transaction(WALLPAPER_STORE_NAME, 'readonly');
    const store = transaction.objectStore(WALLPAPER_STORE_NAME);
    const request = store.get(resolveAssetKey(reference));

    request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
    request.onerror = () => reject(request.error ?? new Error('Could not load wallpaper asset.'));
  });

  database.close();
  return result;
};

export const deleteWallpaperAsset = async (reference: string) => {
  if (!hasIndexedDb()) {
    return;
  }

  const database = await openWallpaperDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(WALLPAPER_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(WALLPAPER_STORE_NAME);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete wallpaper asset.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Wallpaper asset delete was aborted.'));

    store.delete(resolveAssetKey(reference));
  });

  database.close();
};
