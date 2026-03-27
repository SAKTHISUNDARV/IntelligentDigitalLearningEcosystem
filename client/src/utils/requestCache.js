const cache = new Map();

export function getCachedValue(key, maxAge = Infinity) {
  const entry = cache.get(key);
  if (!entry) return null;

  return {
    ...entry,
    isFresh: Date.now() - entry.updatedAt <= maxAge,
  };
}

export function setCachedValue(key, data) {
  const entry = {
    data,
    updatedAt: Date.now(),
  };

  cache.set(key, entry);
  return entry;
}

export function invalidateCache(match) {
  if (typeof match === 'function') {
    for (const key of cache.keys()) {
      if (match(key)) cache.delete(key);
    }
    return;
  }

  cache.delete(match);
}

export function clearCache() {
  cache.clear();
}
