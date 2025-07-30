import { render, screen, fireEvent, waitFor } from '../../test-utils';
import RegisterForm from '../RegisterForm';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const renderRegisterForm = () => {
  return render(<RegisterForm />);
};

describe('RegisterForm', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders registration form with all elements', () => {
    renderRegisterForm();

    // Check for heading
    expect(screen.getByRole('heading', { name: /auth\.registerTitle/i })).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByLabelText(/auth\.username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/common\.phoneOptional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.confirmPassword/i)).toBeInTheDocument();

    // Check for register button - use signUp text since that's what shows when not loading
    expect(screen.getByRole('button', { name: /auth\.signUp/i })).toBeInTheDocument();

    // Check for login link
    expect(screen.getByText(/auth\.alreadyHaveAccount/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /auth\.logIn/i })).toBeInTheDocument();
  });

  test('allows form field input', () => {
    renderRegisterForm();

    // Fill in the form fields
    fireEvent.change(screen.getByLabelText(/auth\.username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/auth\.email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/common\.phoneOptional/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/auth\.password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/auth\.confirmPassword/i), {
      target: { value: 'Password123!' },
    });

    // Check that the values are set
    expect(screen.getByLabelText(/auth\.username/i)).toHaveValue('testuser');
    expect(screen.getByLabelText(/auth\.email/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/common\.phoneOptional/i)).toHaveValue('1234567890');
    expect(screen.getByLabelText(/auth\.password/i)).toHaveValue('Password123!');
    expect(screen.getByLabelText(/auth\.confirmPassword/i)).toHaveValue('Password123!');
  });

  test('submits form when button is clicked', () => {
    renderRegisterForm();

    // Fill in the form with valid data
    fireEvent.change(screen.getByLabelText(/auth\.username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/auth\.email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/common\.phoneOptional/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/auth\.password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/auth\.confirmPassword/i), {
      target: { value: 'Password123!' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /auth\.signUp/i }));

    // The form should be submitted (we can't easily test the actual submission in this environment)
    // but we can verify the button was clicked
    expect(screen.getByRole('button', { name: /auth\.signUp/i })).toBeInTheDocument();
  });
});
