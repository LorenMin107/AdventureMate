const Owner = require('../models/owner');
const ExpressError = require('../utils/ExpressError');
const { logError, logInfo, logDebug } = require('../utils/logger');

/**
 * Middleware to check if user is a verified owner
 * This middleware should be used after authenticateJWT and requireAuth
 */
const requireVerifiedOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check if user has owner flag in their profile
    if (!req.user.isOwner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Owner privileges required',
      });
    }

    // Find the owner record for this user
    const owner = await Owner.findOne({ user: req.user._id });

    if (!owner) {
      // Create a basic owner profile if it doesn't exist
      const newOwner = new Owner({
        user: req.user._id,
        businessName: `${req.user.username}'s Business`,
        businessType: 'individual',
        businessAddress: {
          street: 'Not provided',
          city: 'Not provided',
          state: 'Not provided',
          zipCode: 'Not provided',
          country: 'Myanmar',
        },
        businessPhone: req.user.phone || 'Not provided',
        businessEmail: req.user.email,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verificationNotes: [
          {
            note: 'Owner profile automatically created due to missing record',
            type: 'system_note',
          },
        ],
      });

      await newOwner.save();

      // Add the newly created owner to request object
      req.owner = newOwner;
      logInfo('Created missing owner profile', { 
      userId: req.user._id,
      endpoint: req.originalUrl 
    });
      next();
      return;
    }

    if (owner.verificationStatus !== 'verified') {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Owner verification required. Current status: ${owner.verificationStatusDisplay}`,
      });
    }

    if (!owner.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Owner account is suspended. Please contact support.',
      });
    }

    // Add owner to request object for use in controllers
    req.owner = owner;
    next();
  } catch (error) {
    logError('Error in requireVerifiedOwner middleware', error, { 
      endpoint: req.originalUrl,
      userId: req.user?._id 
    });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify owner status',
    });
  }
};

/**
 * Middleware to check if user is an owner (any verification status)
 * This middleware should be used after authenticateJWT and requireAuth
 */
const requireOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check if user has owner flag in their profile
    if (!req.user.isOwner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Owner privileges required',
      });
    }

    // Find the owner record for this user
    const owner = await Owner.findOne({ user: req.user._id });

    if (!owner) {
      // Create a basic owner profile if it doesn't exist
      const newOwner = new Owner({
        user: req.user._id,
        businessName: `${req.user.username}'s Business`,
        businessType: 'individual',
        businessAddress: {
          street: 'Not provided',
          city: 'Not provided',
          state: 'Not provided',
          zipCode: 'Not provided',
          country: 'Myanmar',
        },
        businessPhone: req.user.phone || 'Not provided',
        businessEmail: req.user.email,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verificationNotes: [
          {
            note: 'Owner profile automatically created due to missing record',
            type: 'system_note',
          },
        ],
      });

      await newOwner.save();

      // Add the newly created owner to request object
      req.owner = newOwner;
      logInfo('Created missing owner profile', { 
      userId: req.user._id,
      endpoint: req.originalUrl 
    });
      next();
      return;
    }

    if (!owner.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Owner account is suspended. Please contact support.',
      });
    }

    // Add owner to request object for use in controllers
    req.owner = owner;
    next();
  } catch (error) {
    logError('Error in requireOwner middleware', error, { 
      endpoint: req.originalUrl,
      userId: req.user?._id 
    });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify owner status',
    });
  }
};

/**
 * Middleware to check if user owns a specific campground
 * This middleware should be used after authenticateJWT, requireAuth, and requireOwner
 */
const requireCampgroundOwnership = async (req, res, next) => {
  try {
    const campgroundId = req.params.id || req.params.campgroundId;

    if (!campgroundId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Campground ID is required',
      });
    }

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check if user has owner flag in their profile
    if (!req.user.isOwner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Owner privileges required',
      });
    }

    // If req.owner is not set, find or create the owner record
    if (!req.owner) {
      const owner = await Owner.findOne({ user: req.user._id });

      if (!owner) {
        // Create a basic owner profile if it doesn't exist
        const newOwner = new Owner({
          user: req.user._id,
          businessName: `${req.user.username}'s Business`,
          businessType: 'individual',
          businessAddress: {
            street: 'Not provided',
            city: 'Not provided',
            state: 'Not provided',
            zipCode: 'Not provided',
            country: 'Myanmar',
          },
          businessPhone: req.user.phone || 'Not provided',
          businessEmail: req.user.email,
          verificationStatus: 'verified',
          verifiedAt: new Date(),
          verificationNotes: [
            {
              note: 'Owner profile automatically created due to missing record',
              type: 'system_note',
            },
          ],
        });

        await newOwner.save();
        req.owner = newOwner;
        logInfo('Created missing owner profile', { 
      userId: req.user._id,
      endpoint: req.originalUrl 
    });
      } else {
        req.owner = owner;
      }
    }

    // Check if the campground is in the owner's campgrounds array
    const ownsCampground = req.owner.campgrounds.some((id) => id.toString() === campgroundId);

    if (!ownsCampground) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this campground',
      });
    }

    next();
  } catch (error) {
    logError('Error in requireCampgroundOwnership middleware', error, { 
      endpoint: req.originalUrl,
      userId: req.user?._id,
      campgroundId: req.params.id || req.params.campgroundId 
    });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify campground ownership',
    });
  }
};

/**
 * Middleware to check if user can manage campgrounds (verified owner)
 * This middleware should be used after authenticateJWT and requireAuth
 */
const canManageCampgrounds = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check if user has owner flag in their profile
    if (!req.user.isOwner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Owner privileges required',
      });
    }

    // Find the owner record for this user
    const owner = await Owner.findOne({ user: req.user._id });

    if (!owner) {
      // Create a basic owner profile if it doesn't exist
      const newOwner = new Owner({
        user: req.user._id,
        businessName: `${req.user.username}'s Business`,
        businessType: 'individual',
        businessAddress: {
          street: 'Not provided',
          city: 'Not provided',
          state: 'Not provided',
          zipCode: 'Not provided',
          country: 'Myanmar',
        },
        businessPhone: req.user.phone || 'Not provided',
        businessEmail: req.user.email,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verificationNotes: [
          {
            note: 'Owner profile automatically created due to missing record',
            type: 'system_note',
          },
        ],
      });

      await newOwner.save();

      // Add the newly created owner to request object
      req.owner = newOwner;
      logInfo('Created missing owner profile', { 
      userId: req.user._id,
      endpoint: req.originalUrl 
    });
      next();
      return;
    }

    if (!owner.canManageCampgrounds()) {
      const message =
        owner.verificationStatus !== 'verified'
          ? `Owner verification required. Current status: ${owner.verificationStatusDisplay}`
          : 'Owner account is suspended. Please contact support.';

      return res.status(403).json({
        error: 'Forbidden',
        message,
      });
    }

    // Add owner to request object for use in controllers
    req.owner = owner;
    next();
  } catch (error) {
    logError('Error in canManageCampgrounds middleware', error, { 
      endpoint: req.originalUrl,
      userId: req.user?._id 
    });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify campground management permissions',
    });
  }
};

/**
 * Middleware to populate owner data for authenticated users
 * This middleware should be used after authenticateJWT
 * It adds owner data to req.owner if the user is an owner, but doesn't require it
 */
const populateOwner = async (req, res, next) => {
  try {
    if (req.user) {
      const owner = await Owner.findOne({ user: req.user._id });
      if (owner) {
        req.owner = owner;
      }
    }
    next();
  } catch (error) {
    logError('Error in populateOwner middleware', error, { 
      endpoint: req.originalUrl,
      userId: req.user?._id 
    });
    // Don't fail the request if owner population fails
    next();
  }
};

module.exports = {
  requireVerifiedOwner,
  requireOwner,
  requireCampgroundOwnership,
  canManageCampgrounds,
  populateOwner,
};
