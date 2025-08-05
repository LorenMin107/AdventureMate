import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Form, DateRangePicker, ErrorMessage, Select, Input } from './forms';
import { bookingSchema } from '../utils/validationSchemas';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import {
  checkSafetyAlertAcknowledgments,
  checkAllSafetyAlertAcknowledgments,
  getUnacknowledgedAlertsMessage,
} from '../utils/safetyAlertUtils';
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
  const { t } = useTranslation();
  const { isAuthenticated, currentUser } = useAuth();
  const [apiError, setApiError] = useState(null);
  const [campsites, setCampsites] = useState([]);
  const [selectedCampsite, setSelectedCampsite] = useState(null);
  const [loadingCampsites, setLoadingCampsites] = useState(false);
  const [guests, setGuests] = useState(1);
  const [startingPrice, setStartingPrice] = useState(0);
  const [excludeDates, setExcludeDates] = useState([]);
  const [safetyAlerts, setSafetyAlerts] = useState([]);
  const [campsiteSafetyAlerts, setCampsiteSafetyAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Calculate tomorrow's date for min attribute
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];

  // State for selected dates
  const [selectedDates, setSelectedDates] = useState({ startDate: '', endDate: '' });

  // Fetch campsites for the campground
  const fetchCampsites = async (startDate = '', endDate = '') => {
    if (!campground || !campground._id) return;

    setLoadingCampsites(true);
    try {
      // Add date parameters to the request if they are provided
      let url = `/campgrounds/${campground._id}/campsites`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }

      // Use apiClient to make the request
      const response = await apiClient.get(url.replace('/api/v1', ''));
      const data = response.data;

      // Check if the response is in the standardized format
      const campsitesData =
        data.status === 'success' && data.data ? data.data.campsites : data.campsites;

      // Filter out unavailable campsites
      const availableCampsites = campsitesData.filter((campsite) => {
        // If dates are selected, check if the campsite has any booked dates that overlap
        if (startDate && endDate) {
          // The backend should already filter out unavailable campsites based on dates
          return campsite.availability;
        } else {
          // If no dates are selected, just check the general availability
          return campsite.availability;
        }
      });

      setCampsites(availableCampsites);
      setSelectedCampsite(null); // Reset selected campsite when dates change

      // Calculate starting price from available campsites
      if (availableCampsites.length > 0) {
        const minPrice = Math.min(...availableCampsites.map((campsite) => campsite.price));
        setStartingPrice(minPrice);
      } else {
        // If no available campsites, set starting price to 0
        setStartingPrice(0);
      }

      // Extract booked dates from all campsites to disable them in the date picker
      const allBookedDates = [];
      campsitesData.forEach((campsite) => {
        if (campsite.bookedDates && campsite.bookedDates.length > 0) {
          campsite.bookedDates.forEach((booking) => {
            // Generate all dates between start and end date
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            const currentDate = new Date(start);

            while (currentDate <= end) {
              allBookedDates.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + 1);
            }
          });
        }
      });

      // Update the excludeDates state with all booked dates
      setExcludeDates(allBookedDates);
    } catch (err) {
      logError('Error fetching campsites', err);
      setApiError(
        'Failed to load campsites. You can still book the campground without selecting a specific campsite.'
      );
    } finally {
      setLoadingCampsites(false);
    }
  };

  // Fetch safety alerts for the campground
  const fetchSafetyAlerts = async () => {
    if (!campground || !campground._id) return;

    setLoadingAlerts(true);
    try {
      const response = await apiClient.get(`/campgrounds/${campground._id}/safety-alerts/active`, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        params: {
          _t: Date.now(),
        },
      });

      const responseData = response.data;
      const alerts = responseData.data?.alerts || [];
      setSafetyAlerts(alerts);
    } catch (err) {
      logError('Error fetching safety alerts', err);
      // Don't show error to user, just set empty array
      setSafetyAlerts([]);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Fetch safety alerts for a specific campsite
  const fetchCampsiteSafetyAlerts = async (campsiteId) => {
    if (!campsiteId) {
      setCampsiteSafetyAlerts([]);
      return;
    }

    try {
      const response = await apiClient.get(
        `/campsite-safety-alerts/${campsiteId}/safety-alerts/active`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          params: {
            _t: Date.now(),
          },
        }
      );

      const responseData = response.data;
      const alerts = responseData.data?.alerts || [];
      setCampsiteSafetyAlerts(alerts);
    } catch (err) {
      logError('Error fetching campsite safety alerts', err);
      // Don't show error to user, just set empty array
      setCampsiteSafetyAlerts([]);
    }
  };

  // Initial fetch of campsites and safety alerts
  useEffect(() => {
    fetchCampsites();
    fetchSafetyAlerts();
  }, [campground]);

  // Function to refresh safety alerts (can be called after acknowledgment)
  const refreshSafetyAlerts = () => {
    fetchSafetyAlerts();
    if (selectedCampsite) {
      fetchCampsiteSafetyAlerts(selectedCampsite._id);
    }
  };

  // Handle date change to fetch available campsites for the selected dates
  const handleDateChange = (name, value) => {
    const newDates = { ...selectedDates, [name]: value };
    setSelectedDates(newDates);

    // If both dates are selected, fetch available campsites for those dates
    if (newDates.startDate && newDates.endDate) {
      fetchCampsites(newDates.startDate, newDates.endDate);
    }
  };

  // Default values for the form
  const defaultValues = {
    startDate: '',
    endDate: '',
    guests: 1,
    campsiteId: '',
  };

  // Handle campsite selection
  const handleCampsiteChange = (campsiteId) => {
    const selected = campsites.find((campsite) => campsite._id === campsiteId);
    setSelectedCampsite(selected);

    // Fetch safety alerts for the selected campsite
    if (selected) {
      fetchCampsiteSafetyAlerts(selected._id);
    } else {
      setCampsiteSafetyAlerts([]);
    }
  };

  const handleSubmit = async (data) => {
    if (!isAuthenticated) {
      throw new Error(t('bookings.loginRequiredError'));
    }

    // Check safety alert acknowledgments for both campground and campsite
    const { hasAcknowledgedAll, unacknowledgedAlerts } = checkAllSafetyAlertAcknowledgments(
      safetyAlerts,
      campsiteSafetyAlerts,
      currentUser
    );

    if (!hasAcknowledgedAll) {
      const message = getUnacknowledgedAlertsMessage(unacknowledgedAlerts);
      setApiError(message);
      throw new Error(message);
    }

    try {
      setApiError(null);

      const response = await apiClient.post(`/bookings/${campground._id}/book`, {
        startDate: data.startDate,
        endDate: data.endDate,
        campsiteId: selectedCampsite ? selectedCampsite._id : null,
        guests: parseInt(data.guests || guests, 10),
      });

      const responseData = response.data;

      // Check if the response is in the new standardized format
      const bookingData =
        responseData.status && responseData.data ? responseData.data : responseData;

      // Navigate to checkout page with booking data
      navigate('/bookings/checkout', {
        state: {
          booking: bookingData.booking,
          campground: bookingData.campground,
          campsite: selectedCampsite,
        },
      });

      return bookingData; // Return data to trigger success handling
    } catch (err) {
      logError('Error creating booking', err);
      // Set API-specific error
      setApiError(err.message || t('bookings.createBookingError'));
      // Re-throw to let Form component handle it
      throw err;
    }
  };

  if (!isAuthenticated) {
    return <div className="booking-form-login-message">{t('bookings.loginRequired')}</div>;
  }

  // Check if there are safety alerts requiring acknowledgment
  const { hasAcknowledgedAll, unacknowledgedAlerts } = checkAllSafetyAlertAcknowledgments(
    safetyAlerts,
    campsiteSafetyAlerts,
    currentUser
  );

  const hasRequiredAlerts =
    safetyAlerts.some((alert) => alert.requiresAcknowledgement) ||
    campsiteSafetyAlerts.some((alert) => alert.requiresAcknowledgement);

  // Debug logging for safety alert acknowledgment status
  console.log('Safety Alert Debug Info:', {
    safetyAlertsCount: safetyAlerts.length,
    campsiteSafetyAlertsCount: campsiteSafetyAlerts.length,
    hasAcknowledgedAll,
    unacknowledgedAlertsCount: unacknowledgedAlerts.length,
    unacknowledgedAlerts: unacknowledgedAlerts.map((alert) => ({
      id: alert._id,
      title: alert.title,
      acknowledgedBy: alert.acknowledgedBy,
    })),
  });

  return (
    <div className="booking-form">
      <h3 className="booking-form-title">{t('bookings.bookYourStay')}</h3>

      {apiError && (
        <ErrorMessage
          message={apiError}
          type="error"
          dismissible
          onDismiss={() => setApiError(null)}
        />
      )}

      {hasRequiredAlerts && !hasAcknowledgedAll && (
        <div className="booking-form-safety-warning">
          <div className="safety-warning-header">
            <span className="safety-warning-icon">⚠️</span>
            <h4>{t('bookings.safetyAlertRequired')}</h4>
          </div>
          <p>{getUnacknowledgedAlertsMessage(unacknowledgedAlerts)}</p>
          <p className="safety-warning-note">{t('bookings.reviewSafetyAlerts')}</p>
        </div>
      )}

      <Form
        schema={bookingSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitButtonText={t('bookings.bookNow')}
        showSubmitButton={true}
        className="booking-form-container"
      >
        <div className="booking-form-dates">
          <DateRangePicker
            startDateName="startDate"
            endDateName="endDate"
            label={t('bookings.selectDates')}
            minDate={tomorrow}
            required
            className="booking-form-date-field"
            onChange={handleDateChange}
            excludeDates={excludeDates}
          />
        </div>

        {campsites.length > 0 && (
          <div className="booking-form-campsites">
            <Select
              name="campsiteId"
              label={t('bookings.selectCampsite')}
              options={campsites.map((campsite) => ({
                value: campsite._id,
                label: `${campsite.name} - $${campsite.price}/night - ${t('bookings.capacity')}: ${campsite.capacity}`,
              }))}
              onChange={(e) => handleCampsiteChange(e.target.value)}
              placeholder={t('bookings.chooseCampsite')}
              className="booking-form-campsite-field"
            />

            {selectedCampsite && (
              <div className="selected-campsite-info">
                <h4>{selectedCampsite.name}</h4>
                {selectedCampsite.description && <p>{selectedCampsite.description}</p>}
                {selectedCampsite.features && selectedCampsite.features.length > 0 && (
                  <div className="campsite-features">
                    <p>{t('bookings.features')}</p>
                    <ul>
                      {selectedCampsite.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="booking-form-guests">
          <Input
            type="number"
            name="guests"
            label={t('bookings.numberOfGuests')}
            min="1"
            max={selectedCampsite ? selectedCampsite.capacity : 10}
            defaultValue={1}
            onChange={(e) => setGuests(parseInt(e.target.value, 10))}
            className="booking-form-guests-field"
          />
        </div>

        <div className="booking-form-price">
          <p>
            {t('bookings.pricePerNight', {
              price: selectedCampsite ? selectedCampsite.price : startingPrice,
            })}
          </p>
        </div>
      </Form>
    </div>
  );
};

BookingForm.propTypes = {
  campground: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
};

export default BookingForm;
