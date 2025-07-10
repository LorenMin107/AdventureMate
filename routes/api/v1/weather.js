const express = require('express');
const axios = require('axios');
const redisCache = require('../../../utils/redis');
const { asyncHandler } = require('../../../utils/errorHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const { logInfo, logError, logWarn } = require('../../../utils/logger');

const router = express.Router();

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

    // Validate required parameters
    if (!lat || !lng) {
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
      return ApiResponse.error(
        'Invalid coordinates',
        'Latitude and longitude must be valid numbers',
        400
      ).send(res);
    }

    if (latitude < -90 || latitude > 90) {
      return ApiResponse.error('Invalid latitude', 'Latitude must be between -90 and 90', 400).send(
        res
      );
    }

    if (longitude < -180 || longitude > 180) {
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

    // Fetch from OpenWeatherMap Free APIs
    const openWeatherKey = process.env.OPENWEATHER_KEY;
    if (!openWeatherKey) {
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

      logInfo('Weather data fetched and combined successfully', {
        lat: latitude,
        lng: longitude,
        currentTemp: transformedData.current.temp,
        forecastDays: transformedData.forecast.length,
      });

      return ApiResponse.success(transformedData, 'Weather data retrieved successfully').send(res);
    } catch (error) {
      logError('Error fetching weather data', error, {
        lat: latitude,
        lng: longitude,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
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
