import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import './BookingList.css';

/**
 * BookingList component displays a list of bookings for the current user
 * 
 * @param {Object} props - Component props
 * @param {Array} props.initialBookings - Initial bookings data (optional)
 * @returns {JSX.Element} Booking list component
 */
const BookingList = ({ initialBookings = [] }) => {
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState(!initialBookings.length);
  const [error, setError] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();
  
  useEffect(() => {
    // If we have initial bookings, no need to fetch
    if (initialBookings.length > 0) {
      setBookings(initialBookings);
      setLoading(false);
      return;
    }
    
    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/bookings', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch bookings: ${response.status}`);
        }
        
        const data = await response.json();
        setBookings(data.bookings || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [initialBookings, isAuthenticated]);
  
  if (!isAuthenticated) {
    return (
      <div className="booking-list-login-message">
        Please <a href="/login">log in</a> to view your bookings.
      </div>
    );
  }
  
  if (loading) {
    return <div className="booking-list-loading">Loading bookings...</div>;
  }
  
  if (error) {
    return <div className="booking-list-error">{error}</div>;
  }
  
  if (bookings.length === 0) {
    return (
      <div className="booking-list-empty">
        <p>You don't have any bookings yet.</p>
        <Link to="/campgrounds" className="booking-list-browse-link">
          Browse Campgrounds
        </Link>
      </div>
    );
  }
  
  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="booking-list">
      <h2 className="booking-list-title">{currentUser.username}'s Bookings</h2>
      
      <div className="booking-list-table-container">
        <table className="booking-list-table">
          <thead>
            <tr>
              <th>Campground</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Days</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking._id} className="booking-list-item">
                <td className="booking-list-campground">
                  {booking.campground.title}
                </td>
                <td>{formatDate(booking.startDate)}</td>
                <td>{formatDate(booking.endDate)}</td>
                <td>{booking.totalDays}</td>
                <td className="booking-list-price">
                  ${booking.totalPrice.toFixed(2)}
                </td>
                <td>
                  <Link 
                    to={`/bookings/${booking._id}`} 
                    className="booking-list-view-button"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

BookingList.propTypes = {
  initialBookings: PropTypes.array
};

export default BookingList;