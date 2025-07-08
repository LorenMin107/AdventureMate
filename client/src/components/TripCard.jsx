import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FiShare2, FiTrash2, FiCalendar } from 'react-icons/fi';
import ShareTripDialog from './ShareTripDialog';
import './TripCard.css';

const TripCard = ({ trip, currentUser, onSelect, onDelete, onRemoveSelf, onUpdate }) => {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleShareClick = (e) => {
    e.stopPropagation();
    setShowShareDialog(true);
  };

  const handleCloseShareDialog = () => {
    setShowShareDialog(false);
    if (onUpdate) onUpdate();
  };
  if (!trip) return null;

  const { title, startDate, endDate, description } = trip;

  const formattedStartDate = new Date(startDate).toLocaleDateString();
  const formattedEndDate = new Date(endDate).toLocaleDateString();

  // Determine if current user is owner or collaborator
  const isOwner = currentUser && trip.user && currentUser._id === (trip.user._id || trip.user);
  const isCollaborator =
    currentUser &&
    Array.isArray(trip.collaborators) &&
    trip.collaborators.some(
      (id) => id === currentUser._id || (id._id && id._id === currentUser._id)
    );

  return (
    <>
      <div className="trip-card">
        <div className="trip-card-content">
          <h3 className="trip-card-title">{title}</h3>
          {description && <p className="trip-card-description">{description}</p>}
          <p className="trip-card-dates">
            <FiCalendar className="icon" />
            {formattedStartDate} - {formattedEndDate}
          </p>
        </div>
        <div className="trip-card-footer">
          <button
            onClick={() => onSelect(trip)}
            className="trip-card-button view-button"
            title="View Itinerary"
          >
            View Itinerary
          </button>
          <div className="trip-card-actions">
            <button onClick={handleShareClick} className="trip-card-icon-button" title="Share trip">
              <FiShare2 />
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(trip._id)}
                className="trip-card-icon-button danger"
                title="Delete trip"
              >
                <FiTrash2 />
              </button>
            )}
          </div>
        </div>
      </div>

      {showShareDialog && (
        <ShareTripDialog
          trip={trip}
          onClose={handleCloseShareDialog}
          onUpdate={() => onUpdate && onUpdate()}
        />
      )}
    </>
  );
};

TripCard.propTypes = {
  trip: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRemoveSelf: PropTypes.func,
  onUpdate: PropTypes.func,
};

export default TripCard;
