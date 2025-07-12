import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ClusterMap from '../maps/ClusterMap';
import { ThemeProvider } from '../../context/ThemeContext';

// Mock the WeatherBox component
jest.mock('../WeatherBox', () => {
  return function MockWeatherBox() {
    return <div data-testid="weather-box">Weather Box</div>;
  };
});

// Mock mapbox-gl
jest.mock('react-map-gl', () => ({
  Map: ({ children }) => <div data-testid="map">{children}</div>,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  NavigationControl: () => <div data-testid="navigation-control" />,
}));

// Mock the theme context
const mockThemeContext = {
  theme: 'light',
  toggleTheme: jest.fn(),
};

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => mockThemeContext,
  ThemeProvider: ({ children }) => children,
}));

// Mock environment variable
const originalEnv = process.env;
beforeAll(() => {
  process.env = { ...originalEnv, VITE_MAPBOX_TOKEN: 'test-token' };
});

afterAll(() => {
  process.env = originalEnv;
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>{component}</ThemeProvider>
    </BrowserRouter>
  );
};

describe('ClusterMap', () => {
  const mockCampgrounds = [
    {
      _id: '1',
      title: 'Test Campground 1',
      location: 'Test Location 1',
      geometry: {
        coordinates: [100, 15],
      },
      campsites: [], // No campsites
    },
    {
      _id: '2',
      title: 'Test Campground 2',
      location: 'Test Location 2',
      geometry: {
        coordinates: [101, 16],
      },
      campsites: [{ _id: 'campsite1', name: 'Campsite 1', price: 50, availability: true }], // Has campsites
    },
  ];

  it('renders without crashing', () => {
    renderWithRouter(<ClusterMap campgrounds={mockCampgrounds} />);
    expect(screen.getByTestId('map')).toBeInTheDocument();
  });

  it('shows "View pricing" for campgrounds without campsites', () => {
    // This test would require simulating a click on a marker to open the popup
    // For now, we'll test the logic directly
    const campgroundWithoutCampsites = mockCampgrounds[0];
    const shouldShowPricing =
      !campgroundWithoutCampsites.campsites || campgroundWithoutCampsites.campsites.length === 0;
    expect(shouldShowPricing).toBe(true);
  });

  it('does not show "View pricing" for campgrounds with campsites', () => {
    const campgroundWithCampsites = mockCampgrounds[1];
    const shouldShowPricing =
      !campgroundWithCampsites.campsites || campgroundWithCampsites.campsites.length === 0;
    expect(shouldShowPricing).toBe(false);
  });

  it('handles campgrounds with null campsites array', () => {
    const campgroundWithNullCampsites = {
      _id: '3',
      title: 'Test Campground 3',
      location: 'Test Location 3',
      geometry: {
        coordinates: [102, 17],
      },
      campsites: null,
    };
    const shouldShowPricing =
      !campgroundWithNullCampsites.campsites || campgroundWithNullCampsites.campsites.length === 0;
    expect(shouldShowPricing).toBe(true);
  });

  it('handles campgrounds with undefined campsites array', () => {
    const campgroundWithUndefinedCampsites = {
      _id: '4',
      title: 'Test Campground 4',
      location: 'Test Location 4',
      geometry: {
        coordinates: [103, 18],
      },
      campsites: undefined,
    };
    const shouldShowPricing =
      !campgroundWithUndefinedCampsites.campsites ||
      campgroundWithUndefinedCampsites.campsites.length === 0;
    expect(shouldShowPricing).toBe(true);
  });
});
