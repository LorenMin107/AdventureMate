const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

/**
 * Utility functions for two-factor authentication
 */

// Load environment variables for 2FA configuration
const TWO_FACTOR_ISSUER = process.env.TWO_FACTOR_ISSUER || 'MyanCamp';
const TWO_FACTOR_SECRET_LENGTH = parseInt(process.env.TWO_FACTOR_SECRET_LENGTH, 10) || 20;
const TWO_FACTOR_QR_CODE_WIDTH = parseInt(process.env.TWO_FACTOR_QR_CODE_WIDTH, 10) || 300;

/**
 * Generate a new TOTP secret
 * @returns {Object} Object containing secret in different formats
 */
const generateSecret = (username, issuer = TWO_FACTOR_ISSUER) => {
  const secret = speakeasy.generateSecret({
    length: TWO_FACTOR_SECRET_LENGTH,
    name: `${issuer}:${username}`,
    issuer: issuer
  });

  return {
    base32: secret.base32,
    otpauth_url: secret.otpauth_url
  };
};

/**
 * Generate a QR code for the TOTP secret
 * @param {string} otpauthUrl - The otpauth URL containing the secret
 * @returns {Promise<string>} The QR code as a data URL
 */
const generateQRCode = async (otpauthUrl) => {
  try {
    // Add options to make the QR code more robust and easier to scan
    const options = {
      errorCorrectionLevel: 'H', // High error correction capability
      margin: 4, // Margin around the QR code
      color: {
        dark: '#000000', // Black dots
        light: '#ffffff' // White background
      },
      width: TWO_FACTOR_QR_CODE_WIDTH // Use the width from environment variable
    };

    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl, options);
    console.log('Generated QR code data URL length:', qrCodeDataUrl.length);
    console.log('QR code data URL starts with:', qrCodeDataUrl.substring(0, 30) + '...');

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify a TOTP token
 * @param {string} token - The token to verify
 * @param {string} secret - The secret to verify against
 * @returns {boolean} Whether the token is valid
 */
const verifyToken = (token, secret) => {
  try {
    // Allow a window of 1 time step before and after the current time
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1
    });

    return verified;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
};

/**
 * Generate backup codes
 * @param {number} count - Number of backup codes to generate
 * @returns {Array<string>} Array of backup codes
 */
const generateBackupCodes = (count = 10) => {
  const codes = [];

  for (let i = 0; i < count; i++) {
    // Generate a random 8-character code (4 bytes in hex)
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX for better readability
    const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    codes.push(formattedCode);
  }

  return codes;
};

/**
 * Prepare backup codes for storage in the database
 * @param {Array<string>} codes - Array of backup codes
 * @returns {Array<Object>} Array of backup code objects ready for storage
 */
const prepareBackupCodesForStorage = (codes) => {
  return codes.map(code => ({
    code: code,
    isUsed: false,
    usedAt: null
  }));
};

/**
 * Verify a backup code
 * @param {string} providedCode - The code provided by the user
 * @param {Array<Object>} storedCodes - The stored backup codes
 * @returns {Object} Object containing whether the code is valid and the index of the code
 */
const verifyBackupCode = (providedCode, storedCodes) => {
  // Normalize the provided code (remove dashes, uppercase)
  const normalizedCode = providedCode.replace(/-/g, '').toUpperCase();

  // Find the matching code
  const codeIndex = storedCodes.findIndex(codeObj => {
    // Normalize the stored code
    const storedNormalized = codeObj.code.replace(/-/g, '').toUpperCase();
    return storedNormalized === normalizedCode && !codeObj.isUsed;
  });

  if (codeIndex === -1) {
    return { valid: false, index: -1 };
  }

  return { valid: true, index: codeIndex };
};

/**
 * Mark a backup code as used
 * @param {Array<Object>} storedCodes - The stored backup codes
 * @param {number} index - The index of the code to mark as used
 * @returns {Array<Object>} The updated backup codes
 */
const markBackupCodeAsUsed = (storedCodes, index) => {
  if (index < 0 || index >= storedCodes.length) {
    return storedCodes;
  }

  const updatedCodes = [...storedCodes];
  updatedCodes[index] = {
    ...updatedCodes[index],
    isUsed: true,
    usedAt: new Date()
  };

  return updatedCodes;
};

module.exports = {
  generateSecret,
  generateQRCode,
  verifyToken,
  generateBackupCodes,
  prepareBackupCodesForStorage,
  verifyBackupCode,
  markBackupCodeAsUsed
};
