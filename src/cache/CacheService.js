/**
 * Cache Service Module - Stub for caching
 * Can be enhanced with actual caching logic
 */

class CacheService {
  async getCached(key, fetchFn) {
    // Skip cache, always fetch fresh data
    return await fetchFn();
  }

  async setCached(key, value, ttl) {
    // Stub - do nothing
    return true;
  }

  async invalidate(pattern) {
    // Stub - do nothing
    return true;
  }
}

module.exports = new CacheService();
