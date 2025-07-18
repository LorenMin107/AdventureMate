const User = require('../../models/user');
const Contact = require('../../models/contact');
const Review = require('../../models/review');
const Campground = require('../../models/campground');
const Booking = require('../../models/booking');
const {
  generateEmailVerificationToken,
  generateVerificationUrl,
} = require('../../utils/emailUtils');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../utils/emailService');
const {
  generatePasswordResetToken,
  generatePasswordResetUrl,
  verifyPasswordResetToken,
  markPasswordResetTokenAsUsed,
  validatePasswordStrength,
  createPasswordChangeAuditLog,
} = require('../../utils/passwordUtils');
const { logError, logInfo, logWarn } = require('../../utils/logger');
const { cloudinary } = require('../../cloudinary');
const Invite = require('../../models/invite');
const Trip = require('../../models/trip');

module.exports.register = async (req, res) => {
  try {
    const { email, username, password, phone, invite } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        error: 'A user with that email or username already exists',
      });
    }

    // Hash the password
    const { hashPassword } = require('../../utils/passwordUtils');
    const hashedPassword = await hashPassword(password);

    const user = new User({ email, username, phone, password: hashedPassword });
    await user.save();
    const registeredUser = user;

    // Handle invite token if present
    const inviteToken = invite || req.query.invite;
    if (inviteToken) {
      const pendingInvite = await Invite.findOne({ token: inviteToken, status: 'pending' });
      if (pendingInvite) {
        // Add user as collaborator to the trip
        const trip = await Trip.findById(pendingInvite.trip);
        if (trip) {
          if (!trip.collaborators.includes(user._id)) {
            trip.collaborators.push(user._id);
            await trip.save();
          }
        }
        // Add trip to user's sharedTrips
        if (!user.sharedTrips.includes(trip._id)) {
          user.sharedTrips.push(trip._id);
          await user.save();
        }
        // Mark invite as accepted (or delete)
        pendingInvite.status = 'accepted';
        await pendingInvite.save();
      }
    }

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

    // Return user data (excluding sensitive information) without logging in
    const userResponse = {
      _id: registeredUser._id,
      username: registeredUser.username,
      email: registeredUser.email,
      phone: registeredUser.phone,
      isEmailVerified: registeredUser.isEmailVerified,
    };

    res.status(201).json({
      user: userResponse,
      message:
        'Registration successful. Please check your email to verify your account before logging in.',
    });
  } catch (error) {
    logError('Registration error', error, {
      endpoint: '/api/v1/users/register',
      body: { email: req.body.email, username: req.body.username },
    });
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
};

// This function is deprecated - login is now handled by auth.js
module.exports.login = (req, res) => {
  return res.status(308).json({
    message: 'This endpoint is deprecated. Please use /api/v1/auth/login instead.',
    redirectTo: '/api/v1/auth/login',
  });
};

// This function is deprecated - logout is now handled by auth.js
module.exports.logout = (req, res) => {
  return res.status(308).json({
    message: 'This endpoint is deprecated. Please use /api/v1/auth/logout instead.',
    redirectTo: '/api/v1/auth/logout',
  });
};

module.exports.getUser = async (req, res) => {
  try {
    // Return current user data if authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // First, get the user with their reviews and bookings
    // Make sure we're only getting bookings that belong to this user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Populate reviews
    await user.populate({
      path: 'reviews',
      populate: {
        path: 'campground',
        select: 'title location images',
      },
    });

    // Get only bookings that belong to this user
    const userBookings = await Booking.find({
      user: user._id,
      _id: { $in: user.bookings }, // Ensure booking is in user's bookings array
    }).populate([
      {
        path: 'campground',
        select: 'title location images',
      },
      {
        path: 'campsite',
        select: 'name description features price capacity images',
      },
    ]);

    // Replace the bookings array with the filtered bookings
    user.bookings = userBookings;

    // Ensure all bookings have valid campground and campsite data
    // If a booking has an invalid reference, fetch the data directly
    const Campground = require('../../models/campground');
    const Campsite = require('../../models/campsite');

    // Process each review to ensure campground data is available
    for (let i = 0; i < user.reviews.length; i++) {
      const review = user.reviews[i];

      // Check if campground data is missing and try to fetch it
      if (!review.campground || !review.campground.title) {
        try {
          const campground = await Campground.findById(review.campground);
          if (campground) {
            // Update the review's campground data
            review.campground = {
              _id: campground._id,
              title: campground.title,
              location: campground.location,
              images: campground.images,
            };
          }
        } catch (err) {
          logError('Error fetching campground data for review', err, {
            userId: req.user?._id,
            reviewId: review._id,
          });
        }
      }
    }

    // Process each booking to ensure campground and campsite data is available
    for (let i = 0; i < user.bookings.length; i++) {
      const booking = user.bookings[i];

      // Check if campground data is missing and try to fetch it
      if (!booking.campground || !booking.campground.title) {
        try {
          const campground = await Campground.findById(booking.campground);
          if (campground) {
            // Update the booking's campground data
            booking.campground = {
              _id: campground._id,
              title: campground.title,
              location: campground.location,
              images: campground.images,
            };
          }
        } catch (err) {
          logError('Error fetching campground data for booking', err, {
            userId: req.user?._id,
            bookingId: booking._id,
          });
        }
      }

      // Check if campsite data is missing and try to fetch it
      if (booking.campsite && (!booking.campsite.name || typeof booking.campsite === 'string')) {
        try {
          const campsite = await Campsite.findById(booking.campsite);
          if (campsite) {
            // Update the booking's campsite data
            booking.campsite = {
              _id: campsite._id,
              name: campsite.name,
              description: campsite.description,
              features: campsite.features,
              price: campsite.price,
              capacity: campsite.capacity,
              images: campsite.images,
            };
          }
        } catch (err) {
          logError('Error fetching campsite data', err, {
            userId: req.user?._id,
            bookingId: booking._id,
          });
        }
      }
    }

    // Return user data (excluding sensitive information)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin || false,
      isOwner: user.isOwner || false,
      isEmailVerified: user.isEmailVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled || false,
      profile: user.profile || {},
      reviews: user.reviews,
      bookings: user.bookings,
    };

    res.json({
      user: userResponse,
      emailVerified: user.isEmailVerified,
    });
  } catch (error) {
    logError('Error fetching user', error, {
      userId: req.user?._id,
      endpoint: '/api/v1/users/profile',
    });
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
};

// This function is deprecated - auth status is now handled by auth.js
module.exports.checkAuthStatus = async (req, res) => {
  return res.status(308).json({
    message: 'This endpoint is deprecated. Please use /api/v1/auth/status instead.',
    redirectTo: '/api/v1/auth/status',
  });
};

module.exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'You must be logged in to get your profile' });
    }

    // Find the user by ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Populate reviews
    await user.populate('reviews');

    // Get only bookings that belong to this user
    const userBookings = await Booking.find({
      user: user._id,
      _id: { $in: user.bookings }, // Ensure booking is in user's bookings array
    }).populate([
      {
        path: 'campground',
        select: 'title location images',
      },
      {
        path: 'campsite',
        select: 'name description features price capacity images',
      },
    ]);

    // Replace the bookings array with the filtered bookings
    user.bookings = userBookings;

    // Ensure all bookings have valid campground and campsite data
    const Campground = require('../../models/campground');
    const Campsite = require('../../models/campsite');

    // Validate and fix any missing campground or campsite references
    for (let booking of user.bookings) {
      if (!booking.campground) {
        // Try to find the campground
        const campground = await Campground.findById(booking.campgroundId);
        if (campground) {
          booking.campground = campground;
        }
      }
      if (!booking.campsite && booking.campsiteId) {
        // Try to find the campsite
        const campsite = await Campsite.findById(booking.campsiteId);
        if (campsite) {
          booking.campsite = campsite;
        }
      }
    }

    // Create user response object
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin || false,
      isOwner: user.isOwner || false,
      isEmailVerified: user.isEmailVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled || false,
      profile: user.profile || {},
      reviews: user.reviews || [],
      bookings: user.bookings || [],
    };

    res.json({
      user: userResponse,
      emailVerified: user.isEmailVerified,
    });
  } catch (error) {
    logError('Error getting profile', error, {
      userId: req.user?._id,
      endpoint: '/api/v1/users/profile',
    });
    res.status(400).json({ error: error.message || 'Failed to get profile' });
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'You must be logged in to update your profile' });
    }

    const { phone, username, profileName, removeProfilePicture } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the phone number
    if (phone !== undefined) user.phone = phone;

    // Update username if provided and different
    if (username && username !== user.username) {
      // Check uniqueness
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      user.username = username;
    }

    // Update display name (profile.name) if provided
    if (profileName !== undefined) {
      if (!user.profile) user.profile = {};
      user.profile.name = profileName;
    }

    // Handle profile picture removal if requested
    if (removeProfilePicture && user.profile?.picture) {
      try {
        // Extract public ID from the URL
        const urlParts = user.profile.picture.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        logInfo('Profile picture removed from Cloudinary', { userId: user._id, publicId });

        // Remove the picture URL from user profile
        if (!user.profile) user.profile = {};
        user.profile.picture = null;
      } catch (deleteError) {
        logWarn('Failed to delete profile picture from Cloudinary', deleteError, {
          userId: user._id,
        });
        // Still remove the URL from the database even if Cloudinary deletion fails
        if (!user.profile) user.profile = {};
        user.profile.picture = null;
      }
    }

    // Handle profile picture upload if provided
    if (req.file) {
      // Delete old profile picture from Cloudinary if it exists
      if (user.profile?.picture) {
        try {
          // Extract public ID from the URL
          const urlParts = user.profile.picture.split('/');
          const publicId = urlParts[urlParts.length - 1].split('.')[0];
          await cloudinary.uploader.destroy(publicId);
          logInfo('Old profile picture deleted from Cloudinary', { userId: user._id, publicId });
        } catch (deleteError) {
          logWarn('Failed to delete old profile picture', deleteError, { userId: user._id });
          // Continue with upload even if deletion fails
        }
      }

      // Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'profile-pictures',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
        public_id: `user-${user._id}-${Date.now()}`,
      });

      // Update user profile with new picture URL
      if (!user.profile) user.profile = {};
      user.profile.picture = result.secure_url;

      logInfo('Profile picture uploaded successfully', {
        userId: user._id,
        publicId: result.public_id,
        url: result.secure_url,
      });
    }

    await user.save();

    // Fetch the updated user
    const updatedUser = await User.findById(user._id);

    // Populate reviews
    await updatedUser.populate('reviews');

    // Get only bookings that belong to this user
    const userBookings = await Booking.find({
      user: updatedUser._id,
      _id: { $in: updatedUser.bookings }, // Ensure booking is in user's bookings array
    }).populate([
      {
        path: 'campground',
        select: 'title location images',
      },
      {
        path: 'campsite',
        select: 'name description features price capacity images',
      },
    ]);

    // Replace the bookings array with the filtered bookings
    updatedUser.bookings = userBookings;

    // Ensure all bookings have valid campground and campsite data
    const Campground = require('../../models/campground');
    const Campsite = require('../../models/campsite');
    for (let i = 0; i < updatedUser.bookings.length; i++) {
      const booking = updatedUser.bookings[i];
      if (!booking.campground || !booking.campground.title) {
        try {
          const campground = await Campground.findById(booking.campground);
          if (campground) {
            booking.campground = {
              _id: campground._id,
              title: campground.title,
              location: campground.location,
              images: campground.images,
            };
          }
        } catch (err) {
          logError('Error fetching campground data', err, {
            userId: req.user?._id,
            reviewId: booking._id,
          });
        }
      }
      if (booking.campsite && (!booking.campsite.name || typeof booking.campsite === 'string')) {
        try {
          const campsite = await Campsite.findById(booking.campsite);
          if (campsite) {
            booking.campsite = {
              _id: campsite._id,
              name: campsite.name,
              description: campsite.description,
              features: campsite.features,
              price: campsite.price,
              capacity: campsite.capacity,
              images: campsite.images,
            };
          }
        } catch (err) {
          logError('Error fetching campsite data', err, {
            userId: req.user?._id,
            bookingId: booking._id,
          });
        }
      }
    }

    // Return updated user data (excluding sensitive information)
    const userResponse = {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin || false,
      isOwner: updatedUser.isOwner || false,
      isEmailVerified: updatedUser.isEmailVerified,
      isTwoFactorEnabled: updatedUser.isTwoFactorEnabled || false,
      reviews: updatedUser.reviews,
      bookings: updatedUser.bookings,
      profile: updatedUser.profile || {},
    };

    res.json({
      user: userResponse,
      emailVerified: user.isEmailVerified,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logError('Error updating profile', error, {
      userId: req.user?._id,
      endpoint: '/api/v1/users/profile',
    });
    res.status(400).json({ error: error.message || 'Failed to update profile' });
  }
};

module.exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'You must be logged in to upload a profile picture' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Find the user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile picture from Cloudinary if it exists
    if (user.profile?.picture) {
      try {
        // Extract public ID from the URL
        const urlParts = user.profile.picture.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        logInfo('Old profile picture deleted from Cloudinary', { userId: user._id, publicId });
      } catch (deleteError) {
        logWarn('Failed to delete old profile picture', deleteError, { userId: user._id });
        // Continue with upload even if deletion fails
      }
    }

    // Upload new image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'profile-pictures',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
      public_id: `user-${user._id}-${Date.now()}`,
    });

    // Update user profile with new picture URL
    if (!user.profile) user.profile = {};
    user.profile.picture = result.secure_url;
    await user.save();

    logInfo('Profile picture uploaded successfully', {
      userId: user._id,
      publicId: result.public_id,
      url: result.secure_url,
    });

    // Return updated user data
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin || false,
      isOwner: user.isOwner || false,
      isEmailVerified: user.isEmailVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled || false,
      profile: user.profile || {},
    };

    res.json({
      user: userResponse,
      message: 'Profile picture uploaded successfully',
    });
  } catch (error) {
    logError('Error uploading profile picture', error, {
      userId: req.user?._id,
      endpoint: '/api/v1/users/profile-picture',
    });
    res.status(400).json({ error: error.message || 'Failed to upload profile picture' });
  }
};

module.exports.removeProfilePicture = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: 'You must be logged in to remove your profile picture' });
    }

    // Find the user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete profile picture from Cloudinary if it exists
    if (user.profile?.picture) {
      try {
        // Extract public ID from the URL
        const urlParts = user.profile.picture.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        logInfo('Profile picture deleted from Cloudinary', { userId: user._id, publicId });
      } catch (deleteError) {
        logWarn('Failed to delete profile picture from Cloudinary', deleteError, {
          userId: user._id,
        });
        // Continue with removal even if Cloudinary deletion fails
      }
    }

    // Remove profile picture from user profile
    if (user.profile) {
      user.profile.picture = undefined;
      await user.save();
    }

    logInfo('Profile picture removed successfully', { userId: user._id });

    // Return updated user data
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin || false,
      isOwner: user.isOwner || false,
      isEmailVerified: user.isEmailVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled || false,
      profile: user.profile || {},
    };

    res.json({
      user: userResponse,
      message: 'Profile picture removed successfully',
    });
  } catch (error) {
    logError('Error removing profile picture', error, {
      userId: req.user?._id,
      endpoint: '/api/v1/users/profile-picture',
    });
    res.status(400).json({ error: error.message || 'Failed to remove profile picture' });
  }
};

module.exports.submitContact = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'You must be logged in to submit a contact form' });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const user = req.user;
    const newContact = new Contact({
      name: user.username,
      email: user.email,
      message,
      user: user._id,
    });

    await newContact.save();

    // Associate contact with user
    user.contacts.push(newContact._id);
    await user.save();

    res.status(201).json({
      contact: newContact,
      message: 'Contact message submitted successfully',
    });
  } catch (error) {
    logError('Error submitting contact', error, {
      userId: req.user?._id,
      endpoint: '/api/v1/users/contact',
    });
    res.status(400).json({ error: error.message || 'Failed to submit contact message' });
  }
};

module.exports.getUserReviews = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'You must be logged in to view your reviews' });
    }

    // Find all campgrounds that have reviews by the current user
    const campgrounds = await Campground.find({ reviews: { $exists: true, $ne: [] } }).populate({
      path: 'reviews',
      match: { author: req.user._id },
      populate: { path: 'author', select: 'username' },
    });

    // Extract and format the reviews
    let userReviews = [];

    for (const campground of campgrounds) {
      // Only include campgrounds that have reviews by the current user after population
      if (campground.reviews && campground.reviews.length > 0) {
        // Add campground info to each review
        const reviewsWithCampground = campground.reviews.map((review) => {
          // Convert to plain object to allow adding properties
          const reviewObj = review.toObject();
          reviewObj.campground = {
            _id: campground._id,
            title: campground.title || 'Unknown Campground', // Provide a default if title is missing
            location: campground.location,
          };
          return reviewObj;
        });

        userReviews = [...userReviews, ...reviewsWithCampground];
      }
    }

    // Process each review to ensure campground data is available
    for (let i = 0; i < userReviews.length; i++) {
      const review = userReviews[i];

      // Check if campground data is missing or incomplete and try to fetch it
      if (
        !review.campground ||
        !review.campground.title ||
        review.campground.title === 'Unknown Campground'
      ) {
        try {
          // Only try to fetch if we have a campground ID
          if (review.campground && review.campground._id) {
            const campground = await Campground.findById(review.campground._id);
            if (campground) {
              // Update the review's campground data
              review.campground = {
                _id: campground._id,
                title: campground.title || 'Unknown Campground',
                location: campground.location,
              };
            }
          } else if (review.campground_id) {
            // Try using campground_id if it exists
            const campground = await Campground.findById(review.campground_id);
            if (campground) {
              // Update the review's campground data
              review.campground = {
                _id: campground._id,
                title: campground.title || 'Unknown Campground',
                location: campground.location,
              };
            }
          }
        } catch (err) {
          logError('Error fetching campground data for review', err, {
            userId: req.user?._id,
            reviewId: review._id,
          });
        }
      }
    }

    // Sort reviews by _id (which contains a timestamp) as a fallback since createdAt might not be available
    // ObjectId's first 4 bytes represent a timestamp
    userReviews.sort((a, b) => {
      // If both have _id, use that for sorting (newer ObjectIds are "greater")
      if (a._id && b._id) {
        return b._id.toString().localeCompare(a._id.toString());
      }
      return 0;
    });

    res.json({
      reviews: userReviews,
      count: userReviews.length,
    });
  } catch (error) {
    logError('Error fetching user reviews', error, {
      userId: req.user?._id,
      endpoint: '/api/v1/users/reviews',
    });
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

/**
 * Request a password reset
 * This endpoint allows users to request a password reset by providing their email
 * It generates a reset token and sends an email with a reset link
 */
module.exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    // For security reasons, don't reveal if the email exists or not
    // Always return a success message even if the email doesn't exist
    if (!user) {
      logInfo('Password reset requested for non-existent email', {
        email,
      });
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
  } catch (error) {
    logError('Error requesting password reset', error, {
      email,
      endpoint: '/api/v1/users/request-password-reset',
    });
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

/**
 * Reset password using a token
 * This endpoint allows users to reset their password using a token received via email
 * It verifies the token, validates the new password, and updates the user's password
 */
module.exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Verify the token
    const resetToken = await verifyPasswordResetToken(token);

    // Find the user
    const user = await User.findById(resetToken.user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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

    // Log the audit entry creation
    logInfo('Password change audit log created', {
      userId: user._id,
    });

    // Save the user with both password change and audit log in a single operation
    await user.save();

    // Mark the token as used (separate document, so no version conflict)
    await markPasswordResetTokenAsUsed(token);

    res.json({
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    logError('Error resetting password', error, {
      endpoint: '/api/v1/users/reset-password',
    });

    // Provide more specific error messages for token validation issues
    if (
      error.message.includes('invalid') ||
      error.message.includes('expired') ||
      error.message.includes('used')
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to reset password' });
  }
};

/**
 * Change password for authenticated user
 * This endpoint allows users to change their password while logged in
 * It requires the current password for verification and 2FA code if enabled
 */
module.exports.changePassword = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'You must be logged in to change your password' });
    }

    const { currentPassword, newPassword, twoFactorCode } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Find the user by ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify the current password
    const { comparePassword } = require('../../utils/passwordUtils');
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Check if 2FA is enabled and verify 2FA code
    if (user.isTwoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(400).json({
          error: 'Two-factor authentication code is required',
          requiresTwoFactor: true,
        });
      }

      // Verify 2FA code
      const { verifyToken } = require('../../utils/twoFactorAuth');
      const isValidTwoFactor = verifyToken(twoFactorCode, user.twoFactorSecret);

      if (!isValidTwoFactor) {
        return res.status(400).json({
          error: 'Invalid two-factor authentication code',
          requiresTwoFactor: true,
        });
      }
    }

    // Validate the new password strength
    const { validatePasswordStrength } = require('../../utils/passwordUtils');
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Hash the new password
    const { hashPassword } = require('../../utils/passwordUtils');
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    user.password = hashedPassword;

    // Add audit log entry directly to the user document
    // Create the password change event
    const passwordChangeEvent = {
      date: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      reason: 'change',
    };

    // If the user doesn't have a passwordHistory array, create one
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }

    // Add the event to the user's password history
    user.passwordHistory.push(passwordChangeEvent);

    // Save the user with both password change and audit log in a single operation
    await user.save();

    logInfo('Password changed successfully', {
      userId: user._id,
      endpoint: '/api/v1/users/change-password',
      twoFactorUsed: user.isTwoFactorEnabled,
    });

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    logError('Error changing password', error, {
      userId: req.user?._id,
      endpoint: '/api/v1/users/change-password',
    });
    res.status(500).json({ error: 'Failed to change password' });
  }
};
