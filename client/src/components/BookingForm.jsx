import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { Form, DateRangePicker, ErrorMessage, Select, Input } from './forms';
import { bookingSchema } from '../utils/validationSchemas';
import './BookingForm.css';

/**
 * BookingForm component for creating a new booking
 * 
 * @param {Object} props - Component props
 * @param {Object} props.campground - Campground data
 * @returns {JSX.Element} Booking form component
 */
const BookingForm = ({ campground }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [apiError, setApiError] = useState(null);
  const [campsites, setCampsites] = useState([]);
  const [selectedCampsite, setSelectedCampsite] = useState(null);
  const [loadingCampsites, setLoadingCampsites] = useState(false);
  const [guests, setGuests] = useState(1);
  const [startingPrice, setStartingPrice] = useState(0);

  // Calculate tomorrow's date for min attribute
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];

  // Fetch campsites for the campground
  useEffect(() => {
    const fetchCampsites = async () => {
      if (!campground || !campground._id) return;

      setLoadingCampsites(true);
      try {
        const response = await fetch(`/api/v1/campgrounds/${campground._id}/campsites`);

        if (!response.ok) {
          throw new Error('Failed to fetch campsites');
        }

        const data = await response.json();

        // Check if the response is in the standardized format
        const campsitesData = data.status === 'success' && data.data 
          ? data.data.campsites 
          : data.campsites;

        // Filter out unavailable campsites
        const availableCampsites = campsitesData.filter(campsite => campsite.availability);

        setCampsites(availableCampsites);

        // Calculate starting price from available campsites
        if (availableCampsites.length > 0) {
          const minPrice = Math.min(...availableCampsites.map(campsite => campsite.price));
          setStartingPrice(minPrice);
        } else {
          // If no available campsites, set starting price to 0
          setStartingPrice(0);
        }
      } catch (err) {
        console.error('Error fetching campsites:', err);
        setApiError('Failed to load campsites. You can still book the campground without selecting a specific campsite.');
      } finally {
        setLoadingCampsites(false);
      }
    };

    fetchCampsites();
  }, [campground]);

  // Default values for the form
  const defaultValues = {
    startDate: '',
    endDate: '',
    guests: 1,
    campsiteId: ''
  };

  // Handle campsite selection
  const handleCampsiteChange = (campsiteId) => {
    const selected = campsites.find(campsite => campsite._id === campsiteId);
    setSelectedCampsite(selected);
  };

  const handleSubmit = async (data) => {
    if (!isAuthenticated) {
      throw new Error('You must be logged in to book a campground');
    }

    try {
      setApiError(null);

      const response = await fetch(`/api/bookings/${campground._id}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          startDate: data.startDate, 
          endDate: data.endDate,
          campsiteId: selectedCampsite ? selectedCampsite._id : null,
          guests: parseInt(data.guests || guests, 10)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Check if the error response is in the new standardized format
        const errorMessage = errorData.status === 'error' 
          ? errorData.error || errorData.message 
          : errorData.error || 'Failed to create booking';
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      // Check if the response is in the new standardized format
      const bookingData = responseData.status && responseData.data 
        ? responseData.data 
        : responseData;

      // Navigate to checkout page with booking data
      navigate('/bookings/checkout', { 
        state: { 
          booking: bookingData.booking,
          campground: bookingData.campground,
          campsite: selectedCampsite
        } 
      });

      return bookingData; // Return data to trigger success handling
    } catch (err) {
      console.error('Error creating booking:', err);
      // Set API-specific error
      setApiError(err.message || 'Failed to create booking. Please try again later.');
      // Re-throw to let Form component handle it
      throw err;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="booking-form-login-message">
        Please <a href="/login">log in</a> to book this campground.
      </div>
    );
  }

  return (
    <div className="booking-form">
      <h3 className="booking-form-title">Book Your Stay</h3>

      {apiError && (
        <ErrorMessage
          message={apiError}
          type="error"
          dismissible
          onDismiss={() => setApiError(null)}
        />
      )}

      <Form
        schema={bookingSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitButtonText="Book Now"
        showSubmitButton={true}
        className="booking-form-container"
      >
        <div className="booking-form-dates">
          <DateRangePicker
            startDateName="startDate"
            endDateName="endDate"
            label="Select Check-in and Check-out Dates"
            minDate={tomorrow}
            required
            className="booking-form-date-field"
          />
        </div>

        {campsites.length > 0 && (
          <div className="booking-form-campsites">
            <Select
              name="campsiteId"
              label="Select a Campsite (Optional)"
              options={campsites.map(campsite => ({
                value: campsite._id,
                label: `${campsite.name} - $${campsite.price}/night - Capacity: ${campsite.capacity}`
              }))}
              onChange={e => handleCampsiteChange(e.target.value)}
              placeholder="Choose a specific campsite"
              className="booking-form-campsite-field"
            />

            {selectedCampsite && (
              <div className="selected-campsite-info">
                <h4>{selectedCampsite.name}</h4>
                {selectedCampsite.description && <p>{selectedCampsite.description}</p>}
                {selectedCampsite.features && selectedCampsite.features.length > 0 && (
                  <div className="campsite-features">
                    <p>Features:</p>
                    <ul>
                      {selectedCampsite.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="booking-form-guests">
          <Input
            type="number"
            name="guests"
            label="Number of Guests"
            min="1"
            max={selectedCampsite ? selectedCampsite.capacity : 10}
            defaultValue={1}
            onChange={e => setGuests(parseInt(e.target.value, 10))}
            className="booking-form-guests-field"
          />
        </div>

        <div className="booking-form-price">
          <p>Price: ${selectedCampsite ? selectedCampsite.price : startingPrice} per night</p>
        </div>
      </Form>
    </div>
  );
};

BookingForm.propTypes = {
  campground: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  }).isRequired
};

export default BookingForm;
