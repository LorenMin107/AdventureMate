# Weather Feature Implementation

This document describes the weather feature implementation for the MyanCamp campground booking application.

## Overview

The weather feature enhances the Mapbox popup by displaying current weather conditions and a 3-day forecast for campground locations. It uses the OpenWeatherMap Free API with Redis caching to optimize performance and respect API rate limits.

## Features

- **Current Weather Display**: Shows temperature, feels like, humidity, and weather description
- **3-Day Forecast**: Displays daily high/low temperatures and weather conditions
- **Weather Icons**: Uses emoji-based weather icons for visual appeal
- **Redis Caching**: 15-minute cache to reduce API calls and improve performance
- **Theme Support**: Adapts to light/dark theme automatically
- **Responsive Design**: Works on all screen sizes
- **Error Handling**: Graceful fallback when weather service is unavailable

## Backend Implementation

### Weather API Route

**File**: `routes/api/v1/weather.js`

**Endpoint**: `GET /api/v1/weather`

**Query Parameters**:

- `lat` (required): Latitude coordinate
- `lng` (required): Longitude coordinate

**Response Format**:

```json
{
  "status": "success",
  "data": {
    "current": {
      "temp": 25,
      "feels_like": 27,
      "humidity": 65,
      "wind_speed": 12,
      "description": "scattered clouds",
      "icon": "03d",
      "main": "Clouds"
    },
    "forecast": [
      {
        "date": "2024-01-15",
        "temp": {
          "min": 20,
          "max": 28
        },
        "description": "clear sky",
        "icon": "01d",
        "main": "Clear",
        "humidity": 60,
        "wind_speed": 10
      }
    ],
    "location": {
      "lat": 13.7563,
      "lng": 100.5018
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "message": "Weather data retrieved successfully"
}
```

### Caching Strategy

- **Cache Key**: `weather:{lat}:{lng}` (coordinates rounded to 4 decimal places)
- **TTL**: 15 minutes (900 seconds)
- **Cache Type**: Redis
- **Fallback**: Graceful degradation when Redis is unavailable

### Error Handling

- **400**: Missing or invalid coordinates
- **503**: Weather service not configured or authentication failed
- **429**: Rate limit exceeded
- **500**: General weather service error

## Frontend Implementation

### Weather Hook

**File**: `client/src/hooks/useWeather.js`

Uses React Query for:

- Automatic caching and background updates
- Error handling and retry logic
- Optimistic updates
- Request deduplication

### WeatherBox Component

**File**: `client/src/components/WeatherBox.jsx`

**Props**:

- `coordinates`: Object with `lat` and `lng` properties
- `showForecast`: Boolean to control forecast display (default: true)

**Features**:

- Loading states with spinner animation
- Error states with user-friendly messages
- Weather icon mapping from OpenWeatherMap codes to emojis
- Responsive design with theme support

### Integration Points

1. **ClusterMap Component**: Weather box appears in campground marker popups
2. **CampgroundMap Component**: Weather box appears in single campground popup
3. **Theme System**: Automatically adapts to light/dark themes

## Setup Instructions

### 1. Environment Configuration

Add the OpenWeatherMap API key to your `.env` file:

```env
# OpenWeatherMap API Key (Free tier)
OPENWEATHER_KEY=your_openweathermap_api_key_here
```

### 2. Get OpenWeatherMap API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/)
2. Sign up for a free account
3. Navigate to "My API Keys" section
4. Copy your API key
5. Add it to your `.env` file

**Note**: Free tier includes:

- 1,000 calls per day
- Current weather and 5-day forecast
- 3-hour forecast data

### 3. Redis Configuration (Optional)

The weather feature works without Redis, but caching is recommended for production:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # Optional
REDIS_DB=0
```

### 4. API Route Registration

The weather route is automatically registered in `routes/api/v1/index.js`:

```javascript
const weatherRoutes = require('./weather');
router.use('/weather', weatherRoutes);
```

## Usage Examples

### Basic Weather Box

```jsx
import WeatherBox from '../components/WeatherBox';

<WeatherBox coordinates={{ lat: 13.7563, lng: 100.5018 }} showForecast={true} />;
```

### Custom Hook Usage

```jsx
import { useWeather } from '../hooks/useWeather';

const {
  data: weather,
  isLoading,
  error,
} = useWeather({
  lat: 13.7563,
  lng: 100.5018,
});
```

## Weather Icon Mapping

The component maps OpenWeatherMap icon codes to emoji icons:

| Icon Code | Weather Condition | Emoji |
| --------- | ----------------- | ----- |
| 01d/01n   | Clear sky         | ☀️/🌙 |
| 02d/02n   | Few clouds        | ⛅/☁️ |
| 03d/03n   | Scattered clouds  | ☁️    |
| 04d/04n   | Broken clouds     | ☁️    |
| 09d/09n   | Shower rain       | 🌧️    |
| 10d/10n   | Rain              | 🌦️/🌧️ |
| 11d/11n   | Thunderstorm      | ⛈️    |
| 13d/13n   | Snow              | 🌨️    |
| 50d/50n   | Mist              | 🌫️    |

## Performance Considerations

### Caching Benefits

- **Backend**: 15-minute Redis cache reduces API calls by ~95%
- **Frontend**: React Query cache with 15-minute stale time
- **Network**: Reduced bandwidth usage and faster response times

### Rate Limiting

- OpenWeatherMap free tier: 1,000 calls/day
- With caching: ~48 calls/day (assuming 15-minute cache)
- Graceful degradation when rate limit exceeded

### Error Handling

- Network errors: Automatic retry with exponential backoff
- API errors: User-friendly error messages
- Service unavailability: Graceful fallback

## Testing

### Backend Testing

Test the weather API endpoint:

```bash
# Test with valid coordinates
curl -X GET "http://localhost:3001/api/v1/weather?lat=13.7563&lng=100.5018"

# Test with invalid coordinates
curl -X GET "http://localhost:3001/api/v1/weather?lat=invalid&lng=100.5018"

# Test with missing parameters
curl -X GET "http://localhost:3001/api/v1/weather"
```

### Frontend Testing

1. Navigate to the campgrounds page
2. Click on a campground marker
3. Verify weather information appears in the popup
4. Test theme switching (light/dark)
5. Test responsive design on mobile devices

## Troubleshooting

### Common Issues

1. **"Weather service is not configured"**

   - Check that `OPENWEATHER_KEY` is set in `.env`
   - Verify the API key is valid

2. **"Weather unavailable"**

   - Check network connectivity
   - Verify OpenWeatherMap service status
   - Check API rate limits

3. **Weather not loading in popup**

   - Check browser console for errors
   - Verify React Query is properly configured
   - Check API endpoint accessibility

4. **Cache not working**
   - Verify Redis is running
   - Check Redis connection configuration
   - Review cache TTL settings

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Monitor Redis operations
redis-cli monitor

# Check weather cache keys
redis-cli keys "weather:*"

# Test OpenWeatherMap API directly
curl "https://api.openweathermap.org/data/3.0/onecall?lat=13.7563&lon=100.5018&appid=YOUR_API_KEY&units=metric"
```

## Future Enhancements

- [ ] Weather alerts and warnings
- [ ] Extended 7-day forecast
- [ ] Hourly weather data
- [ ] Weather history
- [ ] Multiple weather providers
- [ ] Weather-based recommendations
- [ ] Weather notifications
- [ ] Weather widgets for dashboard

## Dependencies

### Backend

- `axios`: HTTP client for API requests
- `ioredis`: Redis client for caching
- `express`: Web framework

### Frontend

- `@tanstack/react-query`: Data fetching and caching
- `react-map-gl`: Mapbox integration
- Custom components and hooks

## License

This weather feature implementation is part of the MyanCamp application and follows the same licensing terms.
