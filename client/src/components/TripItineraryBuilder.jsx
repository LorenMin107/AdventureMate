import React, { useState } from 'react';
import apiClient from '../utils/api';
import PropTypes from 'prop-types';
import { FiTrash2 } from 'react-icons/fi';
import ConfirmDialog from './common/ConfirmDialog';
import './TripItineraryBuilder.css';
import { useTranslation } from 'react-i18next';

const TripItineraryBuilder = ({ trip, onUpdate, onBack }) => {
  const { t } = useTranslation();
  const [editingDay, setEditingDay] = useState(null); // Now holds day._id
  const [newActivity, setNewActivity] = useState({ title: '', time: '', description: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { day, activityId }

  if (!trip) {
    return <div>{t('tripItineraryBuilder.selectTrip')}</div>;
  }

  const handleDeleteActivity = async (day, activityId) => {
    setPendingDelete({ day, activityId });
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const { day, activityId } = pendingDelete;
    const updatedActivities = day.activities.filter((act) => act._id !== activityId);
    try {
      await apiClient.put(`/trips/${trip._id}/days/${day._id}`, {
        activities: updatedActivities,
      });
      onUpdate(trip); // Trigger a full refresh
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  const handleAddActivity = async (day) => {
    if (!newActivity.title) return; // Basic validation
    const updatedActivities = [...(day.activities || []), newActivity];
    try {
      const res = await apiClient.put(`/trips/${trip._id}/days/${day._id}`, {
        activities: updatedActivities,
      });
      onUpdate(trip);
      setEditingDay(null);
      setNewActivity({ title: '', time: '', description: '' });
    } catch (error) {
      console.error('Failed to add activity:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewActivity((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="trip-itinerary-builder">
      <ConfirmDialog
        open={confirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={t('tripItineraryBuilder.deleteActivityTitle')}
        message={t('tripItineraryBuilder.deleteActivityConfirm')}
        confirmLabel={t('tripItineraryBuilder.delete')}
        cancelLabel={t('tripItineraryBuilder.cancel')}
      />
      <button className="back-to-trips-btn" onClick={onBack}>
        &larr; {t('tripItineraryBuilder.backToTrips')}
      </button>
      <h2>
        {trip.title} {t('tripItineraryBuilder.itinerary')}
      </h2>
      <div className="itinerary-days">
        {trip.days && trip.days.length > 0 ? (
          trip.days
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((day, index) => (
              <div key={day._id} className="itinerary-day">
                <h3>
                  {t('tripItineraryBuilder.day', { number: index + 1 })}:{' '}
                  {new Date(day.date).toLocaleDateString()}
                </h3>
                <div className="day-activities">
                  {day.activities && day.activities.length > 0 ? (
                    <ul className="activity-list">
                      {day.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="activity-item">
                          <span className="activity-time">
                            {activity.time ? `${activity.time}` : t('tripItineraryBuilder.allDay')}
                          </span>
                          <strong>{activity.title}</strong>
                          <p>{activity.description}</p>
                          <button
                            onClick={() => handleDeleteActivity(day, activity._id)}
                            className="delete-activity-btn"
                          >
                            <FiTrash2 style={{ marginRight: '0.3em' }} />{' '}
                            {t('tripItineraryBuilder.delete')}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty-activities">
                      <span className="icon" role="img" aria-label="No activities">
                        🗓️
                      </span>
                      {t('tripItineraryBuilder.noActivities')}
                    </div>
                  )}
                  {editingDay === day._id ? (
                    <div className="add-activity-form">
                      <input
                        type="text"
                        name="title"
                        placeholder={t('tripItineraryBuilder.activityTitlePlaceholder')}
                        value={newActivity.title}
                        onChange={handleInputChange}
                        required
                      />
                      <input
                        type="text"
                        name="time"
                        placeholder={t('tripItineraryBuilder.timePlaceholder')}
                        value={newActivity.time}
                        onChange={handleInputChange}
                      />
                      <textarea
                        name="description"
                        placeholder={t('tripItineraryBuilder.descriptionPlaceholder')}
                        value={newActivity.description}
                        onChange={handleInputChange}
                      ></textarea>
                      <button onClick={() => handleAddActivity(day)}>
                        {t('tripItineraryBuilder.saveActivity')}
                      </button>
                      <button onClick={() => setEditingDay(null)}>
                        {t('tripItineraryBuilder.cancel')}
                      </button>
                    </div>
                  ) : (
                    <button className="add-activity-btn" onClick={() => setEditingDay(day._id)}>
                      {t('tripItineraryBuilder.addActivity')}
                    </button>
                  )}
                </div>
              </div>
            ))
        ) : (
          <p>{t('tripItineraryBuilder.noItinerary')}</p>
        )}
      </div>
    </div>
  );
};

TripItineraryBuilder.propTypes = {
  trip: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default TripItineraryBuilder;
