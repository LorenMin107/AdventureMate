/**
 * Session-less flash messages middleware
 * 
 * This middleware provides a session-less alternative to connect-flash
 * by using cookies to store flash messages instead of sessions.
 */

// Cookie options for flash messages
const flashCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60000 // 1 minute expiration
};

/**
 * Middleware to set flash messages in cookies
 */
const setFlashMessages = (req, res, next) => {
  // Add flash method to req object
  req.flash = (type, message) => {
    if (!message) return [];
    
    // Create or update the flash cookie
    const flashCookie = req.cookies.flash ? JSON.parse(req.cookies.flash) : {};
    flashCookie[type] = flashCookie[type] || [];
    flashCookie[type].push(message);
    
    // Set the cookie
    res.cookie('flash', JSON.stringify(flashCookie), flashCookieOptions);
    
    return flashCookie[type];
  };
  
  next();
};

/**
 * Middleware to read flash messages from cookies and make them available in templates
 */
const readFlashMessages = (req, res, next) => {
  // Read flash messages from cookie
  const flashCookie = req.cookies.flash ? JSON.parse(req.cookies.flash) : {};
  
  // Make flash messages available in templates
  res.locals.success = flashCookie.success || [];
  res.locals.error = flashCookie.error || [];
  
  // Clear the flash cookie after reading
  res.clearCookie('flash');
  
  next();
};

module.exports = {
  setFlashMessages,
  readFlashMessages
};