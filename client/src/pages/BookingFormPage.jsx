import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookingForm from '../components/BookingForm';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
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
  const [startingPrice, setStartingPrice] = useState(0);
  const [loadingCampsites, setLoadingCampsites] = useState(false);

  useEffect(() => {
    const fetchCampground = async () => {
      try {
        const response = await apiClient.get(`/campgrounds/${id}`);

        // Handle the ApiResponse format
        const responseData = response.data;
        const data = responseData.data || responseData; // Handle both ApiResponse format and direct data
        const campgroundData = data.campground;

        if (!campgroundData) {
          throw new Error('Campground data not found in response');
        }

        setCampground(campgroundData);
      } catch (err) {
        logError('Error fetching campground', err);
        setError('Failed to load campground details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampground();
  }, [id]);

  // Fetch campsites and calculate starting price
  useEffect(() => {
    if (!campground || !campground._id) return;

    const fetchCampsites = async () => {
      setLoadingCampsites(true);
      try {
        const response = await apiClient.get(`/campgrounds/${campground._id}/campsites`);

        // Handle the ApiResponse format
        const responseData = response.data;
        const data = responseData.data || responseData; // Handle both ApiResponse format and direct data
        const campsitesData = data.campsites;

        if (!campsitesData) {
          throw new Error('Campsites data not found in response');
        }

        // Filter available campsites
        const availableCampsites = campsitesData.filter((campsite) => campsite.availability);

        // Calculate the starting price from available campsites
        if (availableCampsites.length > 0) {
          const minPrice = Math.min(...availableCampsites.map((campsite) => campsite.price));
          setStartingPrice(minPrice);
        }
      } catch (err) {
        logError('Error fetching campsites', err);
      } finally {
        setLoadingCampsites(false);
      }
    };

    fetchCampsites();
  }, [campground]);

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
        <p className="price">
          {loadingCampsites ? (
            <span className="loading-price">Loading price...</span>
          ) : startingPrice > 0 ? (
            <>
              Starting from <span className="price-amount">${startingPrice}</span> per night
            </>
          ) : (
            <span className="no-price">Contact for pricing</span>
          )}
        </p>
      </div>
      <BookingForm campground={campground} />
    </div>
  );
};

export default BookingFormPage;
