import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookingDetail from '../components/BookingDetail';
import apiClient from '../utils/api';
import './BookingDetailPage.css';

/**
 * BookingDetailPage displays details of a specific booking
 */
const BookingDetailPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(`/bookings/${id}`);
        const data = response.data;
        setBooking(data.booking);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, currentUser]);

  // Redirect admin users to the admin booking detail page
  if (currentUser?.isAdmin) {
    return <Navigate to={`/admin/bookings/${id}`} replace />;
  }

  if (loading) {
    return <div className="booking-detail-page-loading">Loading booking details...</div>;
  }

  if (error) {
    return <div className="booking-detail-page-error">{error}</div>;
  }

  if (!booking && !loading) {
    return <div className="booking-detail-page-not-found">Booking not found</div>;
  }

  return (
    <div className="booking-detail-page">
      <h1 className="booking-detail-page-title">Booking Details</h1>
      <BookingDetail initialBooking={booking} />
    </div>
  );
};

export default BookingDetailPage;
