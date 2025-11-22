/**
 * Redis Client Module - Stub for cache
 * Can be enhanced with actual Redis in the future
 */

class RedisClientStub {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    // Stub implementation - pretend to connect
    console.log('⚠️  Redis cache disabled (stub mode)');
    this.isConnected = false; // Keep disabled since we're not using it
    return true;
  }

  async get(key) {
    return null; // Cache miss
  }

  async set(key, value, ttl) {
    return true; // Pretend it worked
  }

  async del(key) {
    return true;
  }

  async disconnect() {
    // Stub - nothing to do
    this.isConnected = false;
  }

  isHealthy() {
    return false; // Redis stub is not healthy
  }

  async healthCheck() {
    return { healthy: false, status: 'Redis stub - not connected' };
  }
}

module.exports = new RedisClientStub();
