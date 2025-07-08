/**
 * Email Template Manager
 * Handles loading and rendering email templates
 */

// Template types
const TEMPLATE_TYPES = {
  VERIFICATION: 'verification',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  BOOKING_CONFIRMATION: 'booking-confirmation',
  ACCOUNT_UPDATE: 'account-update',
  TRIP_INVITE: 'trip-invite',
};

/**
 * Get the HTML template for a specific email type
 * @param {string} type - Template type from TEMPLATE_TYPES
 * @param {Object} data - Data to inject into the template
 * @returns {string} HTML template
 */
const getHtmlTemplate = (type, data = {}) => {
  switch (type) {
    case TEMPLATE_TYPES.VERIFICATION:
      return renderVerificationEmail(data);
    case TEMPLATE_TYPES.WELCOME:
      return renderWelcomeEmail(data);
    case TEMPLATE_TYPES.PASSWORD_RESET:
      return renderPasswordResetEmail(data);
    case TEMPLATE_TYPES.BOOKING_CONFIRMATION:
      return renderBookingConfirmationEmail(data);
    case TEMPLATE_TYPES.ACCOUNT_UPDATE:
      return renderAccountUpdateEmail(data);
    case TEMPLATE_TYPES.TRIP_INVITE:
      return renderTripInviteEmail(data);
    default:
      throw new Error(`Unknown template type: ${type}`);
  }
};

/**
 * Get the text template for a specific email type
 * @param {string} type - Template type from TEMPLATE_TYPES
 * @param {Object} data - Data to inject into the template
 * @returns {string} Text template
 */
const getTextTemplate = (type, data = {}) => {
  switch (type) {
    case TEMPLATE_TYPES.VERIFICATION:
      return renderVerificationEmailText(data);
    case TEMPLATE_TYPES.WELCOME:
      return renderWelcomeEmailText(data);
    case TEMPLATE_TYPES.PASSWORD_RESET:
      return renderPasswordResetEmailText(data);
    case TEMPLATE_TYPES.BOOKING_CONFIRMATION:
      return renderBookingConfirmationEmailText(data);
    case TEMPLATE_TYPES.ACCOUNT_UPDATE:
      return renderAccountUpdateEmailText(data);
    case TEMPLATE_TYPES.TRIP_INVITE:
      return renderTripInviteEmailText(data);
    default:
      throw new Error(`Unknown template type: ${type}`);
  }
};

/**
 * Render the verification email HTML template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {string} data.verificationUrl - Verification URL
 * @returns {string} HTML template
 */
const renderVerificationEmail = ({ username, verificationUrl }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        /* Base styles */
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eee;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 30px 20px;
        }
        .button {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #45a049;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #777;
          font-size: 12px;
          border-top: 1px solid #eee;
        }
        .link-fallback {
          display: block;
          margin-top: 20px;
          word-break: break-all;
          font-size: 12px;
          color: #777;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MyanCamp</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Hello ${username},</p>
          <p>Thank you for registering with MyanCamp. To complete your registration, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </div>
          
          <p>This link will expire in 24 hours.</p>
          <p>If you did not register for an account, please ignore this email.</p>
          
          <p>Best regards,<br>The MyanCamp Team</p>
          
          <div class="link-fallback">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${verificationUrl}
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MyanCamp. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Render the verification email text template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {string} data.verificationUrl - Verification URL
 * @returns {string} Text template
 */
const renderVerificationEmailText = ({ username, verificationUrl }) => {
  return `
    Hello ${username},
    
    Thank you for registering with MyanCamp. To complete your registration, please verify your email address by visiting the link below:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you did not register for an account, please ignore this email.
    
    Best regards,
    The MyanCamp Team
    
    © ${new Date().getFullYear()} MyanCamp. All rights reserved.
    This is an automated message, please do not reply to this email.
  `;
};

/**
 * Render the welcome email HTML template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @returns {string} HTML template
 */
const renderWelcomeEmail = ({ username }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to MyanCamp</title>
      <style>
        /* Base styles */
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eee;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 30px 20px;
        }
        .button {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #45a049;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #777;
          font-size: 12px;
          border-top: 1px solid #eee;
        }
        .features {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          margin: 30px 0;
        }
        .feature {
          flex-basis: 48%;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
            border-radius: 0;
          }
          .feature {
            flex-basis: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MyanCamp</h1>
        </div>
        <div class="content">
          <h2>Welcome to MyanCamp!</h2>
          <p>Hello ${username},</p>
          <p>Thank you for joining MyanCamp! Your account has been successfully created and verified.</p>
          
          <p>With your MyanCamp account, you can:</p>
          
          <div class="features">
            <div class="feature">
              <h3>Discover Campgrounds</h3>
              <p>Find the best camping spots in Myanmar's beautiful landscapes.</p>
            </div>
            <div class="feature">
              <h3>Book Easily</h3>
              <p>Make reservations with our simple booking system.</p>
            </div>
            <div class="feature">
              <h3>Share Experiences</h3>
              <p>Write reviews and share your camping adventures.</p>
            </div>
            <div class="feature">
              <h3>Manage Bookings</h3>
              <p>View and manage all your bookings in one place.</p>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="https://myancamp.com/campgrounds" class="button">Explore Campgrounds</a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The MyanCamp Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MyanCamp. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Render the welcome email text template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @returns {string} Text template
 */
const renderWelcomeEmailText = ({ username }) => {
  return `
    Hello ${username},
    
    Thank you for joining MyanCamp! Your account has been successfully created and verified.
    
    With your MyanCamp account, you can:
    
    - Discover Campgrounds: Find the best camping spots in Myanmar's beautiful landscapes.
    - Book Easily: Make reservations with our simple booking system.
    - Share Experiences: Write reviews and share your camping adventures.
    - Manage Bookings: View and manage all your bookings in one place.
    
    Visit our website to explore campgrounds: https://myancamp.com/campgrounds
    
    If you have any questions or need assistance, please don't hesitate to contact our support team.
    
    Best regards,
    The MyanCamp Team
    
    © ${new Date().getFullYear()} MyanCamp. All rights reserved.
    This is an automated message, please do not reply to this email.
  `;
};

/**
 * Render the password reset email HTML template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {string} data.resetUrl - Password reset URL
 * @returns {string} HTML template
 */
const renderPasswordResetEmail = ({ username, resetUrl }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        /* Base styles */
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eee;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 30px 20px;
        }
        .button {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #45a049;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #777;
          font-size: 12px;
          border-top: 1px solid #eee;
        }
        .warning {
          background-color: #fff3cd;
          color: #856404;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .link-fallback {
          display: block;
          margin-top: 20px;
          word-break: break-all;
          font-size: 12px;
          color: #777;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MyanCamp</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hello ${username},</p>
          <p>We received a request to reset your password for your MyanCamp account. Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>Important:</strong> This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support if you have concerns.
          </div>
          
          <p>For security reasons, this password reset link can only be used once.</p>
          
          <p>Best regards,<br>The MyanCamp Team</p>
          
          <div class="link-fallback">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${resetUrl}
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MyanCamp. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Render the password reset email text template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {string} data.resetUrl - Password reset URL
 * @returns {string} Text template
 */
const renderPasswordResetEmailText = ({ username, resetUrl }) => {
  return `
    Hello ${username},
    
    We received a request to reset your password for your MyanCamp account. Please use the link below to reset your password:
    
    ${resetUrl}
    
    Important: This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support if you have concerns.
    
    For security reasons, this password reset link can only be used once.
    
    Best regards,
    The MyanCamp Team
    
    © ${new Date().getFullYear()} MyanCamp. All rights reserved.
    This is an automated message, please do not reply to this email.
  `;
};

/**
 * Render the booking confirmation email HTML template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {Object} data.booking - Booking details
 * @returns {string} HTML template
 */
const renderBookingConfirmationEmail = ({ username, booking }) => {
  const { campground, campsite, startDate, endDate, totalPrice } = booking;
  const formattedStartDate = new Date(startDate).toLocaleDateString();
  const formattedEndDate = new Date(endDate).toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation</title>
      <style>
        /* Base styles */
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eee;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 30px 20px;
        }
        .button {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #45a049;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #777;
          font-size: 12px;
          border-top: 1px solid #eee;
        }
        .booking-details {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .booking-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .booking-details th {
          text-align: left;
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        .booking-details td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        .total-price {
          font-weight: bold;
          font-size: 1.2em;
          margin-top: 15px;
          text-align: right;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MyanCamp</h1>
        </div>
        <div class="content">
          <h2>Booking Confirmation</h2>
          <p>Hello ${username},</p>
          <p>Thank you for your booking with MyanCamp. Your reservation has been confirmed!</p>
          
          <div class="booking-details">
            <h3>Booking Details</h3>
            <table>
              <tr>
                <th>Campground:</th>
                <td>${campground.name}</td>
              </tr>
              <tr>
                <th>Campsite:</th>
                <td>${campsite.name}</td>
              </tr>
              <tr>
                <th>Check-in:</th>
                <td>${formattedStartDate}</td>
              </tr>
              <tr>
                <th>Check-out:</th>
                <td>${formattedEndDate}</td>
              </tr>
            </table>
            <div class="total-price">
              Total: $${totalPrice.toFixed(2)}
            </div>
          </div>
          
          <p>You can view your booking details and manage your reservation by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="https://myancamp.com/bookings/${booking._id}" class="button">View Booking</a>
          </div>
          
          <p>If you have any questions or need to make changes to your booking, please contact us.</p>
          
          <p>We hope you enjoy your stay!</p>
          
          <p>Best regards,<br>The MyanCamp Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MyanCamp. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Render the booking confirmation email text template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {Object} data.booking - Booking details
 * @returns {string} Text template
 */
const renderBookingConfirmationEmailText = ({ username, booking }) => {
  const { campground, campsite, startDate, endDate, totalPrice, _id } = booking;
  const formattedStartDate = new Date(startDate).toLocaleDateString();
  const formattedEndDate = new Date(endDate).toLocaleDateString();

  return `
    Hello ${username},
    
    Thank you for your booking with MyanCamp. Your reservation has been confirmed!
    
    Booking Details:
    ---------------
    Campground: ${campground.name}
    Campsite: ${campsite.name}
    Check-in: ${formattedStartDate}
    Check-out: ${formattedEndDate}
    Total: $${totalPrice.toFixed(2)}
    
    You can view your booking details and manage your reservation by visiting:
    https://myancamp.com/bookings/${_id}
    
    If you have any questions or need to make changes to your booking, please contact us.
    
    We hope you enjoy your stay!
    
    Best regards,
    The MyanCamp Team
    
    © ${new Date().getFullYear()} MyanCamp. All rights reserved.
    This is an automated message, please do not reply to this email.
  `;
};

/**
 * Render the account update email HTML template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {Object} data.updates - Account updates
 * @returns {string} HTML template
 */
const renderAccountUpdateEmail = ({ username, updates }) => {
  // Create a list of updates
  const updatesList = Object.entries(updates)
    .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Update</title>
      <style>
        /* Base styles */
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eee;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 30px 20px;
        }
        .button {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #45a049;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #777;
          font-size: 12px;
          border-top: 1px solid #eee;
        }
        .updates {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .updates ul {
          padding-left: 20px;
        }
        .security-note {
          background-color: #e8f4fd;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          border-left: 4px solid #4a90e2;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MyanCamp</h1>
        </div>
        <div class="content">
          <h2>Account Update Notification</h2>
          <p>Hello ${username},</p>
          <p>We're writing to inform you that your MyanCamp account has been updated.</p>
          
          <div class="updates">
            <h3>Changes to Your Account</h3>
            <ul>
              ${updatesList}
            </ul>
          </div>
          
          <div class="security-note">
            <strong>Security Note:</strong> If you did not make these changes, please contact our support team immediately.
          </div>
          
          <p>You can review your account settings by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="https://myancamp.com/profile" class="button">View Account Settings</a>
          </div>
          
          <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The MyanCamp Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MyanCamp. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Render the account update email text template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {Object} data.updates - Account updates
 * @returns {string} Text template
 */
const renderAccountUpdateEmailText = ({ username, updates }) => {
  // Create a list of updates
  const updatesList = Object.entries(updates)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  return `
    Hello ${username},
    
    We're writing to inform you that your MyanCamp account has been updated.
    
    Changes to Your Account:
    -----------------------
    ${updatesList}
    
    Security Note: If you did not make these changes, please contact our support team immediately.
    
    You can review your account settings by visiting:
    https://myancamp.com/profile
    
    If you have any questions or concerns, please don't hesitate to contact us.
    
    Best regards,
    The MyanCamp Team
    
    © ${new Date().getFullYear()} MyanCamp. All rights reserved.
    This is an automated message, please do not reply to this email.
  `;
};

/**
 * Render the trip invite email HTML template
 * @param {Object} data - Template data
 * @param {string} data.inviter - Name of the inviter
 * @param {string} data.tripName - Name of the trip
 * @param {string} data.inviteUrl - Invitation URL
 * @param {string} data.tripDescription - Trip description
 * @param {string} data.tripStartDate - Trip start date
 * @param {string} data.tripEndDate - Trip end date
 * @param {string} data.inviterMessage - Inviter message
 * @returns {string} HTML template
 */
const renderTripInviteEmail = ({
  inviter,
  tripName,
  inviteUrl,
  tripDescription,
  tripStartDate,
  tripEndDate,
  inviterMessage,
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Trip Invitation</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 24px; }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { max-width: 120px; margin-bottom: 12px; }
        .button { display: inline-block; background: #4CAF50; color: #fff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #388e3c; }
        .footer { text-align: center; color: #777; font-size: 12px; margin-top: 32px; }
        .link-fallback { margin-top: 20px; font-size: 12px; color: #777; word-break: break-all; }
        .trip-details { background: #f0f8f5; border-radius: 6px; padding: 16px; margin: 18px 0; }
        .trip-details h3 { margin: 0 0 8px 0; font-size: 1.1rem; color: #388e3c; }
        .trip-details p { margin: 4px 0; font-size: 0.98rem; }
        .inviter-message { margin: 18px 0; font-style: italic; color: #444; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://adventurecamp.com/logo.png" alt="AdventureCamp Logo" class="logo" />
          <h1>AdventureCamp</h1>
        </div>
        <h2>You're Invited to Join a Trip!</h2>
        <p>Hello,</p>
        <p><strong>${inviter}</strong> has invited you to collaborate on the trip <strong>"${tripName}"</strong> in AdventureCamp.</p>
        <div class="trip-details">
          <h3>Trip Details</h3>
          <p><strong>Name:</strong> ${tripName}</p>
          ${tripStartDate ? `<p><strong>Start:</strong> ${tripStartDate}</p>` : ''}
          ${tripEndDate ? `<p><strong>End:</strong> ${tripEndDate}</p>` : ''}
          ${tripDescription ? `<p><strong>Description:</strong> ${tripDescription}</p>` : ''}
        </div>
        <div class="inviter-message">
          ${inviterMessage || "Let\'s plan an amazing trip together!"}
        </div>
        <div style="text-align: center;">
          <a href="${inviteUrl}" class="button">Accept Invitation</a>
        </div>
        <p>If you do not wish to join, you can safely ignore this email.</p>
        <div class="link-fallback">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${inviteUrl}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AdventureCamp. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Render the trip invite email text template
 * @param {Object} data - Template data
 * @param {string} data.inviter - Name of the inviter
 * @param {string} data.tripName - Name of the trip
 * @param {string} data.inviteUrl - Invitation URL
 * @param {string} data.tripDescription - Trip description
 * @param {string} data.tripStartDate - Trip start date
 * @param {string} data.tripEndDate - Trip end date
 * @param {string} data.inviterMessage - Inviter message
 * @returns {string} Text template
 */
const renderTripInviteEmailText = ({
  inviter,
  tripName,
  inviteUrl,
  tripDescription,
  tripStartDate,
  tripEndDate,
  inviterMessage,
}) => {
  let details = `Trip Details:\nName: ${tripName}\n`;
  if (tripStartDate) details += `Start: ${tripStartDate}\n`;
  if (tripEndDate) details += `End: ${tripEndDate}\n`;
  if (tripDescription) details += `Description: ${tripDescription}\n`;
  return `
Hello,

${inviter} has invited you to collaborate on the trip "${tripName}" in AdventureCamp.

${details}
${inviterMessage || "Let\'s plan an amazing trip together!"}

Accept your invitation by visiting the link below:
${inviteUrl}

If you do not wish to join, you can safely ignore this email.

Best regards,
The AdventureCamp Team

© ${new Date().getFullYear()} AdventureCamp. All rights reserved.
This is an automated message, please do not reply to this email.
`;
};

module.exports = {
  TEMPLATE_TYPES,
  getHtmlTemplate,
  getTextTemplate,
};
