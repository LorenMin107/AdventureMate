import { render, screen } from '../../test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => {
  const originalModule = jest.requireActual('../../context/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn(),
  };
});

// Test component for protected routes
const ProtectedComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;
const HomeComponent = () => <div>Home Page</div>;

const renderProtectedRoute = (requireAdmin = false) => {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<LoginComponent />} />
        <Route path="/" element={<HomeComponent />} />
        <Route element={<ProtectedRoute requireAdmin={requireAdmin} />}>
          <Route path="/protected" element={<ProtectedComponent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  test('shows loading state when authentication is loading', () => {
    // Mock loading state
    useAuth.mockReturnValue({
      loading: true,
      isAuthenticated: false,
      currentUser: null,
    });

    renderProtectedRoute();

    // Check for loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('redirects to login page when user is not authenticated', () => {
    // Mock unauthenticated state
    useAuth.mockReturnValue({
      loading: false,
      isAuthenticated: false,
      currentUser: null,
    });

    renderProtectedRoute();

    // Check that we're redirected to login page
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  test('renders protected content when user is authenticated', () => {
    // Mock authenticated state with verified email
    useAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      currentUser: { username: 'testuser', isEmailVerified: true },
    });

    renderProtectedRoute();

    // Check that protected content is rendered
    expect(screen.getByText(/protected content/i)).toBeInTheDocument();
  });

  test('redirects to home page when admin route is accessed by non-admin user', () => {
    // Mock authenticated but non-admin state
    useAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      currentUser: { username: 'testuser', isAdmin: false },
    });

    renderProtectedRoute(true); // requireAdmin = true

    // Check that we're redirected to home page
    expect(screen.getByText(/home page/i)).toBeInTheDocument();
  });

  test('renders admin content when admin user accesses admin route', () => {
    // Mock authenticated admin state with verified email
    useAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      currentUser: { username: 'admin', isAdmin: true, isEmailVerified: true },
    });

    renderProtectedRoute(true); // requireAdmin = true

    // Check that protected content is rendered
    expect(screen.getByText(/protected content/i)).toBeInTheDocument();
  });
});
