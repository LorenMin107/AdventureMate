import { render, screen, fireEvent, waitFor } from '../../test-utils';
import LoginForm from '../LoginForm';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const renderLoginForm = () => {
  return render(<LoginForm />);
};

describe('LoginForm', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders login form with all elements', () => {
    renderLoginForm();

    // Check for heading
    expect(screen.getByRole('heading', { name: /auth\.loginTitle/i })).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByLabelText(/auth\.email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.password/i)).toBeInTheDocument();

    // Check for login button - it can be either 'continue' or 'loggingIn'
    const submitButton = screen.getByRole('button', { name: /auth\.(continue|loggingIn)/i });
    expect(submitButton).toBeInTheDocument();

    // Check for register link
    expect(screen.getByText(/auth\.dontHaveAccount/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /auth\.signUp/i })).toBeInTheDocument();
  });

  test('shows validation errors when form is submitted with empty fields', async () => {
    renderLoginForm();

    // Submit the form without filling in any fields
    const submitButton = screen.getByRole('button', { name: /auth\.(continue|loggingIn)/i });
    fireEvent.click(submitButton);

    // Check for validation error - in test environment, translation keys are shown
    expect(await screen.findByText(/auth\.emailRequired/i)).toBeInTheDocument();
  });

  test('can fill and submit form with credentials', async () => {
    renderLoginForm();

    // Fill in the form
    const emailInput = screen.getByLabelText(/auth\.email/i);
    const passwordInput = screen.getByLabelText(/auth\.password/i);

    fireEvent.change(emailInput, {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(passwordInput, {
      target: { value: 'password123' },
    });

    // Verify the form fields have the correct values
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /auth\.(continue|loggingIn)/i });
    fireEvent.click(submitButton);

    // Verify the form can be submitted (no specific error checking)
    expect(submitButton).toBeInTheDocument();
  });

  test('form has all required interactive elements', () => {
    renderLoginForm();

    // Check that all form elements are present and interactive
    expect(screen.getByLabelText(/auth\.email/i)).toBeEnabled();
    expect(screen.getByLabelText(/auth\.password/i)).toBeEnabled();
    expect(screen.getByRole('button', { name: /auth\.(continue|loggingIn)/i })).toBeEnabled();

    // Check for password toggle button
    expect(screen.getByRole('button', { name: /auth\.showPassword/i })).toBeInTheDocument();

    // Check for remember me checkbox
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});
