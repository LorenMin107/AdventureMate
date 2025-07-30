import { render, screen, waitFor } from '../../test-utils';
import { useAuth } from '../../context/AuthContext';
import CampgroundEditPage from '../CampgroundEditPage';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the CampgroundForm component
jest.mock('../../components/CampgroundForm', () => ({
  __esModule: true,
  default: (props) => {
    console.log('CampgroundForm mock called with props:', props);
    return (
      <div data-testid="campground-form">
        Campground Form (Editing: {props.isEditing ? 'yes' : 'no'})
        <div data-testid="initial-data">{props.campground?.title}</div>
      </div>
    );
  },
}));

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '123' }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock the api client
jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('CampgroundEditPage', () => {
  let apiClient;

  beforeEach(() => {
    // Get the mocked API client
    apiClient = require('../../utils/api').default;

    // Mock authenticated user by default
    useAuth.mockReturnValue({
      currentUser: { _id: 'user123', isAdmin: false },
      isAuthenticated: true,
    });
  });

  test('redirects to login if user is not authenticated', () => {
    // Mock unauthenticated user
    useAuth.mockReturnValue({
      currentUser: null,
      isAuthenticated: false,
    });

    render(<CampgroundEditPage />);

    // The component should redirect, so we don't expect to see the form
    expect(screen.queryByTestId('campground-form')).not.toBeInTheDocument();
  });

  test('shows loading state while fetching campground data', () => {
    // Mock a pending fetch request
    apiClient.get.mockImplementationOnce(() => new Promise(() => {}));

    render(<CampgroundEditPage />);

    // Should show loading state
    expect(screen.getByText(/campgroundEdit.loading/i)).toBeInTheDocument();
  });

  test('shows error message if campground fetch fails', async () => {
    // Mock a failed fetch request
    apiClient.get.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<CampgroundEditPage />);

    // Should show error message after fetch fails
    await waitFor(() => {
      expect(screen.getByText(/campgroundEdit.errorLoading/i)).toBeInTheDocument();
    });
  });

  test('shows unauthorized message if user is not the author or admin', async () => {
    // Mock successful fetch with a campground authored by someone else
    apiClient.get.mockResolvedValueOnce({
      data: {
        campground: {
          _id: '123',
          title: 'Test Campground',
          author: { _id: 'otherUser456' },
        },
      },
    });

    render(<CampgroundEditPage />);

    // Should show unauthorized message
    await waitFor(() => {
      expect(screen.getByText(/campgroundEdit.notAuthorized/i)).toBeInTheDocument();
    });
  });

  test('renders form for campground author', async () => {
    // Mock successful fetch with a campground authored by the current user
    const mockResponse = {
      data: {
        campground: {
          _id: '123',
          title: 'Test Campground',
          author: { _id: 'user123' },
        },
      },
    };

    // Add debugging to see if the mock is called
    apiClient.get.mockImplementation((url) => {
      console.log('API mock called with:', url);
      return Promise.resolve(mockResponse);
    });

    render(<CampgroundEditPage />);

    // Debug: Check if the API was called
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/campgrounds/123');
    });

    // Should show the form with the campground data
    await waitFor(() => {
      expect(screen.getByTestId('campground-form')).toBeInTheDocument();
    });
  });

  test('renders form for admin user even if not the author', async () => {
    // Mock admin user
    useAuth.mockReturnValue({
      currentUser: { _id: 'admin789', isAdmin: true },
      isAuthenticated: true,
    });

    // Mock successful fetch with a campground authored by someone else
    apiClient.get.mockResolvedValueOnce({
      data: {
        campground: {
          _id: '123',
          title: 'Test Campground',
          author: { _id: 'otherUser456' },
        },
      },
    });

    render(<CampgroundEditPage />);

    // Should show the form with the campground data
    await waitFor(() => {
      expect(screen.getByTestId('campground-form')).toBeInTheDocument();
    });
  });
});
