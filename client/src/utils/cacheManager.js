import { logInfo, logError } from './logger';

class CacheManager {
  constructor() {
    this.cacheVersion = Date.now();
    this.subscribers = new Map();
    this.initializeGlobalCacheVersion();
  }

  // Initialize global cache version
  initializeGlobalCacheVersion() {
    const globalVersion = localStorage.getItem('global_cache_version');
    if (!globalVersion) {
      localStorage.setItem('global_cache_version', this.cacheVersion.toString());
    } else {
      this.cacheVersion = parseInt(globalVersion);
    }
  }

  // Get cache key with version
  getCacheKey(baseKey) {
    return `${baseKey}_v${this.cacheVersion}`;
  }

  // Set cache with automatic versioning
  setCache(key, data, ttl = 300000) {
    // 5 minutes default
    try {
      const cacheKey = this.getCacheKey(key);
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
        version: this.cacheVersion,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      logInfo('Cache set', { key: cacheKey, version: this.cacheVersion });
    } catch (error) {
      logError('Error setting cache', error);
    }
  }

  // Get cache with automatic invalidation
  getCache(key) {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const cacheData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired or version is outdated
      if (now - cacheData.timestamp > cacheData.ttl || cacheData.version !== this.cacheVersion) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      logError('Error getting cache', error);
      return null;
    }
  }

  // Invalidate all caches for a specific entity
  invalidateEntity(entityType, entityId) {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(entityType) || (entityId && key.includes(entityId)))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        logInfo('Invalidated cache', { key });
      });

      // Update global cache version to invalidate all caches
      this.cacheVersion = Date.now();
      localStorage.setItem('global_cache_version', this.cacheVersion.toString());

      // Notify subscribers
      this.notifySubscribers(entityType, entityId);

      logInfo('Entity cache invalidation complete', {
        entityType,
        entityId,
        invalidatedCount: keysToRemove.length,
        newVersion: this.cacheVersion,
      });
    } catch (error) {
      logError('Error invalidating entity cache', error);
    }
  }

  // Subscribe to cache invalidation events
  subscribe(entityType, callback) {
    if (!this.subscribers.has(entityType)) {
      this.subscribers.set(entityType, new Set());
    }
    this.subscribers.get(entityType).add(callback);
  }

  // Unsubscribe from cache invalidation events
  unsubscribe(entityType, callback) {
    const callbacks = this.subscribers.get(entityType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  // Notify subscribers of cache invalidation
  notifySubscribers(entityType, entityId) {
    const callbacks = this.subscribers.get(entityType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(entityId);
        } catch (error) {
          logError('Error in cache invalidation callback', error);
        }
      });
    }
  }

  // Clear all caches
  clearAll() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('_v') || key.includes('cache'))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Update global cache version
      this.cacheVersion = Date.now();
      localStorage.setItem('global_cache_version', this.cacheVersion.toString());

      logInfo('All caches cleared', { count: keysToRemove.length, newVersion: this.cacheVersion });
    } catch (error) {
      logError('Error clearing all caches', error);
    }
  }

  // Get cache statistics
  getStats() {
    try {
      const stats = {
        totalKeys: 0,
        validKeys: 0,
        expiredKeys: 0,
        version: this.cacheVersion,
      };

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('_v')) {
          stats.totalKeys++;
          const cached = localStorage.getItem(key);
          if (cached) {
            try {
              const cacheData = JSON.parse(cached);
              const now = Date.now();
              if (
                now - cacheData.timestamp <= cacheData.ttl &&
                cacheData.version === this.cacheVersion
              ) {
                stats.validKeys++;
              } else {
                stats.expiredKeys++;
              }
            } catch {
              stats.expiredKeys++;
            }
          }
        }
      }

      return stats;
    } catch (error) {
      logError('Error getting cache stats', error);
      return null;
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

export default cacheManager;
