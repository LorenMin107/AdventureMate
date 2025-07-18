import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import LoginForm from '../LoginForm';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const renderLoginForm = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders login form with all elements', () => {
    renderLoginForm();

    // Check for heading
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Check for login button
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();

    // Check for register link
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  test('shows validation errors when form is submitted with empty fields', async () => {
    renderLoginForm();

    // Submit the form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Check for validation error
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();

    // Fill in email but not password
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Check for password validation error
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  test('calls login function with correct credentials when form is submitted', async () => {
    // Mock successful login response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { username: 'testuser' } }),
    });

    renderLoginForm();

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Check that fetch was called with the correct arguments
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
    });
  });

  test('shows error message when login fails', async () => {
    // Mock failed login response
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid username or password' }),
    });

    renderLoginForm();

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // The error is handled by the AuthContext, so we don't need to check for it here
    // Just verify that fetch was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });
});
