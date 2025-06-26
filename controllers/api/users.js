const User = require("../../models/user");
const Contact = require("../../models/contact");

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

    // Log the user in
    req.login(registeredUser, (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to login after registration" });
      }

      // Return user data (excluding sensitive information)
      const userResponse = {
        _id: registeredUser._id,
        username: registeredUser.username,
        email: registeredUser.email,
        phone: registeredUser.phone
      };

      res.status(201).json({ 
        user: userResponse,
        message: "Registration successful" 
      });
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message || "Registration failed" });
  }
};

module.exports.login = (req, res) => {
  // The actual authentication is handled by passport middleware
  // This function is called after successful authentication

  // Return user data (excluding sensitive information)
  const userResponse = {
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    phone: req.user.phone,
    isAdmin: req.user.isAdmin || false
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

    const user = await User.findById(req.user._id)
      .populate('reviews')
      .populate('bookings');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user data (excluding sensitive information)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin || false,
      reviews: user.reviews,
      bookings: user.bookings
    };

    res.json({ user: userResponse });
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
      isAdmin: req.user.isAdmin || false
    };

    return res.json({ 
      isAuthenticated: true,
      user: userResponse
    });
  }

  res.json({ 
    isAuthenticated: false,
    user: null
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

    // Return updated user data (excluding sensitive information)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin || false,
      reviews: user.reviews,
      bookings: user.bookings
    };

    res.json({ 
      user: userResponse,
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
