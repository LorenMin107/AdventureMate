const User = require('../../models/user');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  revokeRefreshToken,
  revokeAllUserTokens
} = require('../../utils/jwtUtils');
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
      isOwner: user.isOwner
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
