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

  const { _id, title, images, location, description, price } = campground;

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
            ${price}<span className="price-unit">/night</span>
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