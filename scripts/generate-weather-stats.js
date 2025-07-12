const redisCache = require('../utils/redis');
const { logInfo } = require('../utils/logger');

/**
 * Generate sample weather statistics for testing
 */
const generateWeatherStats = async () => {
  try {
    // Connect to Redis if not already connected
    if (!redisCache.isReady()) {
      console.log('Connecting to Redis...');
      await redisCache.connect();
    }

    if (!redisCache.isReady()) {
      console.log('Redis not connected. Skipping weather stats generation.');
      return;
    }

    // Generate sample API stats
    const sampleApiStats = {
      totalRequests: 150,
      successfulRequests: 142,
      failedRequests: 8,
      totalResponseTime: 45000, // 45 seconds total
      avgResponseTime: 317, // ~317ms average
      errorRate: 5.33, // 5.33%
      lastRequest: new Date().toISOString(),
      lastError: 'Rate limit exceeded',
    };

    // Generate sample cache stats
    const sampleCacheStats = {
      hits: 89,
      misses: 61,
      hitRate: 59.33, // 59.33% hit rate
      size: 51200, // 50KB estimated
      keys: 50,
      memoryUsage: 1024000, // 1MB
    };

    // Generate sample recent requests
    const sampleRecentRequests = [
      {
        lat: 13.7563,
        lng: 100.5018,
        source: 'api',
        responseTime: 450,
        currentTemp: 28,
        forecastDays: 3,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      },
      {
        lat: 13.7563,
        lng: 100.5018,
        source: 'cache',
        responseTime: 15,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      },
      {
        lat: 18.7883,
        lng: 98.9853,
        source: 'api',
        responseTime: 380,
        currentTemp: 25,
        forecastDays: 3,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      },
      {
        lat: 7.8731,
        lng: 80.7718,
        source: 'api',
        responseTime: 520,
        currentTemp: 30,
        forecastDays: 3,
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
      },
      {
        lat: 13.7563,
        lng: 100.5018,
        source: 'cache',
        responseTime: 12,
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
      },
    ];

    // Store the sample data
    await redisCache.set('weather:stats', JSON.stringify(sampleApiStats), 86400); // 24 hours
    await redisCache.set('weather:cache:stats', JSON.stringify(sampleCacheStats), 86400); // 24 hours
    await redisCache.set('weather:recent:requests', JSON.stringify(sampleRecentRequests), 3600); // 1 hour

    logInfo('Generated sample weather statistics', {
      apiStats: sampleApiStats,
      cacheStats: sampleCacheStats,
      recentRequestsCount: sampleRecentRequests.length,
    });

    console.log('✅ Sample weather statistics generated successfully!');
    console.log(
      `📊 API Stats: ${sampleApiStats.totalRequests} total requests, ${sampleApiStats.errorRate.toFixed(2)}% error rate`
    );
    console.log(
      `💾 Cache Stats: ${sampleCacheStats.hitRate.toFixed(2)}% hit rate, ${sampleCacheStats.keys} keys`
    );
    console.log(`📝 Recent Requests: ${sampleRecentRequests.length} tracked requests`);
  } catch (error) {
    console.error('❌ Error generating weather stats:', error.message);
  }
};

// Run the script if called directly
if (require.main === module) {
  generateWeatherStats()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateWeatherStats };
