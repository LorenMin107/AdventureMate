import React, { useState } from 'react';
import apiClient from '../utils/api';
import PropTypes from 'prop-types';
import { FiTrash2 } from 'react-icons/fi';
import ConfirmDialog from './common/ConfirmDialog';
import './TripItineraryBuilder.css';

const TripItineraryBuilder = ({ trip, onUpdate, onBack }) => {
  const [editingDay, setEditingDay] = useState(null); // Now holds day._id
  const [newActivity, setNewActivity] = useState({ title: '', time: '', description: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { day, activityId }

  if (!trip) {
    return <div>Select a trip to see the itinerary.</div>;
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
        title="Delete Activity"
        message="Are you sure you want to delete this activity? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
      <button className="back-to-trips-btn" onClick={onBack}>
        &larr; Back to trips
      </button>
      <h2>{trip.title} Itinerary</h2>
      <div className="itinerary-days">
        {trip.days && trip.days.length > 0 ? (
          trip.days
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((day, index) => (
              <div key={day._id} className="itinerary-day">
                <h3>
                  Day {index + 1}: {new Date(day.date).toLocaleDateString()}
                </h3>
                <div className="day-activities">
                  {day.activities && day.activities.length > 0 ? (
                    <ul className="activity-list">
                      {day.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="activity-item">
                          <span className="activity-time">
                            {activity.time ? `${activity.time}` : 'All Day'}
                          </span>
                          <strong>{activity.title}</strong>
                          <p>{activity.description}</p>
                          <button
                            onClick={() => handleDeleteActivity(day, activity._id)}
                            className="delete-activity-btn"
                          >
                            <FiTrash2 style={{ marginRight: '0.3em' }} /> Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty-activities">
                      <span className="icon" role="img" aria-label="No activities">
                        🗓️
                      </span>
                      No activities planned for this day yet.
                    </div>
                  )}
                  {editingDay === day._id ? (
                    <div className="add-activity-form">
                      <input
                        type="text"
                        name="title"
                        placeholder="Activity Title"
                        value={newActivity.title}
                        onChange={handleInputChange}
                        required
                      />
                      <input
                        type="text"
                        name="time"
                        placeholder="Time (e.g., 9:00 AM)"
                        value={newActivity.time}
                        onChange={handleInputChange}
                      />
                      <textarea
                        name="description"
                        placeholder="Description"
                        value={newActivity.description}
                        onChange={handleInputChange}
                      ></textarea>
                      <button onClick={() => handleAddActivity(day)}>Save Activity</button>
                      <button onClick={() => setEditingDay(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="add-activity-btn" onClick={() => setEditingDay(day._id)}>
                      Add Activity
                    </button>
                  )}
                </div>
              </div>
            ))
        ) : (
          <p>This trip has no itinerary yet. Activities can be added once the trip is created.</p>
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
