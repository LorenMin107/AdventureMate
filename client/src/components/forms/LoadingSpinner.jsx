import React from 'react';
import PropTypes from 'prop-types';
import './FormStyles.css';

/**
 * Reusable loading spinner component
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (small, medium, large)
 * @param {string} props.color - Color of the spinner
 * @param {string} props.className - Additional CSS class names
 * @param {string} props.label - Accessibility label for the spinner
 * @returns {JSX.Element} LoadingSpinner component
 */
const LoadingSpinner = ({
  size = 'medium',
  color = 'primary',
  className = '',
  label = 'Loading...',
}) => {
  return (
    <div 
      className={`spinner spinner-${size} spinner-${color} ${className}`}
      role="status"
      aria-label={label}
    >
      <div className="spinner-inner"></div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'white']),
  className: PropTypes.string,
  label: PropTypes.string,
};

export default LoadingSpinner;