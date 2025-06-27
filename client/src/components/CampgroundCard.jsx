import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CampgroundCard.css';

/**
 * CampgroundCard component displays a card with campground information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.campground - Campground data
 */
const CampgroundCard = ({ campground }) => {
  // If no campground is provided, return null
  if (!campground) return null;

  const { _id, title, images, location, description } = campground;

  const [startingPrice, setStartingPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch campsites for the campground
  useEffect(() => {
    const fetchCampsites = async () => {
      try {
        const response = await fetch(`/api/v1/campgrounds/${_id}/campsites`);

        if (!response.ok) {
          throw new Error('Failed to fetch campsites');
        }

        const data = await response.json();

        // Check if the response is in the standardized format
        const campsitesData = data.status && data.data ? data.data.campsites : data.campsites;

        if (!campsitesData) {
          throw new Error('Campsites data not found in response');
        }

        // Filter available campsites
        const availableCampsites = campsitesData.filter(campsite => campsite.availability);

        // Calculate the starting price from available campsites
        if (availableCampsites.length > 0) {
          const minPrice = Math.min(...availableCampsites.map(campsite => campsite.price));
          setStartingPrice(minPrice);
        }
      } catch (err) {
        console.error('Error fetching campsites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampsites();
  }, [_id]);

  // Get the first image or use a placeholder
  const imageUrl = images && images.length > 0 
    ? images[0].url 
    : 'https://via.placeholder.com/300x200?text=No+Image+Available';

  // Truncate description if it's too long
  const truncatedDescription = description && description.length > 100
    ? `${description.substring(0, 100)}...`
    : description;

  return (
    <div className="campground-card">
      <div className="campground-card-image">
        <img src={imageUrl} alt={title} />
      </div>

      <div className="campground-card-content">
        <h3 className="campground-card-title">{title}</h3>

        <div className="campground-card-location">
          <i className="location-icon">📍</i> {location}
        </div>

        <p className="campground-card-description">{truncatedDescription}</p>

        <div className="campground-card-footer">
          <div className="campground-card-price">
            {loading ? (
              <span className="loading-price">Loading price...</span>
            ) : startingPrice > 0 ? (
              <>
                <span className="from-text">From </span>
                ${startingPrice}<span className="price-unit">/night</span>
              </>
            ) : (
              <span className="no-price">Contact for pricing</span>
            )}
          </div>

          <Link to={`/campgrounds/${_id}`} className="view-button">
            View Campground
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CampgroundCard;
