import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import BookingList from '../components/BookingList';
import apiClient from '../utils/api';
import './BookingsPage.css';

/**
 * BookingsPage displays a list of the user's bookings
 */
const BookingsPage = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/bookings');
        const data = response.data;
        setBookings(data.bookings || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser]);

  // Redirect admin users to the admin bookings page
  if (currentUser?.isAdmin) {
    return <Navigate to="/admin/bookings" replace />;
  }

  if (loading) {
    return <div className="bookings-page-loading">Loading your bookings...</div>;
  }

  if (error) {
    return <div className="bookings-page-error">{error}</div>;
  }

  return (
    <div className="bookings-page">
      <h1 className="bookings-page-title">My Bookings</h1>
      <BookingList initialBookings={bookings} />
    </div>
  );
};

export default BookingsPage;
