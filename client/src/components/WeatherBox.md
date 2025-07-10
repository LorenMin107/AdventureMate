# WeatherBox Component

A reusable React component that displays weather information for a specific location using the OpenWeatherMap API.

## Features

- **Real-time Weather Data**: Current temperature, conditions, and 3-day forecast
- **React Query Integration**: Efficient data fetching with caching and error handling
- **Theme Support**: Follows the app's dark/light theme system
- **Responsive Design**: Adapts to different screen sizes
- **Loading & Error States**: Graceful handling of loading and error scenarios
- **Flexible Props**: Accepts coordinates in multiple formats

## Props

| Prop           | Type                         | Required | Default | Description                                      |
| -------------- | ---------------------------- | -------- | ------- | ------------------------------------------------ |
| `coordinates`  | `{lat: number, lng: number}` | No\*     | -       | Object containing latitude and longitude         |
| `lat`          | `number`                     | No\*     | -       | Latitude (alternative to coordinates object)     |
| `lng`          | `number`                     | No\*     | -       | Longitude (alternative to coordinates object)    |
| `showForecast` | `boolean`                    | No       | `true`  | Whether to show the 3-day forecast               |
| `compact`      | `boolean`                    | No       | `false` | Whether to show a compact version for map popups |

\*Either `coordinates` object OR both `lat` and `lng` props are required.

## Usage Examples

### Basic Usage with Coordinates Object

```jsx
import WeatherBox from '../components/WeatherBox';

<WeatherBox coordinates={{ lat: 13.7563, lng: 100.5018 }} showForecast={true} compact={false} />;
```

### Usage with Separate Lat/Lng Props

```jsx
import WeatherBox from '../components/WeatherBox';

<WeatherBox lat={13.7563} lng={100.5018} showForecast={true} compact={false} />;
```

### Compact Version for Map Popups

```jsx
<WeatherBox lat={13.7563} lng={100.5018} showForecast={true} compact={true} />
```

### Current Weather Only (No Forecast)

```jsx
<WeatherBox lat={13.7563} lng={100.5018} showForecast={false} compact={false} />
```

## Integration in Campground Details Page

The WeatherBox component is integrated into the Campground Details Page to show weather information for the campground location:

```jsx
{
  /* Weather Section */
}
{
  geometry && geometry.coordinates && (
    <div className="weather-section">
      <h2>Weather Forecast for this Campground</h2>
      <WeatherBox
        lat={geometry.coordinates[1]}
        lng={geometry.coordinates[0]}
        showForecast={true}
        compact={false}
      />
    </div>
  );
}
```

## Styling

The component uses CSS variables for theming and includes responsive styles:

- **Dark Theme**: Uses `var(--color-card-bg)`, `var(--color-text)`, etc.
- **Responsive**: Adapts to different screen sizes with media queries
- **Customizable**: Styles can be overridden using CSS classes

## API Integration

The component uses the `useWeather` hook which:

- Fetches data from `/api/v1/weather?lat={lat}&lng={lng}`
- Caches data for 15 minutes (matches backend cache)
- Handles loading and error states
- Retries failed requests with exponential backoff

## Weather Data Structure

The component expects weather data in this format:

```json
{
  "current": {
    "temp": 25,
    "feels_like": 27,
    "humidity": 65,
    "description": "Partly cloudy",
    "icon": "02d"
  },
  "forecast": [
    {
      "date": "2024-01-15",
      "temp": { "max": 28, "min": 22 },
      "description": "Sunny",
      "icon": "01d"
    }
  ]
}
```

## Error Handling

The component gracefully handles:

- **Loading State**: Shows spinner and "Loading weather..." message
- **Error State**: Shows "Weather unavailable" message
- **Missing Data**: Returns null if no weather data is available
- **Invalid Coordinates**: Handled by the useWeather hook

## Performance

- **Caching**: Uses React Query for efficient caching
- **Stale Time**: 15 minutes (matches backend cache)
- **Cache Time**: 30 minutes
- **Retry Logic**: Retries failed requests up to 2 times
- **Background Refetch**: Refetches on reconnect, not on window focus
