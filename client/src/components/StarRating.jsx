import { useState } from 'react';
import PropTypes from 'prop-types';
import './StarRating.css';

/**
 * StarRating component for displaying and selecting star ratings
 * 
 * @param {Object} props - Component props
 * @param {number} props.rating - Current rating value (1-5)
 * @param {boolean} props.editable - Whether the rating can be changed by user interaction
 * @param {function} props.onChange - Callback function when rating changes (only used when editable)
 * @returns {JSX.Element} Star rating component
 */
const StarRating = ({ rating, editable = false, onChange }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const handleMouseEnter = (index) => {
    if (!editable) return;
    setHoverRating(index);
  };
  
  const handleMouseLeave = () => {
    if (!editable) return;
    setHoverRating(0);
  };
  
  const handleClick = (index) => {
    if (!editable) return;
    onChange(index);
  };
  
  return (
    <div className="star-rating">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const isActive = hoverRating ? starValue <= hoverRating : starValue <= rating;
        
        return (
          <span
            key={index}
            className={`star ${isActive ? 'filled' : ''} ${editable ? 'editable' : ''}`}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starValue)}
            role={editable ? 'button' : 'presentation'}
            tabIndex={editable ? 0 : undefined}
            aria-label={editable ? `Rate ${starValue} out of 5 stars` : undefined}
          >
            ★
          </span>
        );
      })}
      {editable && (
        <span className="sr-only">
          Current rating: {rating} out of 5 stars
        </span>
      )}
    </div>
  );
};

StarRating.propTypes = {
  rating: PropTypes.number.isRequired,
  editable: PropTypes.bool,
  onChange: PropTypes.func,
};

export default StarRating;