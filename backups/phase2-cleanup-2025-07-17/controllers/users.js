const User = require('../models/user');
const Contact = require('../models/contact');
const { logError, logInfo } = require('../utils/logger');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');

module.exports.renderRegister = (req, res) => {
  res.render('users/register');
};

module.exports.register = async (req, res) => {
  try {
    const { email, username, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      req.flash('error', 'A user with that email or username already exists');
      return res.redirect('register');
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create and register the new user
    const user = new User({
      email,
      username,
      phone,
      password: hashedPassword,
    });
    await user.save();

    // Generate JWT tokens
    const { generateAccessToken, generateRefreshToken } = require('../utils/jwtUtils');
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req);

    // Store tokens in cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Try to send verification email
    try {
      const {
        generateEmailVerificationToken,
        generateVerificationUrl,
      } = require('../utils/emailUtils');
      const { sendVerificationEmail } = require('../utils/emailService');

      const verificationToken = await generateEmailVerificationToken(user, req);
      const verificationUrl = generateVerificationUrl(verificationToken.token);
      await sendVerificationEmail(user, verificationUrl);
    } catch (emailError) {
      logError('Error sending verification email', emailError, {
        userId: user._id,
        email: user.email,
      });
      // Continue with registration even if email fails
    }

    req.flash('success', 'Welcome to YelpCamp! Please check your email to verify your account.');
    res.redirect('/campgrounds');
  } catch (e) {
    logError('Error during registration', e, {
      username: req.body.username,
      email: req.body.email,
    });
    req.flash('error', e.message);
    return res.redirect('register');
  }
};

module.exports.renderLogin = (req, res) => {
  res.render('users/login');
};

module.exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/login');
    }

    // Verify the password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/login');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      // Generate a new verification token
      try {
        const {
          generateEmailVerificationToken,
          generateVerificationUrl,
        } = require('../utils/emailUtils');
        const { sendVerificationEmail } = require('../utils/emailService');

        const verificationToken = await generateEmailVerificationToken(user, req);
        const verificationUrl = generateVerificationUrl(verificationToken.token);
        await sendVerificationEmail(user, verificationUrl);

        req.flash(
          'error',
          'Please verify your email address. A new verification email has been sent.'
        );
        return res.redirect('/login');
      } catch (emailError) {
        logError('Error sending verification email', emailError, {
          userId: user._id,
          email: user.email,
        });
        req.flash(
          'error',
          'Please verify your email address. There was an error sending the verification email.'
        );
        return res.redirect('/login');
      }
    }

    // Generate JWT tokens
    const { generateAccessToken, generateRefreshToken } = require('../utils/jwtUtils');
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req);

    // Store tokens in cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    req.flash('success', 'Welcome back!');
    const redirectUrl = req.query.returnTo || '/campgrounds'; // redirect to the returnTo query param or /campgrounds
    res.redirect(redirectUrl);
  } catch (error) {
    logError('Error during login', error, {
      username: req.body.username,
      endpoint: '/login',
    });
    req.flash('error', 'An error occurred during login');
    return res.redirect('/login');
  }
};

module.exports.renderContact = (req, res) => {
  res.render('users/contact', { currentPage: 'contact' });
};

module.exports.submitContact = async (req, res) => {
  const { message } = req.body;
  const user = req.user;
  const newContact = new Contact({
    name: user.username,
    email: user.email,
    message,
    user: user._id,
  });
  await newContact.save();
  user.contacts.push(newContact._id);
  await user.save();
  req.flash('success', "Thank you for your message! We'll reply as soon as possible.");
  res.redirect('/contact');
};

module.exports.logout = async (req, res) => {
  try {
    // Get the refresh token from the cookie
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Revoke the refresh token
      const { revokeRefreshToken } = require('../utils/jwtUtils');
      await revokeRefreshToken(refreshToken);
    }

    // Clear the cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    req.flash('success', 'Goodbye!');
    res.redirect('/campgrounds');
  } catch (error) {
    logError('Error during logout', error, {
      userId: req.user?._id,
      endpoint: '/logout',
    });
    req.flash('error', 'An error occurred during logout');
    res.redirect('/campgrounds');
  }
};

module.exports.about = (req, res) => {
  res.render('about', { currentPage: 'about' });
};

module.exports.terms = (req, res) => {
  res.render('terms', { currentPage: 'terms' });
};

module.exports.privacy = (req, res) => {
  res.render('privacy', { currentPage: 'privacy' });
};
