const Redis = require('ioredis');
const config = require('../config');
const { logInfo, logError, logWarn, logDebug } = require('./logger');

/**
 * Redis Cache Service
 * Provides caching functionality for the AdventureMate application
 */
class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        retryDelayOnFailover: config.redis.retryDelayOnFailover,
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
        lazyConnect: config.redis.lazyConnect,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      // Handle connection events
      this.client.on('connect', () => {
        this.isConnected = true;
        this.connectionAttempts = 0;
        logInfo('Redis connected successfully', {
          host: config.redis.host,
          port: config.redis.port,
          db: config.redis.db,
        });
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logError('Redis connection error', err, {
          host: config.redis.host,
          port: config.redis.port,
        });
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logWarn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        logInfo('Redis reconnecting...');
      });

      // Connect to Redis
      await this.client.connect();
      return true;
    } catch (error) {
      logError('Failed to connect to Redis', error, {
        host: config.redis.host,
        port: config.redis.port,
      });
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logInfo('Redis disconnected successfully');
      } catch (error) {
        logError('Error disconnecting from Redis', error);
      }
    }
  }

  /**
   * Check if Redis is connected
   */
  isReady() {
    return this.isConnected && this.client && this.client.status === 'ready';
  }

  /**
   * Set a key-value pair in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   */
  async set(key, value, ttl = null) {
    if (!this.isReady()) {
      logWarn('Redis not connected, skipping cache set', { key });
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      logDebug('Cache set successful', { key, ttl });
      return true;
    } catch (error) {
      logError('Error setting cache', error, { key });
      return false;
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null if not found
   */
  async get(key) {
    if (!this.isReady()) {
      logWarn('Redis not connected, skipping cache get', { key });
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        const parsedValue = JSON.parse(value);
        logDebug('Cache hit', { key });
        return parsedValue;
      }

      logDebug('Cache miss', { key });
      return null;
    } catch (error) {
      logError('Error getting from cache', error, { key });
      return null;
    }
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   */
  async del(key) {
    if (!this.isReady()) {
      logWarn('Redis not connected, skipping cache delete', { key });
      return false;
    }

    try {
      await this.client.del(key);
      logDebug('Cache delete successful', { key });
      return true;
    } catch (error) {
      logError('Error deleting from cache', error, { key });
      return false;
    }
  }

  /**
   * Delete multiple keys from cache
   * @param {string[]} keys - Array of cache keys
   */
  async delMultiple(keys) {
    if (!this.isReady()) {
      logWarn('Redis not connected, skipping cache delete multiple', { keys });
      return false;
    }

    try {
      await this.client.del(...keys);
      logDebug('Cache delete multiple successful', { keys });
      return true;
    } catch (error) {
      logError('Error deleting multiple from cache', error, { keys });
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists
   */
  async exists(key) {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logError('Error checking cache existence', error, { key });
      return false;
    }
  }

  /**
   * Set cache with default TTL for specific data types
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {string} type - Data type (campgrounds, users, bookings, etc.)
   */
  async setWithDefaultTTL(key, value, type) {
    const ttl = config.redis.ttl[type] || config.redis.ttl.campgrounds;
    return this.set(key, value, ttl);
  }

  /**
   * Invalidate cache by pattern
   * @param {string} pattern - Redis pattern to match keys
   */
  async invalidatePattern(pattern) {
    if (!this.isReady()) {
      logWarn('Redis not connected, skipping pattern invalidation', { pattern });
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logInfo('Cache pattern invalidation successful', { pattern, keysCount: keys.length });
      }
      return true;
    } catch (error) {
      logError('Error invalidating cache pattern', error, { pattern });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isReady()) {
      return null;
    }

    try {
      const info = await this.client.info();
      let memory = 0;

      // Try to get memory usage, but handle gracefully if not available
      try {
        // Get memory usage from Redis INFO command instead of MEMORY USAGE
        const memoryInfo = await this.client.info('memory');
        const usedMemoryMatch = memoryInfo.match(/used_memory:(\d+)/);
        memory = usedMemoryMatch ? parseInt(usedMemoryMatch[1]) : 0;
      } catch (memoryError) {
        logWarn('Could not fetch memory usage from Redis', { error: memoryError.message });
        memory = 0;
      }

      const keyspace = await this.client.info('keyspace');

      return {
        info,
        memory,
        keyspace,
        isConnected: this.isConnected,
      };
    } catch (error) {
      logError('Error getting Redis stats', error);
      return null;
    }
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    if (!this.isReady()) {
      logWarn('Redis not connected, skipping cache clear');
      return false;
    }

    try {
      await this.client.flushdb();
      logInfo('Cache cleared successfully');
      return true;
    } catch (error) {
      logError('Error clearing cache', error);
      return false;
    }
  }
}

// Create singleton instance
const redisCache = new RedisCache();

module.exports = redisCache;
