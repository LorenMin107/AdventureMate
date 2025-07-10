import React from 'react';
import { useWeather } from '../hooks/useWeather';
import { useTheme } from '../context/ThemeContext';
import './WeatherBox.css';

/**
 * WeatherBox component displays weather information for a location
 * @param {Object} props - Component props
 * @param {Object} [props.coordinates] - Object containing lat and lng
 * @param {number} [props.coordinates.lat] - Latitude
 * @param {number} [props.coordinates.lng] - Longitude
 * @param {number} [props.lat] - Latitude (alternative to coordinates object)
 * @param {number} [props.lng] - Longitude (alternative to coordinates object)
 * @param {boolean} props.showForecast - Whether to show the 3-day forecast (default: true)
 * @param {boolean} props.compact - Whether to show a compact version for map popups (default: false)
 */
const WeatherBox = ({ coordinates, lat, lng, showForecast = true, compact = false }) => {
  const { theme } = useTheme();

  // Use coordinates object if provided, otherwise use lat/lng props
  const weatherCoordinates = coordinates || (lat && lng ? { lat, lng } : null);

  const { data: weather, isLoading, error } = useWeather(weatherCoordinates);

  if (isLoading) {
    return (
      <div className={`weather-box ${theme} ${compact ? 'compact' : ''}`}>
        <div className="weather-loading">
          <div className="weather-loading-spinner"></div>
          <span>Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`weather-box ${theme} ${compact ? 'compact' : ''}`}>
        <div className="weather-error">
          <span>Weather unavailable</span>
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const getWeatherIcon = (iconCode) => {
    // Map OpenWeatherMap icon codes to weather descriptions
    const iconMap = {
      '01d': '☀️', // clear sky day
      '01n': '🌙', // clear sky night
      '02d': '⛅', // few clouds day
      '02n': '☁️', // few clouds night
      '03d': '☁️', // scattered clouds
      '03n': '☁️', // scattered clouds
      '04d': '☁️', // broken clouds
      '04n': '☁️', // broken clouds
      '09d': '🌧️', // shower rain
      '09n': '🌧️', // shower rain
      '10d': '🌦️', // rain day
      '10n': '🌧️', // rain night
      '11d': '⛈️', // thunderstorm
      '11n': '⛈️', // thunderstorm
      '13d': '🌨️', // snow
      '13n': '🌨️', // snow
      '50d': '🌫️', // mist
      '50n': '🌫️', // mist
    };
    return iconMap[iconCode] || '🌤️';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (compact) {
    return (
      <div className={`weather-box ${theme} compact`}>
        {/* Compact Current Weather */}
        <div className="weather-current-compact">
          <div className="weather-icon-compact">{getWeatherIcon(weather.current.icon)}</div>
          <div className="weather-temp-compact">
            <span className="temp-value-compact">{weather.current.temp}°</span>
            <span className="temp-unit-compact">C</span>
          </div>
          <div className="weather-desc-compact">{weather.current.description}</div>
        </div>

        {/* Compact Forecast - just next 2 days */}
        {showForecast && weather.forecast && weather.forecast.length > 0 && (
          <div className="weather-forecast-compact">
            <div className="forecast-days-compact">
              {weather.forecast.slice(0, 2).map((day, index) => (
                <div key={index} className="forecast-day-compact">
                  <div className="forecast-date-compact">{formatDate(day.date)}</div>
                  <div className="forecast-icon-compact">{getWeatherIcon(day.icon)}</div>
                  <div className="forecast-temps-compact">
                    <span className="temp-max-compact">{day.temp.max}°</span>
                    <span className="temp-min-compact">{day.temp.min}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`weather-box ${theme}`}>
      {/* Current Weather */}
      <div className="weather-current">
        <div className="weather-current-main">
          <div className="weather-icon">{getWeatherIcon(weather.current.icon)}</div>
          <div className="weather-temp">
            <span className="temp-value">{weather.current.temp}°</span>
            <span className="temp-unit">C</span>
          </div>
        </div>
        <div className="weather-details">
          <div className="weather-description">{weather.current.description}</div>
          <div className="weather-meta">
            <span>Feels like {weather.current.feels_like}°</span>
            <span>Humidity {weather.current.humidity}%</span>
          </div>
        </div>
      </div>

      {/* 3-Day Forecast */}
      {showForecast && weather.forecast && weather.forecast.length > 0 && (
        <div className="weather-forecast">
          <div className="forecast-title">3-Day Forecast</div>
          <div className="forecast-days">
            {weather.forecast.map((day, index) => (
              <div key={index} className="forecast-day">
                <div className="forecast-date">{formatDate(day.date)}</div>
                <div className="forecast-icon">{getWeatherIcon(day.icon)}</div>
                <div className="forecast-temps">
                  <span className="temp-max">{day.temp.max}°</span>
                  <span className="temp-min">{day.temp.min}°</span>
                </div>
                <div className="forecast-desc">{day.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherBox;
