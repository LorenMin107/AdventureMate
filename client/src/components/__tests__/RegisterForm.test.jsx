import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import RegisterForm from '../RegisterForm';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const renderRegisterForm = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('RegisterForm', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders registration form with all elements', () => {
    renderRegisterForm();

    // Check for heading
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

    // Check for register button
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();

    // Check for login link
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  test('shows validation errors when form is submitted with empty fields', async () => {
    renderRegisterForm();

    // Submit the form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for validation error
    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();

    // Fill in username but not email
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for email validation error
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  test('validates email format', async () => {
    renderRegisterForm();

    // Fill in username and invalid email
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for email format validation error
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  test('validates password length', async () => {
    renderRegisterForm();

    // Fill in username, email, and short password
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: '12345' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for password length validation error
    expect(
      await screen.findByText(/password must be at least 6 characters long/i)
    ).toBeInTheDocument();
  });

  test('validates password confirmation', async () => {
    renderRegisterForm();

    // Fill in username, email, and mismatched passwords
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password456' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for password confirmation validation error
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('calls register function with correct data when form is submitted', async () => {
    // Mock successful registration response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { username: 'testuser' } }),
    });

    renderRegisterForm();

    // Fill in the form with valid data
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check that fetch was called with the correct arguments
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            phone: '1234567890',
          }),
        })
      );
    });
  });
});
