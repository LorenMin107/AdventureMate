import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { Form, DatePicker, ErrorMessage } from './forms';
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

  // Calculate tomorrow's date for min attribute
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];

  // Default values for the form
  const defaultValues = {
    startDate: '',
    endDate: ''
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
          endDate: data.endDate 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const responseData = await response.json();

      // Navigate to checkout page with booking data
      navigate('/bookings/checkout', { 
        state: { 
          booking: responseData.booking,
          campground: responseData.campground
        } 
      });

      return responseData; // Return data to trigger success handling
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
          <DatePicker
            name="startDate"
            label="Check-in Date"
            min={tomorrowString}
            required
            className="booking-form-date-field"
          />

          <DatePicker
            name="endDate"
            label="Check-out Date"
            min={tomorrowString}
            required
            className="booking-form-date-field"
          />
        </div>

        <div className="booking-form-price">
          <p>Price: ${campground.price} per night</p>
        </div>
      </Form>
    </div>
  );
};

BookingForm.propTypes = {
  campground: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired
  }).isRequired
};

export default BookingForm;
