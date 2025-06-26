import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './BookingCheckoutPage.css';

/**
 * BookingCheckoutPage displays the checkout page for a booking
 */
const BookingCheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get booking data from location state
  const bookingData = location.state?.booking;
  const campgroundData = location.state?.campground;
  
  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData || !campgroundData) {
      navigate('/bookings');
    }
  }, [bookingData, campgroundData, navigate]);
  
  // Calculate total price
  const totalPrice = bookingData?.totalPrice || 0;
  
  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bookings/${campgroundData.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          totalDays: bookingData.totalDays,
          totalPrice: bookingData.totalPrice
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const data = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = data.sessionUrl;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Failed to create checkout session. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!bookingData || !campgroundData) {
    return <div className="booking-checkout-page-loading">Redirecting...</div>;
  }
  
  return (
    <div className="booking-checkout-page">
      <h1 className="booking-checkout-page-title">Checkout</h1>
      
      <div className="booking-checkout-page-summary">
        <h2>Booking Summary</h2>
        
        <div className="booking-checkout-page-campground">
          <h3>{campgroundData.title}</h3>
          <p className="location">{campgroundData.location}</p>
        </div>
        
        <div className="booking-checkout-page-details">
          <div className="detail-item">
            <span className="detail-label">Check-in:</span>
            <span className="detail-value">{new Date(bookingData.startDate).toLocaleDateString()}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Check-out:</span>
            <span className="detail-value">{new Date(bookingData.endDate).toLocaleDateString()}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Duration:</span>
            <span className="detail-value">{bookingData.totalDays} days</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Price per night:</span>
            <span className="detail-value">${campgroundData.price}</span>
          </div>
          
          <div className="detail-item total">
            <span className="detail-label">Total:</span>
            <span className="detail-value">${totalPrice}</span>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="booking-checkout-page-error">
          {error}
        </div>
      )}
      
      <div className="booking-checkout-page-actions">
        <button 
          className="booking-checkout-page-button cancel"
          onClick={() => navigate(`/campgrounds/${campgroundData.id}`)}
        >
          Cancel
        </button>
        
        <button 
          className="booking-checkout-page-button checkout"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </div>
    </div>
  );
};

export default BookingCheckoutPage;