import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import './CampsiteList.css';

/**
 * CampsiteList displays a list of campsites for a specific campground
 *
 * @param {Object} props
 * @param {string} props.campgroundId - The ID of the campground
 * @param {boolean} props.isOwner - Whether the current user is the owner of the campground
 */
const CampsiteList = ({ campgroundId, isOwner }) => {
  const [campsites, setCampsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchCampsites = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/campgrounds/${campgroundId}/campsites`);
        const data = response.data;

        // Check if the response is in the standardized format
        const campsitesData = data.status && data.data ? data.data.campsites : data.campsites;

        if (!campsitesData) {
          throw new Error('Campsites data not found in response');
        }

        setCampsites(campsitesData);
      } catch (err) {
        logError('Error fetching campsites', err);
        setError('Failed to load campsites. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampsites();
  }, [campgroundId]);

  const handleDeleteCampsite = async (campsiteId) => {
    if (!window.confirm('Are you sure you want to delete this campsite?')) {
      return;
    }

    try {
      await apiClient.delete(`/campsites/${campsiteId}`);

      // Remove the deleted campsite from the state
      setCampsites((prevCampsites) =>
        prevCampsites.filter((campsite) => campsite._id !== campsiteId)
      );
    } catch (err) {
      logError('Error deleting campsite', err);
      alert('Failed to delete campsite. Please try again later.');
    }
  };

  if (loading) {
    return <div className="campsites-loading">Loading campsites...</div>;
  }

  if (error) {
    return <div className="campsites-error">{error}</div>;
  }

  if (campsites.length === 0) {
    return (
      <div className="campsites-container">
        <div className="campsites-header">
          <h2>Campsites</h2>
          {isOwner && (
            <Link to={`/campgrounds/${campgroundId}/campsites/new`} className="add-campsite-button">
              Add Campsite
            </Link>
          )}
        </div>
        <div className="no-campsites">
          <p>No campsites available for this campground yet.</p>
          {isOwner && (
            <p>
              As the owner, you can add campsites to make this campground available for booking.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="campsites-container">
      <div className="campsites-header">
        <h2>Available Campsites</h2>
        {isOwner && (
          <Link to={`/campgrounds/${campgroundId}/campsites/new`} className="add-campsite-button">
            Add Campsite
          </Link>
        )}
      </div>

      <div className="campsites-list">
        {campsites.map((campsite) => (
          <div key={campsite._id} className="campsite-card">
            <Link to={`/campsites/${campsite._id}`} className="campsite-card-link">
              <div className="campsite-image">
                {campsite.images && campsite.images.length > 0 ? (
                  <img src={campsite.images[0].url} alt={campsite.name} />
                ) : (
                  <div className="no-image">No image</div>
                )}
              </div>

              <div className="campsite-details">
                <h3 className="campsite-name">{campsite.name}</h3>
                <p className="campsite-description">{campsite.description}</p>

                <div className="campsite-features">
                  {campsite.features &&
                    campsite.features.map((feature, index) => (
                      <span key={index} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                </div>

                <div className="campsite-info">
                  <div className="info-item">
                    <span className="info-label">Price:</span>
                    <span className="info-value">${campsite.price} per night</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Capacity:</span>
                    <span className="info-value">
                      {campsite.capacity} {campsite.capacity === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Availability:</span>
                    <span
                      className={`info-value ${campsite.availability ? 'available' : 'unavailable'}`}
                    >
                      {campsite.availability ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            <div className="campsite-actions">
              <Link to={`/campsites/${campsite._id}`} className="common-btn common-btn-primary">
                View
              </Link>

              {isOwner && (
                <>
                  <Link
                    to={`/campsites/${campsite._id}/edit`}
                    className="common-btn common-btn-secondary"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCampsite(campsite._id);
                    }}
                    className="common-btn common-btn-danger"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampsiteList;
