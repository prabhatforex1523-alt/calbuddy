type CacheStorageType = "local" | "session";

type CacheEnvelope<T> = {
  value: T;
  savedAt: number;
};

const getStorage = (type: CacheStorageType) =>
  type === "session" ? window.sessionStorage : window.localStorage;

export const getCachedValue = <T>(
  key: string,
  maxAgeMs?: number,
  storageType: CacheStorageType = "local"
): T | null => {
  try {
    const raw = getStorage(storageType).getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;

    if (
      maxAgeMs &&
      parsed.savedAt &&
      Date.now() - parsed.savedAt > maxAgeMs
    ) {
      getStorage(storageType).removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
};

export const setCachedValue = <T>(
  key: string,
  value: T,
  storageType: CacheStorageType = "local"
) => {
  try {
    getStorage(storageType).setItem(
      key,
      JSON.stringify({
        value,
        savedAt: Date.now(),
      } satisfies CacheEnvelope<T>)
    );
  } catch (error) {
    console.error("Failed to cache value", error);
  }
};

export const removeCachedValue = (
  key: string,
  storageType: CacheStorageType = "local"
) => {
  try {
    getStorage(storageType).removeItem(key);
  } catch (error) {
    console.error("Failed to remove cached value", error);
  }
};
