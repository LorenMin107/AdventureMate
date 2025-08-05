const User = require('../../models/user');
const Owner = require('../../models/owner');
const OwnerApplication = require('../../models/ownerApplication');
const EmailVerificationToken = require('../../models/emailVerificationToken');
const { logError, logInfo, logDebug } = require('../../utils/logger');
const {
  comparePassword,
  validatePasswordStrength,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenAsUsed,
  generatePasswordResetUrl,
} = require('../../utils/passwordUtils');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  blacklistAccessToken,
} = require('../../utils/jwtUtils');
const {
  generateEmailVerificationToken,
  generateVerificationUrl,
  verifyEmailToken,
  markEmailTokenAsUsed,
  findUsedToken,
} = require('../../utils/emailUtils');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../utils/emailService');
const asyncHandler = require('../../utils/catchAsync');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Register a new user
 * Creates a new user account and sends a verification email
 */
module.exports.register = asyncHandler(async (req, res) => {
  const { email, username, password, phone } = req.body;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      error: 'Bad Request',
      message: passwordValidation.message,
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'A user with that email or username already exists',
    });
  }

  // Hash the password
  const { hashPassword } = require('../../utils/passwordUtils');
  const hashedPassword = await hashPassword(password);

  // Create and register the new user
  const user = new User({
    email,
    username,
    phone,
    password: hashedPassword,
    profile: {
      name: username, // Use username as the display name for traditional registrations
    },
  });
  await user.save();
  const registeredUser = user;

  try {
    // Generate email verification token
    const verificationToken = await generateEmailVerificationToken(registeredUser, req);

    // Generate verification URL
    const verificationUrl = generateVerificationUrl(verificationToken.token);

    // Send verification email
    await sendVerificationEmail(registeredUser, verificationUrl);
  } catch (emailError) {
    logError('Error sending verification email', emailError, {
      userId: registeredUser._id,
      email: registeredUser.email,
    });
    // Continue with registration even if email fails
  }

  // Return user data (excluding sensitive information)
  res.status(201).json({
    user: {
      _id: registeredUser._id,
      username: registeredUser.username,
      email: registeredUser.email,
      phone: registeredUser.phone,
      isEmailVerified: registeredUser.isEmailVerified,
    },
    message:
      'Registration successful. Please check your email to verify your account before logging in.',
  });
});

/**
 * Login with email and password
 * Returns JWT access token and refresh token
 */
module.exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find the user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect',
    });
  }

  // Verify the password
  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect',
    });
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    // Generate a new verification token
    try {
      const verificationToken = await generateEmailVerificationToken(user, req);
      const verificationUrl = generateVerificationUrl(verificationToken.token);
      await sendVerificationEmail(user, verificationUrl);
    } catch (error) {
      logError('Error sending verification email', error, {
        userId: user._id,
        email: user.email,
      });
      // Continue with login even if email fails
    }

    return res.status(403).json({
      error: 'Email not verified',
      message: 'Please verify your email address. A new verification email has been sent.',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: false,
      },
    });
  }

  // Check if user is suspended
  if (user.isSuspended) {
    return res.status(403).json({
      error: 'Account suspended',
      message: 'Your account has been suspended. Please contact support for more information.',
    });
  }

  // If user is an owner, also check owner suspension status
  if (user.isOwner) {
    const Owner = require('../../models/owner');
    const owner = await Owner.findOne({ user: user._id });

    if (owner && !owner.isActive) {
      return res.status(403).json({
        error: 'Owner account suspended',
        message:
          'Your owner account has been suspended. Please contact support for more information.',
      });
    }
  }

  // Check if 2FA is enabled
  if (user.isTwoFactorEnabled) {
    // Generate a temporary access token for 2FA verification (10 minutes)
    const tempAccessToken = generateAccessToken(user, '10m');

    return res.status(200).json({
      requiresTwoFactor: true,
      message: 'Two-factor authentication required',
      tempAccessToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isOwner: user.isOwner,
        isEmailVerified: user.isEmailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        profile: user.profile || {},
      },
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user, req);

  // Return the tokens
  res.json({
    accessToken,
    refreshToken: refreshToken.token,
    expiresAt: refreshToken.expiresAt,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isOwner: user.isOwner,
      isEmailVerified: user.isEmailVerified,
      profile: user.profile || {},
    },
  });
});

/**
 * Refresh access token using refresh token
 * Returns new JWT access token and refresh token (token rotation)
 */
module.exports.refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Refresh token is required',
    });
  }

  try {
    // Verify the refresh token
    const refreshTokenDoc = await verifyRefreshToken(token);

    // Get the user
    const user = await User.findById(refreshTokenDoc.user);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found',
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      // Revoke the refresh token since user is suspended
      await refreshTokenDoc.revoke();
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact support for more information.',
      });
    }

    // If user is an owner, also check owner suspension status
    if (user.isOwner) {
      const Owner = require('../../models/owner');
      const owner = await Owner.findOne({ user: user._id });

      if (owner && !owner.isActive) {
        // Revoke the refresh token since owner account is suspended
        await refreshTokenDoc.revoke();
        return res.status(403).json({
          error: 'Owner account suspended',
          message:
            'Your owner account has been suspended. Please contact support for more information.',
        });
      }
    }

    // Revoke the old refresh token (token rotation for security)
    await refreshTokenDoc.revoke();
    logInfo('Refresh token rotated', { userId: user._id });

    // Generate a new access token
    const accessToken = generateAccessToken(user);

    // Generate a new refresh token
    const newRefreshToken = await generateRefreshToken(user, req);

    // Return the new tokens
    res.json({
      accessToken,
      refreshToken: newRefreshToken.token,
      expiresAt: newRefreshToken.expiresAt,
    });
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: error.message,
    });
  }
});

/**
 * Logout by revoking the refresh token and blacklisting the access token
 */
module.exports.logout = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Refresh token is required',
    });
  }

  try {
    // Revoke the refresh token
    await revokeRefreshToken(token);

    // Blacklist the current access token if available
    if (req.accessToken && req.user) {
      await blacklistAccessToken(req.accessToken, req.user, req, 'logout');
      logInfo('Access token blacklisted during logout', { userId: req.user._id });
    }

    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    logError('Error during logout', error, { userId: req.user?._id });
    // Still return success even if blacklisting fails
    res.json({
      message: 'Logged out successfully',
    });
  }
});

/**
 * Logout from all devices by revoking all refresh tokens for the user
 * and blacklisting the current access token
 */
module.exports.logoutAll = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  try {
    // Revoke all refresh tokens for the user
    await revokeAllUserTokens(req.user._id);

    // Blacklist the current access token if available
    if (req.accessToken) {
      await blacklistAccessToken(req.accessToken, req.user, req, 'logout_all');
      logInfo('Access token blacklisted during logout from all devices', { userId: req.user._id });
    }

    res.json({
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    logError('Error during logout from all devices', error, { userId: req.user?._id });
    // Still return success even if blacklisting fails
    res.json({
      message: 'Logged out from all devices successfully',
    });
  }
});

/**
 * Verify email with token
 * Marks the user's email as verified
 */
module.exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Verification token is required',
    });
  }

  try {
    // Verify the token
    const verificationToken = await verifyEmailToken(token);

    // Get the user
    const user = await User.findById(verificationToken.user);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      // Set a cookie to indicate that email verification was successful
      // This will be used to bypass rate limiting for the login endpoint
      res.cookie('email_verified', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 5 * 60 * 1000, // 5 minutes expiration
      });

      return res.json({
        message: 'Email already verified. You can now login to your account.',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
      });
    }

    // Mark the user's email as verified
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    // Mark the token as used
    await markEmailTokenAsUsed(token);

    // Set a cookie to indicate that email verification was successful
    // This will be used to bypass rate limiting for the login endpoint
    res.cookie('email_verified', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000, // 5 minutes expiration
    });

    res.json({
      message: 'Email verified successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    logError('Error verifying email', error, { token: token.substring(0, 10) + '...' });

    // Check if this is a "token already used" error
    if (error.message.includes('already been used')) {
      logDebug('Token has been used, checking if we can find the associated user');

      try {
        // Try to find the used token
        const usedToken = await findUsedToken(token);

        if (usedToken) {
          // Get the user associated with this token
          const user = await User.findById(usedToken.user);

          if (user && user.isEmailVerified) {
            logInfo('Found user with already verified email', {
              userId: user._id,
              username: user.username,
            });

            // Set a cookie to indicate that email verification was successful
            // This will be used to bypass rate limiting for the login endpoint
            res.cookie('email_verified', 'true', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 5 * 60 * 1000, // 5 minutes expiration
            });

            return res.json({
              message: 'Your email has already been verified. You can now login to your account.',
              user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
              },
            });
          }
        }
      } catch (innerError) {
        logError('Error while checking used token', innerError);
        // Continue to the default error response
      }
    }

    return res.status(400).json({
      error: 'Invalid token',
      message: error.message,
    });
  }
});

/**
 * Resend verification email for unauthenticated users
 * Allows users to request a new verification email by providing their email address
 */
module.exports.resendVerificationEmailUnauthenticated = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Email is required',
    });
  }

  // Find the user by email
  const user = await User.findOne({ email });

  // For security reasons, don't reveal if the email exists or not
  // Always return a success message even if the email doesn't exist
  if (!user) {
    logInfo('Verification email resend requested for non-existent email', { email });
    return res.json({
      message: 'If your email is registered, you will receive a verification email shortly.',
    });
  }

  // Check if email is already verified
  if (user.isEmailVerified) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Email is already verified',
    });
  }

  try {
    // Generate a new verification token
    const verificationToken = await generateEmailVerificationToken(user, req);

    // Generate verification URL
    const verificationUrl = generateVerificationUrl(verificationToken.token);

    // Send verification email
    await sendVerificationEmail(user, verificationUrl);

    logInfo('Verification email resent successfully', { userId: user._id, email });

    res.json({
      message: 'If your email is registered, you will receive a verification email shortly.',
    });
  } catch (error) {
    logError('Error resending verification email', error, { email });
    return res.status(500).json({
      error: 'Server Error',
      message: 'Failed to send verification email',
    });
  }
});

/**
 * Resend verification email
 * Generates a new token and sends a new verification email
 */
module.exports.resendVerificationEmail = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Check if email is already verified
  if (req.user.isEmailVerified) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Email is already verified',
    });
  }

  try {
    // Generate a new verification token
    const verificationToken = await generateEmailVerificationToken(req.user, req);

    // Generate verification URL
    const verificationUrl = generateVerificationUrl(verificationToken.token);

    // Send verification email
    await sendVerificationEmail(req.user, verificationUrl);

    res.json({
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    logError('Error sending verification email', error, { userId: req.user._id });
    return res.status(500).json({
      error: 'Server Error',
      message: 'Failed to send verification email',
    });
  }
});

/**
 * Request a password reset
 * This endpoint allows users to request a password reset by providing their email
 * It generates a reset token and sends an email with a reset link
 */
module.exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Email is required',
    });
  }

  // Find the user by email
  const user = await User.findOne({ email });

  // For security reasons, don't reveal if the email exists or not
  // Always return a success message even if the email doesn't exist
  if (!user) {
    logInfo('Password reset requested for non-existent email', { email });
    return res.json({
      message: 'If your email is registered, you will receive a password reset link shortly.',
    });
  }

  // Check if the user is a Google OAuth user
  if (user.googleId) {
    logInfo('Password reset requested for Google OAuth user', {
      email,
      userId: user._id,
      googleId: user.googleId,
    });

    return res.status(400).json({
      error: 'Google OAuth Account',
      message:
        'This email is associated with a Google account. Password resets are not available for Google OAuth users. Please use your Google account to sign in.',
      code: 'GOOGLE_OAUTH_ACCOUNT',
      email: email,
    });
  }

  // Generate a password reset token
  const resetToken = await generatePasswordResetToken(user, req);

  // Generate the reset URL
  const resetUrl = generatePasswordResetUrl(resetToken.token);

  // Send the password reset email
  await sendPasswordResetEmail(user, resetUrl);

  res.json({
    message: 'If your email is registered, you will receive a password reset link shortly.',
  });
});

/**
 * Reset password using a token
 * This endpoint allows users to reset their password using a token received via email
 * It verifies the token, validates the new password, and updates the user's password
 */
module.exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Token and password are required',
    });
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      error: 'Bad Request',
      message: passwordValidation.message,
    });
  }

  try {
    // Verify the token
    const resetToken = await verifyPasswordResetToken(token);

    // Find the user
    const user = await User.findById(resetToken.user);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Hash the new password
    const { hashPassword } = require('../../utils/passwordUtils');
    const hashedPassword = await hashPassword(password);

    // Update the user's password
    user.password = hashedPassword;

    // Add audit log entry directly to the user document
    // Create the password change event
    const passwordChangeEvent = {
      date: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      reason: 'reset',
    };

    // If the user doesn't have a passwordHistory array, create one
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }

    // Add the event to the user's password history
    user.passwordHistory.push(passwordChangeEvent);

    // Save the user with both password change and audit log in a single operation
    await user.save();

    // Mark the token as used (separate document, so no version conflict)
    await markPasswordResetTokenAsUsed(token);

    res.json({
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    // Provide more specific error messages for token validation issues
    if (
      error.message.includes('invalid') ||
      error.message.includes('expired') ||
      error.message.includes('used')
    ) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message,
      });
    }

    throw error; // Let asyncHandler handle other errors
  }
});

/**
 * Google OAuth login/signup
 * This endpoint handles the OAuth flow with Google
 * It can be used for both login and signup
 */
module.exports.googleAuth = asyncHandler(async (req, res) => {
  const { code, redirectUri } = req.body;

  if (!code || !redirectUri) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Authorization code and redirect URI are required',
    });
  }

  try {
    // Exchange the authorization code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    // Get the user's profile information
    const { access_token } = tokenResponse.data;
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { sub: googleId, email, name, picture } = profileResponse.data;

    // Check if the user already exists with this Google ID
    let user = await User.findOne({ googleId: googleId });

    // If user doesn't exist with Google ID, check if email is already registered
    if (!user && email) {
      const existingUserWithEmail = await User.findOne({ email });
      if (existingUserWithEmail) {
        // Check if the existing user has a password (traditional registration)
        if (existingUserWithEmail.password) {
          return res.status(409).json({
            error: 'Account Conflict',
            message:
              'An account with this email already exists. Please log in using your email and password instead of Google OAuth.',
            code: 'EMAIL_ALREADY_REGISTERED',
            email: email,
          });
        }
        // If user exists but has no password (OAuth-only account), link the accounts
        user = existingUserWithEmail;
        user.googleId = googleId;
        await user.save();
      }
    }

    // If user still doesn't exist, create a new account
    if (!user) {
      // Generate a random password for the user
      const randomPassword = crypto.randomBytes(16).toString('hex');

      // Hash the random password
      const { hashPassword } = require('../../utils/passwordUtils');
      const hashedPassword = await hashPassword(randomPassword);

      // Create a new user
      user = new User({
        username: email.split('@')[0] + '_' + Date.now().toString().slice(-4),
        email,
        googleId,
        password: hashedPassword,
        isEmailVerified: true, // Google accounts have verified emails
        emailVerifiedAt: new Date(),
        profile: {
          name,
          picture,
        },
      });

      // Save the user
      await user.save();
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact support for more information.',
      });
    }

    // If user is an owner, also check owner suspension status
    if (user.isOwner) {
      const Owner = require('../../models/owner');
      const owner = await Owner.findOne({ user: user._id });

      if (owner && !owner.isActive) {
        return res.status(403).json({
          error: 'Owner account suspended',
          message:
            'Your owner account has been suspended. Please contact support for more information.',
        });
      }
    }

    // ENFORCE 2FA FOR GOOGLE OAUTH USERS
    if (user.isTwoFactorEnabled) {
      // Generate a temporary access token for 2FA verification (10 minutes)
      const { generateAccessToken } = require('../../utils/jwtUtils');
      const tempAccessToken = generateAccessToken(user, '10m');

      return res.status(200).json({
        requiresTwoFactor: true,
        message: 'Two-factor authentication required',
        tempAccessToken,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          isOwner: user.isOwner,
          isEmailVerified: user.isEmailVerified,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
          googleId: user.googleId || null,
          profile: user.profile || {},
        },
      });
    }

    // If 2FA is not enabled, proceed as before
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req);

    // Return the tokens
    res.json({
      accessToken,
      refreshToken: refreshToken.token,
      expiresAt: refreshToken.expiresAt,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isOwner: user.isOwner,
        isEmailVerified: user.isEmailVerified,
        googleId: user.googleId || null,
        profile: user.profile || {},
      },
    });
  } catch (error) {
    logError('Google OAuth error', error, {
      responseData: error.response?.data,
      message: error.message,
    });
    return res.status(400).json({
      error: 'OAuth Error',
      message: 'Failed to authenticate with Google',
    });
  }
});

/**
 * Check authentication status
 * This endpoint allows clients to check if the user is authenticated
 * It returns the user's data if authenticated
 */
module.exports.checkAuthStatus = asyncHandler(async (req, res) => {
  // If user is authenticated (set by authenticateJWT middleware)
  if (req.user) {
    // Return user data (excluding sensitive information)
    const userResponse = {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      phone: req.user.phone,
      isAdmin: req.user.isAdmin || false,
      isOwner: req.user.isOwner || false,
      isEmailVerified: req.user.isEmailVerified,
      isTwoFactorEnabled: req.user.isTwoFactorEnabled || false,
      googleId: req.user.googleId || null, // Add googleId to identify OAuth users
      profile: req.user.profile || {},
    };

    return res.json({
      isAuthenticated: true,
      user: userResponse,
      emailVerified: req.user.isEmailVerified,
      requiresTwoFactor: false, // JWT authentication doesn't use session-based 2FA
    });
  }

  // If not authenticated
  res.json({
    isAuthenticated: false,
    user: null,
    emailVerified: false,
    requiresTwoFactor: false,
  });
});
