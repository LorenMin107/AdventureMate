const User = require("../../models/user");
const Contact = require("../../models/contact");
const Review = require("../../models/review");
const Campground = require("../../models/campground");
const { generateEmailVerificationToken, generateVerificationUrl } = require("../../utils/emailUtils");
const { sendVerificationEmail } = require("../../utils/emailService");

module.exports.register = async (req, res) => {
  try {
    const { email, username, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        error: "A user with that email or username already exists" 
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
      console.error("Error sending verification email:", emailError);
      // Continue with registration even if email fails
    }

    // Return user data (excluding sensitive information) without logging in
    const userResponse = {
      _id: registeredUser._id,
      username: registeredUser.username,
      email: registeredUser.email,
      phone: registeredUser.phone,
      isEmailVerified: registeredUser.isEmailVerified
    };

    res.status(201).json({ 
      user: userResponse,
      message: "Registration successful. Please check your email to verify your account before logging in." 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message || "Registration failed" });
  }
};

module.exports.login = (req, res) => {
  // The actual authentication is handled by passport middleware
  // This function is called after successful authentication

  // Check if email is verified
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      error: 'Email not verified',
      message: 'Please verify your email address before logging in.',
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        isEmailVerified: false
      }
    });
  }

  // Check if 2FA is enabled
  if (req.user.isTwoFactorEnabled) {
    // Store user ID in session for 2FA verification
    req.session.twoFactorAuth = {
      userId: req.user._id,
      rememberMe: req.body.rememberMe || false,
      twoFactorPending: true,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };

    // Return response indicating 2FA verification is required
    return res.status(200).json({
      requiresTwoFactor: true,
      message: 'Two-factor authentication required',
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email
      }
    });
  }

  // If 2FA is not enabled, complete login
  // Return user data (excluding sensitive information)
  const userResponse = {
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    phone: req.user.phone,
    isAdmin: req.user.isAdmin || false,
    isEmailVerified: req.user.isEmailVerified,
    isTwoFactorEnabled: req.user.isTwoFactorEnabled || false
  };

  res.json({ 
    user: userResponse,
    message: "Login successful" 
  });
};

module.exports.logout = (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ message: "Logout successful" });
  });
};

module.exports.getUser = async (req, res) => {
  try {
    // Return current user data if authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // First, get the user with their bookings
    const user = await User.findById(req.user._id)
      .populate('reviews')
      .populate({
        path: 'bookings',
        populate: [
          {
            path: 'campground',
            select: 'title location images'
          },
          {
            path: 'campsite',
            select: 'name description features price capacity images'
          }
        ]
      });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure all bookings have valid campground and campsite data
    // If a booking has an invalid reference, fetch the data directly
    const Campground = require('../../models/campground');
    const Campsite = require('../../models/campsite');

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
              images: campground.images
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
              images: campsite.images
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
      isEmailVerified: user.isEmailVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled || false,
      reviews: user.reviews,
      bookings: user.bookings
    };

    res.json({ 
      user: userResponse,
      emailVerified: user.isEmailVerified
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};

module.exports.checkAuthStatus = async (req, res) => {
  if (req.isAuthenticated()) {
    // Return user data (excluding sensitive information)
    const userResponse = {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      phone: req.user.phone,
      isAdmin: req.user.isAdmin || false,
      isEmailVerified: req.user.isEmailVerified,
      isTwoFactorEnabled: req.user.isTwoFactorEnabled || false
    };

    return res.json({ 
      isAuthenticated: true,
      user: userResponse,
      emailVerified: req.user.isEmailVerified
    });
  }

  res.json({ 
    isAuthenticated: false,
    user: null,
    emailVerified: false
  });
};

module.exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in to update your profile" });
    }

    const { phone } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the phone number
    user.phone = phone;
    await user.save();

    // Fetch the updated user with populated bookings
    const updatedUser = await User.findById(user._id)
      .populate('reviews')
      .populate({
        path: 'bookings',
        populate: [
          {
            path: 'campground',
            select: 'title location images'
          },
          {
            path: 'campsite',
            select: 'name description features price capacity images'
          }
        ]
      });

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
              images: campground.images
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
              images: campsite.images
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
      isEmailVerified: updatedUser.isEmailVerified,
      isTwoFactorEnabled: updatedUser.isTwoFactorEnabled || false,
      reviews: updatedUser.reviews,
      bookings: updatedUser.bookings
    };

    res.json({ 
      user: userResponse,
      emailVerified: user.isEmailVerified,
      message: "Profile updated successfully" 
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(400).json({ error: error.message || "Failed to update profile" });
  }
};

module.exports.submitContact = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in to submit a contact form" });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const user = req.user;
    const newContact = new Contact({ 
      name: user.username, 
      email: user.email, 
      message, 
      user: user._id 
    });

    await newContact.save();

    // Associate contact with user
    user.contacts.push(newContact._id);
    await user.save();

    res.status(201).json({ 
      contact: newContact,
      message: "Contact message submitted successfully" 
    });
  } catch (error) {
    console.error("Error submitting contact:", error);
    res.status(400).json({ error: error.message || "Failed to submit contact message" });
  }
};

module.exports.getUserReviews = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in to view your reviews" });
    }

    // Find all campgrounds that have reviews by the current user
    const campgrounds = await Campground.find({ 'reviews': { $exists: true, $ne: [] } })
      .populate({
        path: 'reviews',
        match: { author: req.user._id },
        populate: { path: 'author', select: 'username' }
      });

    // Extract and format the reviews
    let userReviews = [];

    for (const campground of campgrounds) {
      // Only include campgrounds that have reviews by the current user after population
      if (campground.reviews && campground.reviews.length > 0) {
        // Add campground info to each review
        const reviewsWithCampground = campground.reviews.map(review => {
          // Convert to plain object to allow adding properties
          const reviewObj = review.toObject();
          reviewObj.campground = {
            _id: campground._id,
            title: campground.title,
            location: campground.location
          };
          return reviewObj;
        });

        userReviews = [...userReviews, ...reviewsWithCampground];
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
      count: userReviews.length
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};
