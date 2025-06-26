# Map Components for MyanCamp

This directory contains React components for displaying maps in the MyanCamp application using Mapbox GL JS.

## Components

### CampgroundMap

A component for displaying a single campground location on a map.

#### Props

- `geometry` (Object): The campground's geometry object with coordinates
- `title` (String): The campground's title
- `popupContent` (String, optional): HTML content for the popup
- `zoom` (Number, optional): Initial zoom level (default: 10)

#### Usage

```jsx
import CampgroundMap from '../components/maps/CampgroundMap';

// In your component
<CampgroundMap 
  geometry={campground.geometry} 
  title={campground.title} 
  popupContent={`<strong>${campground.title}</strong><p>${campground.location}</p>`}
/>
```

### ClusterMap

A component for displaying multiple campgrounds on a map.

#### Props

- `campgrounds` (Array): Array of campground objects
- `initialViewState` (Object, optional): Initial view state for the map

#### Usage

```jsx
import ClusterMap from '../components/maps/ClusterMap';

// In your component
<ClusterMap campgrounds={campgrounds} />
```

## Configuration

The map components require a Mapbox access token to function. This token should be set in the `.env` file in the client directory:

```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

## Styling

The map components come with their own CSS files:

- `CampgroundMap.css`: Styles for the single campground map
- `ClusterMap.css`: Styles for the cluster map

These styles include responsive design to ensure the maps look good on all screen sizes.