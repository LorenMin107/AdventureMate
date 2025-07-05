const User = require('../../models/user');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  blacklistAccessToken,
} = require('../../utils/jwtUtils');
const { validatePasswordStrength } = require('../../utils/passwordUtils');
const {
  verifyEmailToken,
  markEmailTokenAsUsed,
  generateEmailVerificationToken,
  generateVerificationUrl,
  findUsedToken,
} = require('../../utils/emailUtils');
const {
  generatePasswordResetToken,
  generatePasswordResetUrl,
  verifyPasswordResetToken,
  markPasswordResetTokenAsUsed,
} = require('../../utils/passwordUtils');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../utils/emailService');
const { asyncHandler } = require('../../utils/errorHandler');
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

  // Create and register the new user
  const user = new User({ email, username, phone });
  const registeredUser = await User.register(user, password);

  try {
    // Generate email verification token
    const verificationToken = await generateEmailVerificationToken(registeredUser, req);

    // Generate verification URL
    const verificationUrl = generateVerificationUrl(verificationToken.token);

    // Send verification email
    await sendVerificationEmail(registeredUser, verificationUrl);
  } catch (emailError) {
    console.error('Error sending verification email:', emailError);
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
 * Login with username and password
 * Returns JWT access token and refresh token
 */
module.exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Find the user
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Username or password is incorrect',
    });
  }

  // Authenticate the user using passport-local-mongoose
  const isValid = await user.authenticate(password);
  if (!isValid.user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Username or password is incorrect',
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
      console.error('Error sending verification email:', error);
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

    // Revoke the old refresh token (token rotation for security)
    await refreshTokenDoc.revoke();
    console.log(`Refresh token rotated for user ${user._id}`);

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
      console.log(`Access token blacklisted for user ${req.user._id} during logout`);
    }

    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error during logout:', error);
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
      console.log(
        `Access token blacklisted for user ${req.user._id} during logout from all devices`
      );
    }

    res.json({
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    console.error('Error during logout from all devices:', error);
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
  console.log('Verify email endpoint called');
  console.log('Request query:', req.query);

  const { token } = req.query;
  console.log('Token from query:', token);

  if (!token) {
    console.log('No token provided in request');
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Verification token is required',
    });
  }

  try {
    // Verify the token
    console.log('Calling verifyEmailToken with token:', token);
    const verificationToken = await verifyEmailToken(token);
    console.log('Token verified successfully');

    // Get the user
    console.log('Finding user with ID:', verificationToken.user);
    const user = await User.findById(verificationToken.user);
    if (!user) {
      console.log('User not found with ID:', verificationToken.user);
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }
    console.log('User found:', user.username);

    // Check if email is already verified
    if (user.isEmailVerified) {
      console.log('Email already verified for user:', user.username);

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
    console.log('Marking user email as verified');
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();
    console.log('User updated with verified email');

    // Mark the token as used
    console.log('Marking token as used');
    await markEmailTokenAsUsed(token);
    console.log('Token marked as used');

    console.log('Email verification successful');

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
    console.log('Error verifying email:', error.message);

    // Check if this is a "token already used" error
    if (error.message.includes('already been used')) {
      console.log('Token has been used, checking if we can find the associated user');

      try {
        // Try to find the used token
        const usedToken = await findUsedToken(token);

        if (usedToken) {
          // Get the user associated with this token
          const user = await User.findById(usedToken.user);

          if (user && user.isEmailVerified) {
            console.log('Found user with already verified email:', user.username);

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
        console.log('Error while checking used token:', innerError);
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
    console.error('Error sending verification email:', error);
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
    console.log(`Password reset requested for non-existent email: ${email}`);
    return res.json({
      message: 'If your email is registered, you will receive a password reset link shortly.',
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

    // Set the new password
    await user.setPassword(password);

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

    // Check if the user already exists
    let user = await User.findOne({ googleId: googleId });

    // If user doesn't exist but email is registered, link the accounts
    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        // Link the Google account to the existing user
        user.googleId = googleId;
        await user.save();
      }
    }

    // If user still doesn't exist, create a new account
    if (!user) {
      // Generate a random password for the user
      const randomPassword = crypto.randomBytes(16).toString('hex');

      // Create a new user
      user = new User({
        username: email.split('@')[0] + '_' + Date.now().toString().slice(-4),
        email,
        googleId,
        isEmailVerified: true, // Google accounts have verified emails
        emailVerifiedAt: new Date(),
        profile: {
          name,
          picture,
        },
      });

      // Register the user with the random password
      await User.register(user, randomPassword);
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
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
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

/**
 * Facebook OAuth login/signup
 * This endpoint handles the OAuth flow with Facebook
 * It can be used for both login and signup
 */
module.exports.facebookAuth = asyncHandler(async (req, res) => {
  const { code, redirectUri } = req.body;

  if (!code || !redirectUri) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Authorization code and redirect URI are required',
    });
  }

  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v12.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      },
    });

    const { access_token } = tokenResponse.data;

    // Get the user's profile information
    const profileResponse = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token,
      },
    });

    const { id: facebookId, email, name, picture } = profileResponse.data;

    // Check if the user already exists
    let user = await User.findOne({ facebookId: facebookId });

    // If user doesn't exist but email is registered, link the accounts
    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        // Link the Facebook account to the existing user
        user.facebookId = facebookId;
        await user.save();
      }
    }

    // If user still doesn't exist, create a new account
    if (!user) {
      // Generate a random password for the user
      const randomPassword = crypto.randomBytes(16).toString('hex');

      // Create a new user
      user = new User({
        username: (email ? email.split('@')[0] : 'fb_user') + '_' + Date.now().toString().slice(-4),
        email: email || `fb_${facebookId}@placeholder.com`, // Some Facebook users might not have an email
        facebookId,
        isEmailVerified: !!email, // Only mark as verified if email is provided
        emailVerifiedAt: email ? new Date() : undefined,
        profile: {
          name,
          picture: picture?.data?.url,
        },
      });

      // Register the user with the random password
      await User.register(user, randomPassword);
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
      },
    });
  } catch (error) {
    console.error('Facebook OAuth error:', error.response?.data || error.message);
    return res.status(400).json({
      error: 'OAuth Error',
      message: 'Failed to authenticate with Facebook',
    });
  }
});
