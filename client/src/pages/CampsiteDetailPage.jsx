import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import { Form, DateRangePicker, ErrorMessage, Input } from '../components/forms';
import { bookingSchema } from '../utils/validationSchemas';
import { logError } from '../utils/logger';
import SafetyAlertList from '../components/SafetyAlertList';
import SafetyAlertForm from '../components/SafetyAlertForm';
import {
  checkSafetyAlertAcknowledgments,
  getUnacknowledgedAlertsMessage,
} from '../utils/safetyAlertUtils';
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
  const [safetyAlerts, setSafetyAlerts] = useState([]);
  const [showSafetyAlertForm, setShowSafetyAlertForm] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);

  // Calculate total price based on selected dates and guests
  const calculateTotalPrice = () => {
    if (!selectedStartDate || !selectedEndDate || !campsite?.price) {
      return { totalNights: 0, totalPrice: 0 };
    }

    const start = new Date(selectedStartDate);
    const end = new Date(selectedEndDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // For now, we'll use the same price per night regardless of guests
    // You can modify this logic if you want different pricing per guest
    const totalPrice = nights * campsite.price;

    return { totalNights: nights, totalPrice };
  };

  const { totalNights, totalPrice } = calculateTotalPrice();

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

  // Fetch all safety alerts that require acknowledgment for both campsite and parent campground
  const fetchAllAcknowledgmentAlerts = async () => {
    console.log('fetchAllAcknowledgmentAlerts called with id:', id);
    if (!id) return;

    try {
      // Fetch campsite data to get parent campground ID
      const campsiteResponse = await apiClient.get(`/campsites/${id}`);
      const campsiteData =
        campsiteResponse.data.status && campsiteResponse.data.data
          ? campsiteResponse.data.data.campsite
          : campsiteResponse.data.campsite;
      const parentCampgroundId =
        typeof campsiteData.campground === 'object'
          ? campsiteData.campground._id
          : campsiteData.campground;
      console.log('Campsite data:', campsiteData);
      console.log('Parent Campground ID:', parentCampgroundId);

      // Fetch all alerts for the campsite
      const campsiteAlertsResponse = await apiClient.get(
        `/campsite-safety-alerts/${id}/safety-alerts`,
        {
          params: { _t: Date.now() },
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        }
      );
      console.log('Raw campsite alerts response:', campsiteAlertsResponse.data);
      const campsiteAlerts = (campsiteAlertsResponse.data.data?.alerts || []).filter(
        (a) => a.requiresAcknowledgement
      );
      console.log(
        'Campsite Alerts (filtered):',
        campsiteAlerts.map((a) => ({
          id: a._id,
          title: a.title,
          requiresAcknowledgement: a.requiresAcknowledgement,
        }))
      );

      // Fetch all alerts for the parent campground
      let campgroundAlerts = [];
      if (parentCampgroundId) {
        const campgroundAlertsResponse = await apiClient.get(
          `/campgrounds/${parentCampgroundId}/safety-alerts`,
          {
            params: { _t: Date.now() },
            headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          }
        );
        console.log('Raw campground alerts response:', campgroundAlertsResponse.data);
        campgroundAlerts = (campgroundAlertsResponse.data.data?.alerts || []).filter(
          (a) => a.requiresAcknowledgement
        );
        console.log(
          'Campground Alerts (filtered):',
          campgroundAlerts.map((a) => ({
            id: a._id,
            title: a.title,
            requiresAcknowledgement: a.requiresAcknowledgement,
          }))
        );
      }

      // Merge and deduplicate alerts by _id
      const allAlertsMap = {};
      [...campsiteAlerts, ...campgroundAlerts].forEach((alert) => {
        allAlertsMap[alert._id] = alert;
      });
      const mergedAlerts = Object.values(allAlertsMap);
      console.log(
        'Merged Alerts:',
        mergedAlerts.map((a) => ({ id: a._id, title: a.title }))
      );
      console.log('Final alerts count:', mergedAlerts.length);
      setSafetyAlerts(mergedAlerts);
    } catch (err) {
      console.error('Error in fetchAllAcknowledgmentAlerts:', err);
      logError('Error fetching all acknowledgment safety alerts', err);
      setSafetyAlerts([]);
    }
  };

  // Initial fetch of all acknowledgment alerts
  useEffect(() => {
    fetchAllAcknowledgmentAlerts();
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

    // Check safety alert acknowledgments before submitting
    const { hasAcknowledgedAll, unacknowledgedAlerts } = checkSafetyAlertAcknowledgments(
      safetyAlerts,
      currentUser
    );

    if (!hasAcknowledgedAll) {
      const message = getUnacknowledgedAlertsMessage(unacknowledgedAlerts);
      setApiError(message);
      // Don't throw error - let the parent handle it
      return;
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
      // Don't throw error - let the parent handle it
      return;
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
      {/* Header Section */}
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

      {/* Main Content Area - Two Column Layout */}
      <div className="campsite-main-content">
        {/* Left Column - Content */}
        <div className="campsite-content-column">
          {/* Media Section */}
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

          {/* Information Sections */}
          <div className="campsite-info-sections">
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

            {/* Safety Alerts Section */}
            <div className="safety-alerts-section">
              <div className="safety-alerts-header">
                <h2>Safety Alerts</h2>
                {isOwner && (
                  <button
                    className="add-safety-alert-button"
                    onClick={() => setShowSafetyAlertForm(!showSafetyAlertForm)}
                  >
                    {showSafetyAlertForm ? 'Cancel' : 'Add Safety Alert'}
                  </button>
                )}
              </div>

              {showSafetyAlertForm && isOwner && (
                <SafetyAlertForm
                  entityId={id}
                  entityType="campsite"
                  onAlertSubmitted={() => {
                    setShowSafetyAlertForm(false);
                    // Refresh the alerts list
                    window.location.reload();
                  }}
                />
              )}

              <SafetyAlertList
                entityId={id}
                entityType="campsite"
                initialAlerts={safetyAlerts}
                onAlertDeleted={() => {
                  // Refresh the alerts list
                  fetchAllAcknowledgmentAlerts();
                }}
                onAlertAcknowledged={() => {
                  // Refresh the safety alerts to update the acknowledgment status
                  fetchAllAcknowledgmentAlerts();
                }}
                showActiveOnly={false}
                showAllForAcknowledgment={true}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Booking Section */}
        <div className="campsite-booking-column">
          <div className="booking-section">
            {availability ? (
              <>
                <div className="price-display">
                  <span className="price">${campsite?.price || 0}</span>
                  <span className="price-unit">per night</span>
                </div>

                {currentUser ? (
                  showBookingForm ? (
                    <div className="campsite-booking-form-container">
                      {/* Show only one error message at a time - prioritize safety alerts */}
                      {(() => {
                        const { hasAcknowledgedAll, unacknowledgedAlerts } =
                          checkSafetyAlertAcknowledgments(safetyAlerts, currentUser);
                        const hasRequiredAlerts = safetyAlerts.some(
                          (alert) => alert.requiresAcknowledgement
                        );

                        // Show safety alert warning if there are unacknowledged alerts
                        if (hasRequiredAlerts && !hasAcknowledgedAll) {
                          return (
                            <div className="campsite-booking-safety-warning">
                              <div className="safety-warning-header">
                                <span className="safety-warning-icon">⚠️</span>
                                <h4>Safety Alert Required</h4>
                              </div>
                              <p>{getUnacknowledgedAlertsMessage(unacknowledgedAlerts)}</p>
                              <p className="safety-warning-note">
                                Please review and acknowledge all safety alerts before proceeding
                                with your booking.
                              </p>
                            </div>
                          );
                        }

                        // Show API error only if no safety alert issues
                        if (apiError) {
                          return (
                            <ErrorMessage
                              message={apiError}
                              type="error"
                              dismissible
                              onDismiss={() => setApiError(null)}
                            />
                          );
                        }

                        return null;
                      })()}

                      <Form
                        schema={bookingSchema}
                        defaultValues={defaultValues}
                        onSubmit={handleBookingSubmit}
                        submitButtonText="Book Now"
                        showSubmitButton={true}
                        className="campsite-booking-form"
                        errorMessage="" // Prevent Form component from showing its own error
                      >
                        <div className="campsite-booking-dates">
                          <DateRangePicker
                            startDateName="startDate"
                            endDateName="endDate"
                            label="Select Check-in and Check-out Dates"
                            minDate={tomorrow}
                            required
                            className="campsite-booking-date-field"
                            onStartDateChange={(date) => setSelectedStartDate(date)}
                            onEndDateChange={(date) => setSelectedEndDate(date)}
                          />
                        </div>

                        <div className="campsite-booking-guests">
                          <Input
                            type="number"
                            name="guests"
                            label="Number of Guests"
                            min="1"
                            max={campsite.capacity || 10}
                            defaultValue={1}
                            onChange={(e) => setGuests(parseInt(e.target.value, 10))}
                            className="campsite-booking-guests-field"
                          />
                        </div>

                        <div className="campsite-booking-price">
                          <div className="price-breakdown">
                            <div className="price-line">
                              <span>Price per night:</span>
                              <span>${campsite?.price || 0}</span>
                            </div>
                            {totalNights > 0 && (
                              <>
                                <div className="price-line">
                                  <span>Number of nights:</span>
                                  <span>{totalNights}</span>
                                </div>
                                <div className="price-line total">
                                  <span>Total:</span>
                                  <span>${totalPrice}</span>
                                </div>
                              </>
                            )}
                          </div>
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

      {/* Back to Campground Link */}
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
