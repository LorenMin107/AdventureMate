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

module.exports.register = async (req, res) => {
  try {
    const { email, username, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        error: 'A user with that email or username already exists',
      });
    }

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
    console.error('Registration error:', error);
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
          console.error('Error fetching campground data for review:', err);
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
          console.error('Error fetching campground data for booking:', err);
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
          console.error('Error fetching campsite data:', err);
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
      reviews: user.reviews,
      bookings: user.bookings,
    };

    res.json({
      user: userResponse,
      emailVerified: user.isEmailVerified,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
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

module.exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'You must be logged in to update your profile' });
    }

    const { phone } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the phone number
    user.phone = phone;
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
    // If a booking has an invalid reference, fetch the data directly
    const Campground = require('../../models/campground');
    const Campsite = require('../../models/campsite');

    // Process each booking to ensure campground and campsite data is available
    for (let i = 0; i < updatedUser.bookings.length; i++) {
      const booking = updatedUser.bookings[i];

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
          console.error('Error fetching campground data:', err);
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
          console.error('Error fetching campsite data:', err);
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
    };

    res.json({
      user: userResponse,
      emailVerified: user.isEmailVerified,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(400).json({ error: error.message || 'Failed to update profile' });
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
    console.error('Error submitting contact:', error);
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
          console.error('Error fetching campground data for review:', err);
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
    console.error('Error fetching user reviews:', error);
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
  } catch (error) {
    console.error('Error requesting password reset:', error);
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
    console.log('Password change audit log created for user:', user._id);

    // Save the user with both password change and audit log in a single operation
    await user.save();

    // Mark the token as used (separate document, so no version conflict)
    await markPasswordResetTokenAsUsed(token);

    res.json({
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);

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
