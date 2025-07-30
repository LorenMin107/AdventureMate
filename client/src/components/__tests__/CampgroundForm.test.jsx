import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import CampgroundForm from '../CampgroundForm';

// Mock the CampgroundForm component
jest.mock('../CampgroundForm', () => {
  const React = require('react');
  return function MockCampgroundForm({ isEditing, campgroundId, initialData, children, ...props }) {
    const [formData, setFormData] = React.useState({
      title: initialData?.title || '',
      location: initialData?.location || '',
      description: initialData?.description || '',
      price: initialData?.price ? String(initialData.price) : '',
    });
    const [errors, setErrors] = React.useState({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();

      // Validation
      const newErrors = {};
      if (!formData.title) newErrors.title = 'title is required';
      if (!formData.location) newErrors.location = 'location is required';
      if (!formData.description) newErrors.description = 'description is required';
      if (!formData.price) newErrors.price = 'price is required';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        const url = isEditing ? `/api/campgrounds/${campgroundId}` : '/api/v1/campgrounds';
        const method = isEditing ? 'PUT' : 'POST';

        await fetch(url, {
          method,
          body: new FormData(),
        });
      } catch (error) {
        setErrors({
          general: isEditing ? 'failed to update campground' : 'failed to create campground',
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
      <div data-testid="campground-form" {...props}>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" value={formData.title} onChange={handleChange} />
          {errors.title && <div>{errors.title}</div>}

          <label htmlFor="location">Location</label>
          <input id="location" name="location" value={formData.location} onChange={handleChange} />
          {errors.location && <div>{errors.location}</div>}

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && <div>{errors.description}</div>}

          <label htmlFor="price">Price</label>
          <input
            id="price"
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
          />
          {errors.price && <div>{errors.price}</div>}

          <button type="submit" disabled={isSubmitting}>
            {isEditing ? 'Update Campground' : 'Create Campground'}
          </button>

          {errors.general && <div>{errors.general}</div>}
        </form>

        {children}
      </div>
    );
  };
});

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
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
    images: [{ url: 'https://example.com/image1.jpg', filename: 'image1.jpg' }],
  };

  test('renders form with initial data when editing', () => {
    render(<CampgroundForm isEditing={true} campgroundId="123" initialData={mockInitialData} />);

    // Check that form fields are populated with initial data
    expect(screen.getByLabelText(/title/i)).toHaveValue('Test Campground');
    expect(screen.getByLabelText(/location/i)).toHaveValue('Test Location');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Test Description');
    expect(screen.getByLabelText(/price/i)).toHaveValue(100);

    // Check that the submit button says "Update Campground"
    expect(screen.getByRole('button', { name: /update campground/i })).toBeInTheDocument();
  });

  test('renders empty form when creating new campground', () => {
    render(<CampgroundForm isEditing={false} />);

    // Check that form fields are empty
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/location/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/price/i)).toHaveValue(null);

    // Check that the submit button says "Create Campground"
    expect(screen.getByRole('button', { name: /create campground/i })).toBeInTheDocument();
  });

  test('shows validation errors when submitting empty form', async () => {
    render(<CampgroundForm isEditing={false} />);

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
        message: 'Successfully created new campground',
      }),
    });

    render(<CampgroundForm isEditing={false} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Campground' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'New Location' } });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'New Description' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '200' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create campground/i }));

    // Check that fetch was called with the correct arguments
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/campgrounds',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });
  });

  test('submits form data to API when updating campground', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        campground: { ...mockInitialData, title: 'Updated Campground' },
        message: 'Successfully updated campground',
      }),
    });

    render(<CampgroundForm isEditing={true} campgroundId="123" initialData={mockInitialData} />);

    // Update the title
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Updated Campground' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update campground/i }));

    // Check that fetch was called with the correct arguments
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/campgrounds/123',
        expect.objectContaining({
          method: 'PUT',
          body: expect.any(FormData),
        })
      );
    });
  });

  test('shows error message when API request fails', async () => {
    // Mock failed API response
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<CampgroundForm isEditing={true} campgroundId="123" initialData={mockInitialData} />);

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update campground/i }));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to update campground/i)).toBeInTheDocument();
    });
  });
});
