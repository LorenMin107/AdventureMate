const User = require('../../models/user');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  revokeRefreshToken,
  revokeAllUserTokens
} = require('../../utils/jwtUtils');
const { 
  verifyEmailToken, 
  markEmailTokenAsUsed, 
  generateEmailVerificationToken, 
  generateVerificationUrl,
  findUsedToken
} = require('../../utils/emailUtils');
const { sendVerificationEmail } = require('../../utils/emailService');
const { asyncHandler } = require('../../utils/errorHandler');

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
      message: 'Username or password is incorrect'
    });
  }

  // Authenticate the user using passport-local-mongoose
  const isValid = await user.authenticate(password);
  if (!isValid.user) {
    return res.status(401).json({ 
      error: 'Invalid credentials',
      message: 'Username or password is incorrect'
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
        isEmailVerified: false
      }
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
      isEmailVerified: user.isEmailVerified
    }
  });
});

/**
 * Refresh access token using refresh token
 * Returns new JWT access token
 */
module.exports.refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Refresh token is required'
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
        message: 'User not found'
      });
    }

    // Generate a new access token
    const accessToken = generateAccessToken(user);

    // Return the new access token
    res.json({
      accessToken
    });
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid token',
      message: error.message
    });
  }
});

/**
 * Logout by revoking the refresh token
 */
module.exports.logout = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Refresh token is required'
    });
  }

  // Revoke the refresh token
  await revokeRefreshToken(token);

  res.json({
    message: 'Logged out successfully'
  });
});

/**
 * Logout from all devices by revoking all refresh tokens for the user
 */
module.exports.logoutAll = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Revoke all refresh tokens for the user
  await revokeAllUserTokens(req.user._id);

  res.json({
    message: 'Logged out from all devices successfully'
  });
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
      message: 'Verification token is required'
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
        message: 'User not found'
      });
    }
    console.log('User found:', user.username);

    // Check if email is already verified
    if (user.isEmailVerified) {
      console.log('Email already verified for user:', user.username);
      return res.json({
        message: 'Email already verified. You can now login to your account.',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          isEmailVerified: user.isEmailVerified
        }
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
    res.json({
      message: 'Email verified successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
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
            return res.json({
              message: 'Your email has already been verified. You can now login to your account.',
              user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                isEmailVerified: user.isEmailVerified
              }
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
      message: error.message
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
      message: 'Authentication required'
    });
  }

  // Check if email is already verified
  if (req.user.isEmailVerified) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Email is already verified'
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
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    return res.status(500).json({ 
      error: 'Server Error',
      message: 'Failed to send verification email'
    });
  }
});
