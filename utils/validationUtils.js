/**
 * Validation utility functions for user input
 */

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validates username format
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return false;
  }

  // 3-20 characters, alphanumeric, underscore, and hyphen only
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
};
