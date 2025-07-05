import { logError } from './logger';

/**
 * Formats a date into a readable string
 * @param {Date} date - The date to format
 * @param {Object} options - Formatting options
 * @param {string} options.format - The format to use ('short', 'medium', 'long')
 * @returns {string} The formatted date string
 */
export const formatDate = (date, { format = 'medium' } = {}) => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    logError('Invalid date provided to formatDate');
    return '';
  }

  const options = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  };

  return dateObj.toLocaleDateString('en-US', options[format]);
};

/**
 * Returns a relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - The date to format
 * @returns {string} The relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    logError('Invalid date provided to getRelativeTime');
    return '';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(dateObj, { format: 'medium' });
};
