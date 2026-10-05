const cache = new Map();
const inFlight = new Map();

export function cachedRequest(key, factory, ttlMs = 15000) {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now - cached.timestamp < ttlMs) {
    return Promise.resolve(cached.value);
  }

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = Promise.resolve()
    .then(factory)
    .then((value) => {
      cache.set(key, { value, timestamp: Date.now() });
      inFlight.delete(key);
      return value;
    })
    .catch((error) => {
      inFlight.delete(key);
      throw error;
    });

  inFlight.set(key, promise);
  return promise;
}

export function clearCachedRequest(key) {
  cache.delete(key);
  inFlight.delete(key);
}

export function clearAllCachedRequests() {
  cache.clear();
  inFlight.clear();
}
