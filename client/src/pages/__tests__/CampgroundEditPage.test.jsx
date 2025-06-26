import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CampgroundEditPage from '../CampgroundEditPage';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the CampgroundForm component
jest.mock('../../components/CampgroundForm', () => ({
  __esModule: true,
  default: ({ isEditing, campgroundId, initialData }) => (
    <div data-testid="campground-form">
      Campground Form (Editing: {isEditing ? 'yes' : 'no'}, ID: {campgroundId})
      <div data-testid="initial-data">{initialData?.title}</div>
    </div>
  )
}));

// Mock fetch
global.fetch = jest.fn();

describe('CampgroundEditPage', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Mock authenticated user by default
    useAuth.mockReturnValue({
      currentUser: { _id: 'user123', isAdmin: false },
      isAuthenticated: true
    });
  });

  test('redirects to login if user is not authenticated', () => {
    // Mock unauthenticated user
    useAuth.mockReturnValue({
      currentUser: null,
      isAuthenticated: false
    });
    
    render(
      <MemoryRouter initialEntries={['/campgrounds/123/edit']}>
        <Routes>
          <Route path="/campgrounds/:id/edit" element={<CampgroundEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // The component should redirect, so we don't expect to see the form
    expect(screen.queryByTestId('campground-form')).not.toBeInTheDocument();
  });
  
  test('shows loading state while fetching campground data', () => {
    // Mock a pending fetch request
    fetch.mockImplementationOnce(() => new Promise(() => {}));
    
    render(
      <MemoryRouter initialEntries={['/campgrounds/123/edit']}>
        <Routes>
          <Route path="/campgrounds/:id/edit" element={<CampgroundEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Should show loading state
    expect(screen.getByText(/loading campground data/i)).toBeInTheDocument();
  });
  
  test('shows error message if campground fetch fails', async () => {
    // Mock a failed fetch request
    fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    render(
      <MemoryRouter initialEntries={['/campgrounds/123/edit']}>
        <Routes>
          <Route path="/campgrounds/:id/edit" element={<CampgroundEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Should show error message after fetch fails
    await waitFor(() => {
      expect(screen.getByText(/failed to load campground/i)).toBeInTheDocument();
    });
  });
  
  test('shows unauthorized message if user is not the author or admin', async () => {
    // Mock successful fetch with a campground authored by someone else
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        campground: { 
          _id: '123', 
          title: 'Test Campground',
          author: { _id: 'otherUser456' } 
        } 
      })
    });
    
    render(
      <MemoryRouter initialEntries={['/campgrounds/123/edit']}>
        <Routes>
          <Route path="/campgrounds/:id/edit" element={<CampgroundEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Should show unauthorized message
    await waitFor(() => {
      expect(screen.getByText(/not authorized to edit/i)).toBeInTheDocument();
    });
  });
  
  test('renders form for campground author', async () => {
    // Mock successful fetch with a campground authored by the current user
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        campground: { 
          _id: '123', 
          title: 'Test Campground',
          author: { _id: 'user123' } 
        } 
      })
    });
    
    render(
      <MemoryRouter initialEntries={['/campgrounds/123/edit']}>
        <Routes>
          <Route path="/campgrounds/:id/edit" element={<CampgroundEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Should show the form with the campground data
    await waitFor(() => {
      expect(screen.getByText(/edit campground/i)).toBeInTheDocument();
      expect(screen.getByTestId('campground-form')).toBeInTheDocument();
      expect(screen.getByTestId('initial-data')).toHaveTextContent('Test Campground');
    });
  });
  
  test('renders form for admin user even if not the author', async () => {
    // Mock admin user
    useAuth.mockReturnValue({
      currentUser: { _id: 'admin789', isAdmin: true },
      isAuthenticated: true
    });
    
    // Mock successful fetch with a campground authored by someone else
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        campground: { 
          _id: '123', 
          title: 'Test Campground',
          author: { _id: 'otherUser456' } 
        } 
      })
    });
    
    render(
      <MemoryRouter initialEntries={['/campgrounds/123/edit']}>
        <Routes>
          <Route path="/campgrounds/:id/edit" element={<CampgroundEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Should show the form with the campground data
    await waitFor(() => {
      expect(screen.getByText(/edit campground/i)).toBeInTheDocument();
      expect(screen.getByTestId('campground-form')).toBeInTheDocument();
      expect(screen.getByTestId('initial-data')).toHaveTextContent('Test Campground');
    });
  });
});