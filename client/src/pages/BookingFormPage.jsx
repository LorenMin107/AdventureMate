import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookingForm from '../components/BookingForm';
import './BookingFormPage.css';

/**
 * BookingFormPage displays a form to create a new booking for a specific campground
 */
const BookingFormPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [campground, setCampground] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCampground = async () => {
      try {
        const response = await fetch(`/api/campgrounds/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          // Check if the error response is in the new standardized format
          const errorMessage = errorData.status === 'error' 
            ? errorData.error || errorData.message 
            : `Failed to fetch campground: ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Check if the response is in the new standardized format
        const campgroundData = data.status && data.data ? data.data.campground : data.campground;

        if (!campgroundData) {
          throw new Error('Campground data not found in response');
        }

        setCampground(campgroundData);
      } catch (err) {
        console.error('Error fetching campground:', err);
        setError('Failed to load campground details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampground();
  }, [id]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate(`/login?redirect=/bookings/${id}/book`);
    }
  }, [currentUser, loading, navigate, id]);

  if (loading) {
    return <div className="booking-form-page-loading">Loading campground details...</div>;
  }

  if (error) {
    return <div className="booking-form-page-error">{error}</div>;
  }

  if (!campground) {
    return <div className="booking-form-page-not-found">Campground not found</div>;
  }

  return (
    <div className="booking-form-page">
      <h1 className="booking-form-page-title">Book {campground.title}</h1>
      <div className="booking-form-page-campground-info">
        <h2>{campground.title}</h2>
        <p className="location">{campground.location}</p>
        <p className="price">${campground.price} per night</p>
      </div>
      <BookingForm campground={campground} />
    </div>
  );
};

export default BookingFormPage;
