import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useForm, FormProvider } from 'react-hook-form';
import { DateRangePicker } from '../components/forms';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import apiClient from '../utils/api';
import TripItineraryBuilder from '../components/TripItineraryBuilder';
import TripCard from '../components/TripCard';
import TripExportDialog from '../components/TripExportDialog';
import { FiDownload } from 'react-icons/fi';
import ConfirmDialog from '../components/common/ConfirmDialog';
import './TripPlannerPage.css';

const TripPlannerPage = () => {
  const { theme } = useTheme();
  const { isAuthenticated, loading, logout, currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState(null);
  const [showNewTripForm, setShowNewTripForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [updatingTrip, setUpdatingTrip] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [confirmDeleteTripOpen, setConfirmDeleteTripOpen] = useState(false);
  const [pendingDeleteTripId, setPendingDeleteTripId] = useState(null);
  const { id: tripIdFromUrl } = useParams();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { state: { from: '/trip-planner' } });
      return;
    }
    // Set up authentication state change listener
    const handleAuthChange = () => {
      if (!loading && !isAuthenticated) {
        navigate('/login', {
          state: {
            from: '/trip-planner',
            message: t('tripPlanner.sessionExpired'),
          },
        });
      }
    };
    window.addEventListener('authStateChange', handleAuthChange);
    return () => {
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, [isAuthenticated, loading, navigate]);

  // Form setup for new trip creation
  const methods = useForm({
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
    },
  });

  // Handle API errors and authentication
  const handleApiError = (error) => {
    if (error?.response?.status === 401) {
      // Trigger logout and redirect
      logout();
      // The auth state change will be handled by the effect above
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchTrips();
    }
  }, [isAuthenticated, loading]);

  // Auto-select trip if tripIdFromUrl is present
  useEffect(() => {
    if (tripIdFromUrl && trips.length > 0) {
      const found = trips.find((t) => t._id === tripIdFromUrl);
      if (found) {
        setSelectedTrip(found);
      } else {
        // Try to fetch the trip directly if not in the list (e.g., invited trip)
        apiClient
          .get(`/trips/${tripIdFromUrl}`)
          .then((res) => setSelectedTrip(res.data.trip))
          .catch(() => setSelectedTrip(null));
      }
    } else if (!tripIdFromUrl) {
      setSelectedTrip(null);
    }
  }, [tripIdFromUrl, trips]);

  const fetchTrips = async () => {
    if (!isAuthenticated) return;

    setTripsLoading(true);
    try {
      const res = await apiClient.get('/trips');
      setTrips(res.data.trips || []);
      setError(null);
    } catch (err) {
      if (!handleApiError(err)) {
        setError('Failed to load trips.');
      }
    } finally {
      setTripsLoading(false);
    }
  };

  const handleCreateTrip = async (data) => {
    setCreating(true);
    try {
      const res = await apiClient.post('/trips', data);
      const newTrip = res.data.trip;

      setShowNewTripForm(false);
      methods.reset();

      // Add the new trip to the list and select it immediately for a better UX
      setTrips((prevTrips) => [newTrip, ...prevTrips]);
      setSelectedTrip(newTrip);
    } catch (err) {
      if (!handleApiError(err)) {
        setError(
          t('tripPlanner.failedToCreateTrip', {
            message: err.response?.data?.message || err.message,
          })
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const handleSelectTrip = (trip) => {
    // If we're not already on the trip detail URL, navigate to it
    if (trip && trip._id && tripIdFromUrl !== trip._id) {
      navigate(`/trips/${trip._id}`);
    }
    setSelectedTrip(trip);
  };

  const handleBackToList = () => {
    // If we're on a trip detail URL, navigate back to /trips
    if (tripIdFromUrl) {
      navigate('/trips');
    }
    setSelectedTrip(null);
  };

  const handleDeleteTrip = (tripId) => {
    setPendingDeleteTripId(tripId);
    setConfirmDeleteTripOpen(true);
  };

  const handleConfirmDeleteTrip = async () => {
    try {
      await apiClient.delete(`/trips/${pendingDeleteTripId}`);
      setTrips(trips.filter((t) => t._id !== pendingDeleteTripId));
      if (selectedTrip && selectedTrip._id === pendingDeleteTripId) {
        setSelectedTrip(null);
      }
    } catch (err) {
      if (!handleApiError(err)) {
        setError(t('tripPlanner.failedToDeleteTrip'));
      }
    }
    setConfirmDeleteTripOpen(false);
    setPendingDeleteTripId(null);
  };

  const handleCancelDeleteTrip = () => {
    setConfirmDeleteTripOpen(false);
    setPendingDeleteTripId(null);
  };

  const handleUpdateTrip = async () => {
    if (!selectedTrip) return;
    setUpdatingTrip(true);
    try {
      // Re-fetch the selected trip's data to get the latest updates (e.g., new activities)
      const res = await apiClient.get(`/trips/${selectedTrip._id}`);
      setSelectedTrip(res.data.trip);
      // Also refresh the main list in the background
      fetchTrips();
    } catch (err) {
      if (!handleApiError(err)) {
        setError(t('tripPlanner.failedToRefreshTrip'));
      }
    } finally {
      setUpdatingTrip(false);
    }
  };

  // Handle trip updates from child components (e.g., after sharing)
  const handleTripUpdated = () => {
    fetchTrips();
    if (selectedTrip) {
      // Refresh the selected trip if one is currently selected
      apiClient
        .get(`/trips/${selectedTrip._id}`)
        .then((res) => setSelectedTrip(res.data.trip))
        .catch((err) => console.error('Error refreshing trip:', err));
    }
  };

  const handleExportClick = () => {
    setShowExportDialog(true);
  };

  const handleRemoveSelf = async (tripId) => {
    try {
      await apiClient.delete(`/trips/${tripId}/collaborators/me`);
      setTrips(trips.filter((t) => t._id !== tripId));
      if (selectedTrip && selectedTrip._id === tripId) {
        setSelectedTrip(null);
      }
    } catch (err) {
      setError(t('tripPlanner.failedToRemoveSelf'));
    }
  };

  if (loading) {
    return <div className="trip-planner-loading">{t('tripPlanner.checkingAuth')}</div>;
  }
  if (tripsLoading) {
    return <div className="trip-planner-loading">{t('tripPlanner.loading')}</div>;
  }
  return (
    <div className={`trip-planner-page ${theme}`}>
      <ConfirmDialog
        open={confirmDeleteTripOpen}
        onClose={handleCancelDeleteTrip}
        onConfirm={handleConfirmDeleteTrip}
        title={t('tripPlanner.deleteTrip')}
        message={t('tripPlanner.deleteTripConfirm')}
        confirmLabel={t('tripPlanner.delete')}
        cancelLabel={t('tripPlanner.cancel')}
      />
      {showExportDialog && selectedTrip && (
        <TripExportDialog trip={selectedTrip} onClose={() => setShowExportDialog(false)} />
      )}
      <div className="trip-planner-header">
        <h1>{selectedTrip ? t('tripPlanner.tripItinerary') : t('tripPlanner.myTrips')}</h1>
        {!selectedTrip && (
          <button
            onClick={() => setShowNewTripForm(!showNewTripForm)}
            className="trip-planner-new-btn"
          >
            {showNewTripForm ? t('tripPlanner.cancel') : t('tripPlanner.createNewTrip')}
          </button>
        )}
      </div>

      {selectedTrip ? (
        <>
          <div className="trip-header">
            <h2>{t('tripPlanner.yourTrip', { title: selectedTrip.title })}</h2>
            <div className="trip-actions">
              <button
                className="secondary-button"
                onClick={handleExportClick}
                title={t('tripPlanner.exportTrip')}
              >
                <FiDownload size={18} />
                <span>{t('tripPlanner.export')}</span>
              </button>
            </div>
          </div>
          <TripItineraryBuilder
            trip={selectedTrip}
            onUpdate={handleUpdateTrip}
            onBack={handleBackToList}
          />
        </>
      ) : (
        <>
          {showNewTripForm && (
            <div className="trip-form-container">
              <h2>{t('tripPlanner.planYourNewTrip')}</h2>
              <FormProvider {...methods}>
                <form
                  className="trip-planner-form"
                  onSubmit={methods.handleSubmit(handleCreateTrip)}
                >
                  <div className="form-section">
                    <h3>{t('tripPlanner.tripInformation')}</h3>
                    <div className="form-group">
                      <label htmlFor="title">{t('tripPlanner.tripTitle')} *</label>
                      <input
                        id="title"
                        type="text"
                        placeholder={t('tripPlanner.tripTitlePlaceholder')}
                        {...methods.register('title', {
                          required: t('tripPlanner.tripTitleRequired'),
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="description">{t('tripPlanner.description')}</label>
                      <input
                        id="description"
                        type="text"
                        placeholder={t('tripPlanner.descriptionPlaceholder')}
                        {...methods.register('description')}
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>{t('tripPlanner.tripDates')}</h3>
                    <div className="form-group date-range-group">
                      <DateRangePicker
                        startDateName="startDate"
                        endDateName="endDate"
                        label={t('tripPlanner.selectTravelDates')}
                        required
                        minDate={new Date()}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => setShowNewTripForm(false)}
                      disabled={creating}
                    >
                      {t('tripPlanner.cancel')}
                    </button>
                    <button type="submit" className="submit-btn" disabled={creating}>
                      {creating ? t('tripPlanner.creatingTrip') : t('tripPlanner.createTrip')}
                    </button>
                  </div>
                </form>
              </FormProvider>
            </div>
          )}

          {error ? (
            <div className="trip-planner-error">{error}</div>
          ) : trips.length === 0 ? (
            <div className="trip-planner-empty">{t('tripPlanner.noTripsYet')}</div>
          ) : (
            <div className="trip-planner-list">
              {trips.map((trip) => (
                <TripCard
                  key={trip._id}
                  trip={trip}
                  currentUser={currentUser}
                  onSelect={handleSelectTrip}
                  onDelete={handleDeleteTrip}
                  onRemoveSelf={handleRemoveSelf}
                  onUpdate={handleTripUpdated}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TripPlannerPage;
