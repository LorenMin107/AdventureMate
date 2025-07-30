import { render, screen } from '../../test-utils';
import { useAuth } from '../../context/AuthContext';
import CampgroundNewPage from '../CampgroundNewPage';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the CampgroundForm component
jest.mock('../../components/CampgroundForm', () => ({
  __esModule: true,
  default: () => <div data-testid="campground-form">Campground Form</div>,
}));

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('CampgroundNewPage', () => {
  test('redirects to login if user is not authenticated', () => {
    // Mock unauthenticated user
    useAuth.mockReturnValue({
      currentUser: null,
      isAuthenticated: false,
    });

    render(<CampgroundNewPage />);

    // The component should redirect, so we don't expect to see the form
    expect(screen.queryByTestId('campground-form')).not.toBeInTheDocument();
  });

  test('shows unauthorized message if user is not an admin', () => {
    // Mock authenticated but non-admin user
    useAuth.mockReturnValue({
      currentUser: { username: 'testuser', isAdmin: false },
      isAuthenticated: true,
    });

    render(<CampgroundNewPage />);

    // Should show unauthorized message
    expect(screen.getByText(/not authorized/i)).toBeInTheDocument();
    expect(screen.queryByTestId('campground-form')).not.toBeInTheDocument();
  });

  test('renders form for admin users', () => {
    // Mock authenticated admin user
    useAuth.mockReturnValue({
      currentUser: { username: 'admin', isAdmin: true },
      isAuthenticated: true,
    });

    render(<CampgroundNewPage />);

    // Should show the form
    expect(screen.getAllByText(/Create a New Campground/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId('campground-form')).toBeInTheDocument();
  });
});
