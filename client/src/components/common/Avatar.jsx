import React from 'react';
import PropTypes from 'prop-types';

const Avatar = ({ name, email, size = 'medium', className = '', showFullFirstName = false }) => {
  // Get initials from name or email
  const getInitials = (str) => {
    if (!str) return 'U';

    // If it's an email, use the part before @
    const baseName = str.includes('@') ? str.split('@')[0] : str;

    // Split by spaces or dots and get first letters
    const parts = baseName.split(/[\s.]+/);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return baseName.substring(0, 2).toUpperCase();
  };

  // Get full first name from name or email
  const getFirstName = (str) => {
    if (!str) return 'U';
    const baseName = str.includes('@') ? str.split('@')[0] : str;
    return baseName.split(/\s+/)[0];
  };

  // Size classes
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-12 h-12 text-base',
  };

  // Background color based on name/email
  const getBackgroundColor = (str) => {
    if (!str) return 'bg-gray-500';

    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-orange-500',
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full text-white font-medium 
      ${sizeClasses[size]} ${getBackgroundColor(name || email)} ${className}`}
      aria-label={name || email || 'User avatar'}
    >
      {showFullFirstName ? getFirstName(name || email) : getInitials(name || email)}
    </div>
  );
};

Avatar.propTypes = {
  name: PropTypes.string,
  email: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
  showFullFirstName: PropTypes.bool,
};

export default Avatar;
