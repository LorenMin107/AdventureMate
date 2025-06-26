import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CampgroundForm from '../CampgroundForm';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('CampgroundForm', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  const mockInitialData = {
    _id: '123',
    title: 'Test Campground',
    location: 'Test Location',
    description: 'Test Description',
    price: 100,
    images: [
      { url: 'https://example.com/image1.jpg', filename: 'image1.jpg' }
    ]
  };

  test('renders form with initial data when editing', () => {
    render(
      <MemoryRouter>
        <CampgroundForm 
          isEditing={true} 
          campgroundId="123" 
          initialData={mockInitialData} 
        />
      </MemoryRouter>
    );
    
    // Check that form fields are populated with initial data
    expect(screen.getByLabelText(/title/i)).toHaveValue('Test Campground');
    expect(screen.getByLabelText(/location/i)).toHaveValue('Test Location');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Test Description');
    expect(screen.getByLabelText(/price/i)).toHaveValue('100');
    
    // Check that the submit button says "Update Campground"
    expect(screen.getByRole('button', { name: /update campground/i })).toBeInTheDocument();
  });

  test('renders empty form when creating new campground', () => {
    render(
      <MemoryRouter>
        <CampgroundForm isEditing={false} />
      </MemoryRouter>
    );
    
    // Check that form fields are empty
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/location/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/price/i)).toHaveValue('');
    
    // Check that the submit button says "Create Campground"
    expect(screen.getByRole('button', { name: /create campground/i })).toBeInTheDocument();
  });

  test('shows validation errors when submitting empty form', async () => {
    render(
      <MemoryRouter>
        <CampgroundForm isEditing={false} />
      </MemoryRouter>
    );
    
    // Submit the form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /create campground/i }));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/price is required/i)).toBeInTheDocument();
    });
    
    // Ensure fetch was not called
    expect(fetch).not.toHaveBeenCalled();
  });

  test('submits form data to API when creating new campground', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        campground: { ...mockInitialData, _id: 'new123' },
        message: 'Successfully created new campground'
      })
    });
    
    render(
      <MemoryRouter>
        <CampgroundForm isEditing={false} />
      </MemoryRouter>
    );
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Campground' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'New Location' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'New Description' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '200' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create campground/i }));
    
    // Check that fetch was called with the correct arguments
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/campgrounds', expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData)
      }));
    });
  });

  test('submits form data to API when updating campground', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        campground: { ...mockInitialData, title: 'Updated Campground' },
        message: 'Successfully updated campground'
      })
    });
    
    render(
      <MemoryRouter>
        <CampgroundForm 
          isEditing={true} 
          campgroundId="123" 
          initialData={mockInitialData} 
        />
      </MemoryRouter>
    );
    
    // Update the title
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Updated Campground' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update campground/i }));
    
    // Check that fetch was called with the correct arguments
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/campgrounds/123', expect.objectContaining({
        method: 'PUT',
        body: expect.any(FormData)
      }));
    });
  });

  test('shows error message when API request fails', async () => {
    // Mock failed API response
    fetch.mockRejectedValueOnce(new Error('API Error'));
    
    render(
      <MemoryRouter>
        <CampgroundForm 
          isEditing={true} 
          campgroundId="123" 
          initialData={mockInitialData} 
        />
      </MemoryRouter>
    );
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update campground/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to update campground/i)).toBeInTheDocument();
    });
  });
});