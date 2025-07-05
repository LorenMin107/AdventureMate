import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import { Form, DateRangePicker, ErrorMessage, Input } from '../components/forms';
import { bookingSchema } from '../utils/validationSchemas';
import { logError } from '../utils/logger';
import 'react-datepicker/dist/react-datepicker.css';
import './CampsiteDetailPage.css';

/**
 * CampsiteDetailPage displays detailed information about a single campsite
 */
const CampsiteDetailPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [campsite, setCampsite] = useState(null);
  const [campground, setCampground] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [apiError, setApiError] = useState(null);
  const [guests, setGuests] = useState(1);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Fetch campsite data
  useEffect(() => {
    const fetchCampsite = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/campsites/${id}`);

        // With apiClient, the response is already parsed and in response.data
        const data = response.data;

        // Check if the response is in the standardized format
        const campsiteData = data.status && data.data ? data.data.campsite : data.campsite;

        if (!campsiteData) {
          throw new Error('Campsite data not found in response');
        }

        setCampsite(campsiteData);

        // Fetch the parent campground
        if (campsiteData.campground) {
          const campgroundId =
            typeof campsiteData.campground === 'object'
              ? campsiteData.campground._id
              : campsiteData.campground;

          const campgroundResponse = await apiClient.get(`/campgrounds/${campgroundId}`);

          // With apiClient, the response is already parsed and in response.data
          const campgroundData = campgroundResponse.data;

          // Check if the response is in the standardized format
          const campgroundInfo =
            campgroundData.status && campgroundData.data
              ? campgroundData.data.campground
              : campgroundData.campground;

          if (!campgroundInfo) {
            throw new Error('Campground data not found in response');
          }

          setCampground(campgroundInfo);
        }
      } catch (err) {
        logError('Error fetching campsite', err);
        setError('Failed to load campsite. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampsite();
  }, [id]);

  // Check if user is the owner of the campground
  const isOwner =
    currentUser &&
    campground &&
    (currentUser.isAdmin ||
      (campground.owner && currentUser._id === campground.owner._id) ||
      (campground.author && currentUser._id === campground.author._id));

  // Calculate tomorrow's date for min attribute
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Default values for the booking form
  const defaultValues = {
    startDate: '',
    endDate: '',
    guests: 1,
  };

  // Handle booking form submission
  const handleBookingSubmit = async (data) => {
    if (!currentUser) {
      throw new Error('You must be logged in to book a campsite');
    }

    try {
      setApiError(null);

      const response = await apiClient.post(`/bookings/${campground._id}/book`, {
        startDate: data.startDate,
        endDate: data.endDate,
        campsiteId: id, // Use the current campsite ID
        guests: parseInt(data.guests || guests, 10),
      });

      // With apiClient, the response is already parsed and in response.data
      const responseData = response.data;

      // Check if the response is in the standardized format
      const bookingData =
        responseData.status && responseData.data ? responseData.data : responseData;

      // Navigate to checkout page with booking data
      navigate('/bookings/checkout', {
        state: {
          booking: bookingData.booking,
          campground: bookingData.campground,
          campsite: campsite,
        },
      });

      return bookingData; // Return data to trigger success handling
    } catch (err) {
      logError('Error creating booking', err);
      // Set API-specific error with improved error handling for axios errors
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to create booking. Please try again later.';
      setApiError(errorMessage);
      // Re-throw to let Form component handle it
      throw new Error(errorMessage);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading campsite details...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!campsite) {
    return <div className="not-found-container">Campsite not found</div>;
  }

  const { name, description, features, price, capacity, images, availability } = campsite;

  return (
    <div className="campsite-detail-page">
      <div className="campsite-detail-header">
        <div className="header-content">
          <h1>{name}</h1>
          {campground && (
            <p className="campground-link">
              Part of (<Link to={`/campgrounds/${campground._id}`}>{campground.title}</Link>)
            </p>
          )}
        </div>

        {isOwner && (
          <div className="admin-actions">
            <Link to={`/campsites/${id}/edit`} className="edit-button">
              Edit
            </Link>
            <button
              onClick={() => navigate(`/campgrounds/${campground._id}`)}
              className="back-button"
            >
              Back to Campground
            </button>
          </div>
        )}
      </div>

      <div className="campsite-media-container">
        <div className="campsite-images">
          {images && images.length > 0 ? (
            <>
              <div className="main-image">
                <img
                  src={images[activeImageIndex].url}
                  alt={`${name} - Image ${activeImageIndex + 1}`}
                />
              </div>

              {images.length > 1 && (
                <div className="image-thumbnails">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <img src={image.url} alt={`${name} - Thumbnail ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-image">
              <p>No images available</p>
            </div>
          )}
        </div>
      </div>

      <div className="campsite-info-container">
        <div className="campsite-info">
          <div className="info-section">
            <h2>About this campsite</h2>
            <p className="description">{description}</p>
          </div>

          <div className="info-section">
            <h2>Features</h2>
            <div className="features-list">
              {features && features.length > 0 ? (
                features.map((feature, index) => (
                  <span key={index} className="feature-tag">
                    {feature}
                  </span>
                ))
              ) : (
                <p>No specific features listed</p>
              )}
            </div>
          </div>

          <div className="info-section">
            <h2>Details</h2>
            <div className="detail-item">
              <span className="detail-label">Price:</span>
              <span className="detail-value">${price} per night</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Capacity:</span>
              <span className="detail-value">
                {capacity} {capacity === 1 ? 'person' : 'people'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Availability:</span>
              <span className={`detail-value ${availability ? 'available' : 'unavailable'}`}>
                {availability ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>

          <div className="booking-section">
            {availability ? (
              <>
                <div className="price-display">
                  <span className="price">${price}</span>
                  <span className="price-unit">per night</span>
                </div>

                {currentUser ? (
                  showBookingForm ? (
                    <div className="booking-form-container">
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
                        onSubmit={handleBookingSubmit}
                        submitButtonText="Book Now"
                        showSubmitButton={true}
                        className="booking-form"
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

                        <div className="booking-form-guests">
                          <Input
                            type="number"
                            name="guests"
                            label="Number of Guests"
                            min="1"
                            max={campsite.capacity || 10}
                            defaultValue={1}
                            onChange={(e) => setGuests(parseInt(e.target.value, 10))}
                            className="booking-form-guests-field"
                          />
                        </div>

                        <div className="booking-form-price">
                          <p>Price: ${price} per night</p>
                        </div>

                        <button
                          type="button"
                          className="cancel-booking-button"
                          onClick={() => setShowBookingForm(false)}
                        >
                          Cancel
                        </button>
                      </Form>
                    </div>
                  ) : (
                    <button className="book-button" onClick={() => setShowBookingForm(true)}>
                      Book Now
                    </button>
                  )
                ) : (
                  <div className="login-to-book">
                    <Link to={`/login?redirect=/campsites/${id}`} className="book-button">
                      Log in to book
                    </Link>
                    <p className="login-message">You need to be logged in to book a campsite</p>
                  </div>
                )}
              </>
            ) : (
              <div className="unavailable-message">
                <p>This campsite is currently unavailable for booking</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="back-to-campground">
        {campground && (
          <Link to={`/campgrounds/${campground._id}`} className="back-link">
            &larr; Back to {campground.title}
          </Link>
        )}
      </div>
    </div>
  );
};

export default CampsiteDetailPage;
