const User = require('../../models/user');
const {
  generateSecret,
  generateQRCode,
  verifyToken,
  generateBackupCodes,
  prepareBackupCodesForStorage,
  verifyBackupCode,
  markBackupCodeAsUsed,
} = require('../../utils/twoFactorAuth');
const { logError, logInfo, logDebug, logWarn } = require('../../utils/logger');

/**
 * Controller for two-factor authentication operations
 */

/**
 * Initiate 2FA setup by generating a secret and QR code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.initiate2FASetup = async (req, res) => {
  try {
    logInfo('Initiating 2FA setup', { 
      userId: req.user?._id,
      endpoint: '/api/v1/2fa/setup' 
    });

    // Ensure user is authenticated
    if (!req.user) {
      logWarn('2FA setup attempted without authentication', { 
      endpoint: '/api/v1/2fa/setup' 
    });
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if 2FA is already enabled
    if (req.user.isTwoFactorEnabled) {
      logInfo('2FA already enabled', { 
      userId: req.user._id 
    });
      return res.status(400).json({ error: '2FA is already enabled for this account' });
    }

    logDebug('Generating 2FA secret', { 
      userId: req.user._id,
      username: req.user.username 
    });
    // Generate a new secret
    const secret = generateSecret(req.user.username);

    // Store the secret temporarily (not enabled yet)
    req.user.twoFactorSecret = secret.base32;
    req.user.twoFactorSetupCompleted = false;
    await req.user.save();
    logDebug('2FA secret saved', { 
      userId: req.user._id 
    });

    // Generate QR code
    logDebug('Generating 2FA QR code', { 
      userId: req.user._id 
    });
    const qrCode = await generateQRCode(secret.otpauth_url);
    logDebug('2FA QR code generated successfully', { 
      userId: req.user._id 
    });

    logDebug('Sending 2FA setup response', { 
      userId: req.user._id 
    });
    res.json({
      message: 'Two-factor authentication setup initiated',
      qrCode,
      secret: secret.base32, // Only send this in development
      setupCompleted: false,
    });
  } catch (error) {
    logError('Error initiating 2FA setup', error, { 
      userId: req.user?._id,
      endpoint: '/api/v1/2fa/setup' 
    });
    res.status(500).json({ error: 'Failed to initiate 2FA setup: ' + error.message });
  }
};

/**
 * Verify TOTP token during setup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verify2FASetup = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if 2FA is already enabled
    if (req.user.isTwoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled for this account' });
    }

    // Check if setup has been initiated
    if (!req.user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA setup has not been initiated' });
    }

    const { token } = req.body;

    // Verify the token
    const isValid = verifyToken(token, req.user.twoFactorSecret);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const backupCodesForStorage = prepareBackupCodesForStorage(backupCodes);

    // Enable 2FA
    req.user.isTwoFactorEnabled = true;
    req.user.twoFactorSetupCompleted = true;
    req.user.backupCodes = backupCodesForStorage;
    await req.user.save();

    res.json({
      message: 'Two-factor authentication enabled successfully',
      backupCodes,
      setupCompleted: true,
    });
  } catch (error) {
    logError('Error verifying 2FA setup', error, { 
      userId: req.user?._id,
      endpoint: '/api/v1/2fa/verify-setup' 
    });
    res.status(500).json({ error: 'Failed to verify 2FA setup' });
  }
};

/**
 * Disable 2FA
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.disable2FA = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if 2FA is enabled
    if (!req.user.isTwoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled for this account' });
    }

    const { token, password } = req.body;

    // Verify the token
    const isValid = verifyToken(token, req.user.twoFactorSecret);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Disable 2FA
    req.user.isTwoFactorEnabled = false;
    req.user.twoFactorSecret = null;
    req.user.twoFactorSetupCompleted = false;
    req.user.backupCodes = [];
    await req.user.save();

    res.json({
      message: 'Two-factor authentication disabled successfully',
    });
  } catch (error) {
    logError('Error disabling 2FA', error, { 
      userId: req.user?._id,
      endpoint: '/api/v1/2fa/disable' 
    });
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

/**
 * Verify TOTP token during login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verify2FALogin = async (req, res) => {
  try {
    // Get user from JWT token (partially authenticated)
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = req.user;

    // Check if 2FA is enabled
    if (!user.isTwoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled for this account' });
    }

    const { token, useBackupCode } = req.body;
    let isValid = false;

    if (useBackupCode) {
      // Verify backup code
      const { valid, index } = verifyBackupCode(token, user.backupCodes);
      isValid = valid;

      if (isValid) {
        // Mark backup code as used
        user.backupCodes = markBackupCodeAsUsed(user.backupCodes, index);
        await user.save();
      }
    } else {
      // Verify TOTP token
      isValid = verifyToken(token, user.twoFactorSecret);
    }

    if (!isValid) {
      return res.status(400).json({
        error: useBackupCode ? 'Invalid backup code' : 'Invalid verification code',
      });
    }

    // Generate final access and refresh tokens
    const { generateAccessToken, generateRefreshToken } = require('../../utils/jwtUtils');
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req);

    // Return user data and tokens (excluding sensitive information)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin || false,
      isEmailVerified: user.isEmailVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };

    res.json({
      message: 'Two-factor authentication successful',
      user: userResponse,
      accessToken,
      refreshToken: refreshToken.token,
      expiresAt: refreshToken.expiresAt,
    });
  } catch (error) {
    logError('Error verifying 2FA login', error, { 
      userId: req.user?._id,
      endpoint: '/api/v1/2fa/verify-login' 
    });
    res.status(500).json({ error: 'Failed to verify 2FA login' });
  }
};
