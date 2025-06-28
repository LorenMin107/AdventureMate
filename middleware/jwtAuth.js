const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwtUtils');
const User = require('../models/user');
const ExpressError = require('../utils/ExpressError');

/**
 * Middleware to authenticate requests using JWT
 * This middleware checks for a valid JWT in the Authorization header
 * and sets req.user if the token is valid
 */
const authenticateJWT = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req);

    if (!token) {
      return next(); // No token provided, continue without authentication
    }

    // Verify the token
    const decoded = verifyAccessToken(token);

    // Find the user
    const user = await User.findById(decoded.sub);

    if (!user) {
      return next(); // User not found, continue without authentication
    }

    // Set the user in the request object
    req.user = user;
    req.isAuthenticated = () => true; // For compatibility with passport

    next();
  } catch (error) {
    // Token verification failed, continue without authentication
    next();
  }
};

/**
 * Middleware to require authentication
 * This middleware should be used after authenticateJWT
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
  }
  next();
};

/**
 * Middleware to check if user is an admin
 * This middleware should be used after authenticateJWT and requireAuth
 */
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Admin privileges required' 
    });
  }
  next();
};

/**
 * Middleware to check if user is an owner
 * This middleware should be used after authenticateJWT and requireAuth
 */
const requireOwner = (req, res, next) => {
  if (!req.user.isOwner) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Owner privileges required' 
    });
  }
  next();
};

/**
 * Middleware to check if user's email is verified
 * This middleware should be used after authenticateJWT and requireAuth
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Email verification required. Please verify your email address before accessing this resource.' 
    });
  }
  next();
};

module.exports = {
  authenticateJWT,
  requireAuth,
  requireAdmin,
  requireOwner,
  requireEmailVerified
};
