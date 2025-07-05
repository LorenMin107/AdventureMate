import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import './BookingPaymentSuccessPage.css';

/**
 * BookingPaymentSuccessPage handles the successful payment callback from Stripe
 */
const BookingPaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Get session_id and campground_id from URL query parameters
  const sessionId = searchParams.get('session_id');
  const campgroundId = searchParams.get('campground_id');

  // Use a ref to track if payment has been processed to prevent multiple API calls
  const paymentProcessed = useRef(false);

  useEffect(() => {
    // Define the function to process payment
    const processPayment = async () => {
      // Skip if already processed or missing parameters
      if (paymentProcessed.current) {
        console.log('Payment already processed, skipping duplicate API call');
        return;
      }

      if (!sessionId || !campgroundId) {
        setError('Missing required parameters');
        setLoading(false);
        return;
      }

      // Mark as processed immediately to prevent concurrent calls
      paymentProcessed.current = true;
      console.log(`Processing payment for session_id: ${sessionId} at ${new Date().toISOString()}`);

      try {
        // Call API to process the payment and create the booking using apiClient
        const response = await apiClient.get(`/bookings/${campgroundId}/success?session_id=${sessionId}`);

        // With apiClient, the response data is already parsed
        const data = response.data;
        setBookingDetails(data.booking);
        console.log(`Payment processing completed successfully at ${new Date().toISOString()}`);

      } catch (err) {
        console.error('Error processing payment:', err);
        setError(err.message || 'Failed to process payment. Please contact support.');
        // Reset the flag if there was an error, allowing retry
        paymentProcessed.current = false;
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      processPayment();
    } else {
      // If user is not authenticated, wait a bit and try again
      // This handles cases where the auth state is still loading
      const timer = setTimeout(() => {
        if (currentUser && !paymentProcessed.current) {
          processPayment();
        } else if (!currentUser) {
          setError('You must be logged in to complete this booking');
          setLoading(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [sessionId, campgroundId, currentUser]);

  const handleViewBookings = () => {
    navigate('/bookings');
  };

  if (loading) {
    return (
      <div className="booking-payment-success-page">
        <div className="booking-payment-success-loading">
          <h2>Processing your payment...</h2>
          <p>Please wait while we confirm your booking.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-payment-success-page">
        <div className="booking-payment-success-error">
          <h2>Payment Error</h2>
          <p>{error}</p>
          <button 
            className="booking-payment-success-button"
            onClick={() => navigate('/campgrounds')}
          >
            Return to Campgrounds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-payment-success-page">
      <div className="booking-payment-success-content">
        <div className="booking-payment-success-header">
          <h1>Payment Successful!</h1>
          <p>Your booking has been confirmed.</p>
        </div>

        {bookingDetails && (
          <div className="booking-payment-success-details">
            <h2>Booking Details</h2>

            <div className="booking-payment-success-info">
              <div className="booking-payment-success-item">
                <span className="label">Campground:</span>
                <span className="value">{bookingDetails.campground.title}</span>
              </div>

              {bookingDetails.campsite && (
                <>
                  <div className="booking-payment-success-item">
                    <span className="label">Campsite:</span>
                    <span className="value">{bookingDetails.campsite.name}</span>
                  </div>

                  {bookingDetails.campsite.description && (
                    <div className="booking-payment-success-item">
                      <span className="label">Description:</span>
                      <span className="value description">{bookingDetails.campsite.description}</span>
                    </div>
                  )}

                  {bookingDetails.campsite.capacity && (
                    <div className="booking-payment-success-item">
                      <span className="label">Capacity:</span>
                      <span className="value">{bookingDetails.campsite.capacity} {bookingDetails.campsite.capacity === 1 ? 'person' : 'people'}</span>
                    </div>
                  )}

                  {bookingDetails.campsite.features && bookingDetails.campsite.features.length > 0 && (
                    <div className="booking-payment-success-item features-item">
                      <span className="label">Features:</span>
                      <div className="value features-list">
                        <ul>
                          {bookingDetails.campsite.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {bookingDetails.campsite.images && bookingDetails.campsite.images.length > 0 && (
                    <div className="booking-payment-success-campsite-image">
                      <img 
                        src={bookingDetails.campsite.images[0].url} 
                        alt={bookingDetails.campsite.name} 
                      />
                    </div>
                  )}

                  <div className="booking-payment-success-separator"></div>
                </>
              )}

              <div className="booking-payment-success-item">
                <span className="label">Check-in:</span>
                <span className="value">{new Date(bookingDetails.startDate).toLocaleDateString()}</span>
              </div>

              <div className="booking-payment-success-item">
                <span className="label">Check-out:</span>
                <span className="value">{new Date(bookingDetails.endDate).toLocaleDateString()}</span>
              </div>

              <div className="booking-payment-success-item">
                <span className="label">Duration:</span>
                <span className="value">{bookingDetails.totalDays} days</span>
              </div>

              <div className="booking-payment-success-item">
                <span className="label">Total Price:</span>
                <span className="value">${bookingDetails.totalPrice}</span>
              </div>
            </div>
          </div>
        )}

        <div className="booking-payment-success-actions">
          <button 
            className="booking-payment-success-button"
            onClick={handleViewBookings}
          >
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPaymentSuccessPage;
