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

  async warmup(repos) {
    // Stub - warm up cache with frequently accessed data
    // In production, this would pre-load data into Redis
    console.log('✓ Cache warmed up (stub mode - no actual caching)');
    return true;
  }

  // Heritage figures cache
  async getFigures(language, published) {
    return null; // Skip cache
  }

  async setFigures(language, published, data) {
    return true;
  }

  async invalidateFigures(language) {
    return true;
  }

  // News cache
  async getNews(language, published) {
    return null; // Skip cache
  }

  async setNews(language, published, data) {
    return true;
  }

  async invalidateNews(language) {
    return true;
  }

  // Wellness tips cache
  async getTips(language, published) {
    return null; // Skip cache
  }

  async setTips(language, published, data) {
    return true;
  }

  async invalidateTips(language) {
    return true;
  }

  // Podcasts cache
  async getPodcasts(language, published) {
    return null; // Skip cache
  }

  async setPodcasts(language, published, data) {
    return true;
  }

  async invalidatePodcasts(language) {
    return true;
  }

  // Banners cache
  async getBanners() {
    return null; // Skip cache
  }

  async setBanners(data) {
    return true;
  }

  async invalidateBanners() {
    return true;
  }

  // Health check methods
  isHealthy() {
    return false; // Cache is disabled
  }

  async healthCheck() {
    return { healthy: false, status: 'Cache disabled - using JSON files' };
  }
}

module.exports = new CacheService();
