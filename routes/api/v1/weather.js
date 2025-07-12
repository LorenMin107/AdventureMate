const express = require('express');
const axios = require('axios');
const redisCache = require('../../../utils/redis');
const { asyncHandler } = require('../../../utils/errorHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const { logInfo, logError, logWarn } = require('../../../utils/logger');

const router = express.Router();

/**
 * Update weather API statistics
 * @param {Object} stats - Statistics to update
 */
const updateWeatherStats = async (stats) => {
  try {
    if (!redisCache.isReady()) return;

    // Get current stats
    const currentStats = await redisCache.get('weather:stats');
    const existingStats = currentStats
      ? JSON.parse(currentStats)
      : {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalResponseTime: 0,
          avgResponseTime: 0,
          errorRate: 0,
          lastRequest: null,
          lastError: null,
        };

    // Update stats
    const updatedStats = {
      ...existingStats,
      totalRequests: existingStats.totalRequests + 1,
      lastRequest: new Date().toISOString(),
    };

    if (stats.success) {
      updatedStats.successfulRequests = existingStats.successfulRequests + 1;
      updatedStats.totalResponseTime = existingStats.totalResponseTime + (stats.responseTime || 0);
      updatedStats.avgResponseTime =
        updatedStats.totalResponseTime / updatedStats.successfulRequests;
    } else {
      updatedStats.failedRequests = existingStats.failedRequests + 1;
      updatedStats.lastError = stats.error || 'Unknown error';
    }

    updatedStats.errorRate = (updatedStats.failedRequests / updatedStats.totalRequests) * 100;

    // Store updated stats
    await redisCache.set('weather:stats', JSON.stringify(updatedStats), 86400); // 24 hours
  } catch (error) {
    logError('Error updating weather stats', error);
  }
};

/**
 * Update cache statistics
 * @param {boolean} isHit - Whether it was a cache hit
 */
const updateCacheStats = async (isHit) => {
  try {
    if (!redisCache.isReady()) return;

    // Get current cache stats
    const currentStats = await redisCache.get('weather:cache:stats');
    const existingStats = currentStats
      ? JSON.parse(currentStats)
      : {
          hits: 0,
          misses: 0,
          hitRate: 0,
          size: 0,
          keys: 0,
          memoryUsage: 0,
        };

    // Update stats
    if (isHit) {
      existingStats.hits = existingStats.hits + 1;
    } else {
      existingStats.misses = existingStats.misses + 1;
    }

    existingStats.hitRate =
      (existingStats.hits / (existingStats.hits + existingStats.misses)) * 100;

    // Get Redis info for additional stats
    try {
      const info = await redisCache.client.info();
      let memory = 0;

      // Try to get memory usage, but handle gracefully if not available
      try {
        // Get memory usage from Redis INFO command instead of MEMORY USAGE
        const memoryInfo = await redisCache.client.info('memory');
        const usedMemoryMatch = memoryInfo.match(/used_memory:(\d+)/);
        memory = usedMemoryMatch ? parseInt(usedMemoryMatch[1]) : 0;
      } catch (memoryError) {
        logWarn('Could not fetch Redis info for cache stats', memoryError);
      }

      const keyspace = await redisCache.client.info('keyspace');

      // Parse keyspace info to get number of keys
      const keysMatch = keyspace.match(/keys=(\d+)/);
      existingStats.keys = keysMatch ? parseInt(keysMatch[1]) : 0;
      existingStats.memoryUsage = memory || 0;

      // Estimate cache size (rough calculation)
      existingStats.size = existingStats.keys * 1024; // Rough estimate: 1KB per key
    } catch (redisError) {
      logWarn('Could not fetch Redis info for cache stats', redisError);
    }

    // Store updated stats
    await redisCache.set('weather:cache:stats', JSON.stringify(existingStats), 86400); // 24 hours
  } catch (error) {
    logError('Error updating cache stats', error);
  }
};

/**
 * Track recent weather requests
 * @param {Object} request - Request details
 */
const trackRecentRequest = async (request) => {
  try {
    if (!redisCache.isReady()) return;

    // Get current recent requests
    const currentRequests = await redisCache.get('weather:recent:requests');
    const recentRequests = currentRequests ? JSON.parse(currentRequests) : [];

    // Add new request
    const newRequest = {
      ...request,
      timestamp: new Date().toISOString(),
    };

    // Keep only last 50 requests
    const updatedRequests = [newRequest, ...recentRequests.slice(0, 49)];

    // Store updated requests
    await redisCache.set('weather:recent:requests', JSON.stringify(updatedRequests), 3600); // 1 hour
  } catch (error) {
    logError('Error tracking recent request', error);
  }
};

/**
 * @route GET /api/v1/weather
 * @desc Get weather data for a specific location
 * @access Public
 * @query {number} lat - Latitude
 * @query {number} lng - Longitude
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;
    const startTime = Date.now();

    // Validate required parameters
    if (!lat || !lng) {
      await updateWeatherStats({ success: false, error: 'Missing parameters' });
      return ApiResponse.error(
        'Missing parameters',
        'Latitude (lat) and longitude (lng) are required',
        400
      ).send(res);
    }

    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      await updateWeatherStats({ success: false, error: 'Invalid coordinates' });
      return ApiResponse.error(
        'Invalid coordinates',
        'Latitude and longitude must be valid numbers',
        400
      ).send(res);
    }

    if (latitude < -90 || latitude > 90) {
      await updateWeatherStats({ success: false, error: 'Invalid latitude' });
      return ApiResponse.error('Invalid latitude', 'Latitude must be between -90 and 90', 400).send(
        res
      );
    }

    if (longitude < -180 || longitude > 180) {
      await updateWeatherStats({ success: false, error: 'Invalid longitude' });
      return ApiResponse.error(
        'Invalid longitude',
        'Longitude must be between -180 and 180',
        400
      ).send(res);
    }

    // Generate cache key
    const cacheKey = `weather:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;

    // Try to get from cache first
    if (redisCache.isReady()) {
      const cachedData = await redisCache.get(cacheKey);
      if (cachedData) {
        await updateCacheStats(true);
        await updateWeatherStats({
          success: true,
          responseTime: Date.now() - startTime,
          source: 'cache',
        });
        await trackRecentRequest({
          lat: latitude,
          lng: longitude,
          source: 'cache',
          responseTime: Date.now() - startTime,
        });

        logInfo('Weather data served from cache', {
          lat: latitude,
          lng: longitude,
          cacheKey,
        });
        return ApiResponse.success(cachedData, 'Weather data retrieved successfully (cached)').send(
          res
        );
      }
    }

    // Cache miss
    await updateCacheStats(false);

    // Fetch from OpenWeatherMap Free APIs
    const openWeatherKey = process.env.OPENWEATHER_KEY;
    if (!openWeatherKey) {
      await updateWeatherStats({ success: false, error: 'API key not configured' });
      logError('OpenWeatherMap API key not configured');
      return ApiResponse.error(
        'Service unavailable',
        'Weather service is not configured',
        503
      ).send(res);
    }

    try {
      // 1. Fetch current weather
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast`;
      const params = {
        lat: latitude,
        lon: longitude,
        appid: openWeatherKey,
        units: 'metric',
      };

      logInfo('Fetching current weather from OpenWeatherMap', { lat: latitude, lng: longitude });
      const currentPromise = axios.get(currentUrl, { params });
      logInfo('Fetching forecast from OpenWeatherMap', { lat: latitude, lng: longitude });
      const forecastPromise = axios.get(forecastUrl, { params });

      const [currentRes, forecastRes] = await Promise.all([currentPromise, forecastPromise]);
      const currentData = currentRes.data;
      const forecastData = forecastRes.data;

      // 2. Transform current weather
      const current = {
        temp: Math.round(currentData.main.temp),
        feels_like: Math.round(currentData.main.feels_like),
        humidity: currentData.main.humidity,
        wind_speed: Math.round(currentData.wind.speed),
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        main: currentData.weather[0].main,
      };

      // 3. Transform forecast: pick 3 next days at 12:00 (noon) local time
      const forecastList = forecastData.list;
      const forecastByDay = {};
      forecastList.forEach((item) => {
        const date = new Date(item.dt * 1000);
        const day = date.toISOString().split('T')[0];
        const hour = date.getUTCHours();
        // Pick the forecast closest to 12:00 UTC (or local noon if you want, but UTC is fine for most)
        if (!forecastByDay[day] || Math.abs(hour - 12) < Math.abs(forecastByDay[day].hour - 12)) {
          forecastByDay[day] = { ...item, hour };
        }
      });
      // Get the next 3 days (excluding today)
      const today = new Date().toISOString().split('T')[0];
      const forecastDays = Object.keys(forecastByDay)
        .filter((day) => day > today)
        .sort()
        .slice(0, 3)
        .map((day) => {
          const item = forecastByDay[day];
          return {
            date: day,
            temp: {
              min: Math.round(item.main.temp_min),
              max: Math.round(item.main.temp_max),
            },
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            main: item.weather[0].main,
            humidity: item.main.humidity,
            wind_speed: Math.round(item.wind.speed),
          };
        });

      const transformedData = {
        current,
        forecast: forecastDays,
        location: {
          lat: latitude,
          lng: longitude,
        },
        timestamp: new Date().toISOString(),
      };

      // Cache the response for 15 minutes (900 seconds)
      if (redisCache.isReady()) {
        await redisCache.set(cacheKey, transformedData, 900);
        logInfo('Weather data cached successfully', {
          lat: latitude,
          lng: longitude,
          cacheKey,
          ttl: 900,
        });
      }

      const responseTime = Date.now() - startTime;
      await updateWeatherStats({
        success: true,
        responseTime,
        source: 'api',
      });
      await trackRecentRequest({
        lat: latitude,
        lng: longitude,
        source: 'api',
        responseTime,
        currentTemp: transformedData.current.temp,
        forecastDays: transformedData.forecast.length,
      });

      logInfo('Weather data fetched and combined successfully', {
        lat: latitude,
        lng: longitude,
        currentTemp: transformedData.current.temp,
        forecastDays: transformedData.forecast.length,
        responseTime,
      });

      return ApiResponse.success(transformedData, 'Weather data retrieved successfully').send(res);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await updateWeatherStats({
        success: false,
        error: error.response?.data?.message || error.message,
        responseTime,
      });

      logError('Error fetching weather data', error, {
        lat: latitude,
        lng: longitude,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        responseTime,
      });

      if (error.response?.status === 401) {
        return ApiResponse.error(
          'Service unavailable',
          'Weather service authentication failed',
          503
        ).send(res);
      }

      if (error.response?.status === 429) {
        return ApiResponse.error(
          'Service temporarily unavailable',
          'Weather service rate limit exceeded. Please try again later.',
          429
        ).send(res);
      }

      return ApiResponse.error(
        'Weather service error',
        'Failed to fetch weather data. Please try again later.',
        500
      ).send(res);
    }
  })
);

module.exports = router;
