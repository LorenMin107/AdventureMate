/**
 * Email Template Manager
 * Handles loading and rendering email templates
 */

// Template types
const TEMPLATE_TYPES = {
  VERIFICATION: 'verification',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_UPDATE: 'account_update',
  TRIP_INVITE: 'trip_invite',
  OWNER_APPROVAL: 'owner_approval',
  OWNER_REJECTION: 'owner_rejection',
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
    case TEMPLATE_TYPES.OWNER_APPROVAL:
      return renderOwnerApprovalEmail(data);
    case TEMPLATE_TYPES.OWNER_REJECTION:
      return renderOwnerRejectionEmail(data);
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
    case TEMPLATE_TYPES.OWNER_APPROVAL:
      return renderOwnerApprovalEmailText(data);
    case TEMPLATE_TYPES.OWNER_REJECTION:
      return renderOwnerRejectionEmailText(data);
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
          <h1>AdventureMate</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Hello ${username},</p>
          <p>Thank you for registering with AdventureMate. To complete your registration, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </div>
          
          <p>This link will expire in 24 hours.</p>
          <p>If you did not register for an account, please ignore this email.</p>
          
          <p>Best regards,<br>The AdventureMate Team</p>
          
          <div class="link-fallback">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${verificationUrl}
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AdventureMate. All rights reserved.</p>
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
    
    Thank you for registering with AdventureMate. To complete your registration, please verify your email address by visiting the link below:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you did not register for an account, please ignore this email.
    
    Best regards,
    The AdventureMate Team
    
    © ${new Date().getFullYear()} AdventureMate. All rights reserved.
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
      <title>Welcome to AdventureMate</title>
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
          <h1>AdventureMate</h1>
        </div>
        <div class="content">
          <h2>Welcome to AdventureMate!</h2>
          <p>Hello ${username},</p>
          <p>Thank you for joining AdventureMate! Your account has been successfully created and verified.</p>
          
          <p>With your AdventureMate account, you can:</p>
          
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
            <a href="https://adventuremate.com/campgrounds" class="button">Explore Campgrounds</a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The AdventureMate Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AdventureMate. All rights reserved.</p>
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
    
    Thank you for joining AdventureMate! Your account has been successfully created and verified.
    
    With your AdventureMate account, you can:
    
    - Discover Campgrounds: Find the best camping spots in Myanmar's beautiful landscapes.
    - Book Easily: Make reservations with our simple booking system.
    - Share Experiences: Write reviews and share your camping adventures.
    - Manage Bookings: View and manage all your bookings in one place.
    
    Visit our website to explore campgrounds: https://adventuremate.com/campgrounds
    
    If you have any questions or need assistance, please don't hesitate to contact our support team.
    
    Best regards,
    The AdventureMate Team
    
    © ${new Date().getFullYear()} AdventureMate. All rights reserved.
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
          <h1>AdventureMate</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hello ${username},</p>
          <p>We received a request to reset your password for your AdventureMate account. Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>Important:</strong> This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support if you have concerns.
          </div>
          
          <p>For security reasons, this password reset link can only be used once.</p>
          
          <p>Best regards,<br>The AdventureMate Team</p>
          
          <div class="link-fallback">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${resetUrl}
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AdventureMate. All rights reserved.</p>
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
    
    We received a request to reset your password for your AdventureMate account. Please use the link below to reset your password:
    
    ${resetUrl}
    
    Important: This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support if you have concerns.
    
    For security reasons, this password reset link can only be used once.
    
    Best regards,
    The AdventureMate Team
    
    © ${new Date().getFullYear()} AdventureMate. All rights reserved.
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
  const { campground, campsite, startDate, endDate, totalPrice, totalDays, guests } = booking;
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
          <h1>AdventureMate</h1>
        </div>
        <div class="content">
          <h2>Booking Confirmation</h2>
          <p>Hello ${username},</p>
          <p>Thank you for your booking with AdventureMate. Your reservation has been confirmed!</p>
          
          <div class="booking-details">
            <h3>Booking Details</h3>
            <table>
              <tr>
                <th>Campground:</th>
                <td>${campground.title}</td>
              </tr>
              ${
                campsite
                  ? `<tr>
                <th>Campsite:</th>
                <td>${campsite.name}</td>
              </tr>`
                  : ''
              }
              <tr>
                <th>Check-in:</th>
                <td>${formattedStartDate}</td>
              </tr>
              <tr>
                <th>Check-out:</th>
                <td>${formattedEndDate}</td>
              </tr>
              <tr>
                <th>Duration:</th>
                <td>${totalDays} day${totalDays !== 1 ? 's' : ''}</td>
              </tr>
              <tr>
                <th>Guests:</th>
                <td>${guests} guest${guests !== 1 ? 's' : ''}</td>
              </tr>
            </table>
            <div class="total-price">
              Total: $${totalPrice.toFixed(2)}
            </div>
          </div>
          
          <p>If you have any questions or need to make changes to your booking, please contact us.</p>
          
          <p>We hope you enjoy your stay!</p>
          
          <p>Best regards,<br>The AdventureMate Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AdventureMate. All rights reserved.</p>
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
  const { campground, campsite, startDate, endDate, totalPrice, totalDays, guests } = booking;
  const formattedStartDate = new Date(startDate).toLocaleDateString();
  const formattedEndDate = new Date(endDate).toLocaleDateString();

  return `
    Hello ${username},
    
    Thank you for your booking with AdventureMate. Your reservation has been confirmed!
    
    BOOKING DETAILS:
    - Campground: ${campground.title}
    ${campsite ? `- Campsite: ${campsite.name}` : ''}
    - Check-in: ${formattedStartDate}
    - Check-out: ${formattedEndDate}
    - Duration: ${totalDays} day${totalDays !== 1 ? 's' : ''}
    - Guests: ${guests} guest${guests !== 1 ? 's' : ''}
    - Total: $${totalPrice.toFixed(2)}
    
    If you have any questions or need to make changes to your booking, please contact us.
    
    We hope you enjoy your stay!
    
    Best regards,
    The AdventureMate Team
    
    ---
    © ${new Date().getFullYear()} AdventureMate. All rights reserved.
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
          <h1>AdventureMate</h1>
        </div>
        <div class="content">
          <h2>Account Update Notification</h2>
          <p>Hello ${username},</p>
          <p>We're writing to inform you that your AdventureMate account has been updated.</p>
          
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
            <a href="https://adventuremate.com/profile" class="button">View Account Settings</a>
          </div>
          
          <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The AdventureMate Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AdventureMate. All rights reserved.</p>
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
    
    We're writing to inform you that your AdventureMate account has been updated.
    
    Changes to Your Account:
    -----------------------
    ${updatesList}
    
    Security Note: If you did not make these changes, please contact our support team immediately.
    
    You can review your account settings by visiting:
    https://adventuremate.com/profile
    
    If you have any questions or concerns, please don't hesitate to contact us.
    
    Best regards,
    The AdventureMate Team
    
    © ${new Date().getFullYear()} AdventureMate. All rights reserved.
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

/**
 * Render the owner application approval email HTML template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {string} data.businessName - Name of the business
 * @param {string} data.adminName - Name of the admin who approved
 * @param {string} data.approvalDate - Date of approval
 * @returns {string} HTML template
 */
const renderOwnerApprovalEmail = ({ username, businessName, adminName, approvalDate }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Owner Application Approved - AdventureMate</title>
      <style>
        /* Base styles */
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .success-icon {
          text-align: center;
          margin-bottom: 30px;
        }
        .success-icon span {
          font-size: 48px;
          color: #28a745;
        }
        .content h2 {
          color: #28a745;
          margin-bottom: 20px;
          text-align: center;
        }
        .content p {
          margin-bottom: 15px;
          font-size: 16px;
        }
        .highlight-box {
          background-color: #f8f9fa;
          border-left: 4px solid #28a745;
          padding: 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .next-steps {
          background-color: #e8f5e8;
          border: 1px solid #28a745;
          border-radius: 8px;
          padding: 25px;
          margin: 30px 0;
        }
        .next-steps h3 {
          color: #28a745;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin-bottom: 8px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AdventureMate</h1>
        </div>
        <div class="content">
          <div class="success-icon">
            <span>✅</span>
          </div>
          <h2>Congratulations! Your Application Has Been Approved!</h2>
          <p>Hello ${username},</p>
          <p>Great news! Your owner application for <strong>${businessName}</strong> has been approved by our team.</p>
          
          <div class="highlight-box">
            <p><strong>Application Details:</strong></p>
            <p>• Business Name: ${businessName}</p>
            <p>• Approved By: ${adminName}</p>
            <p>• Approval Date: ${approvalDate}</p>
          </div>

          <div class="next-steps">
            <h3>What's Next?</h3>
            <ul>
              <li><strong>Access Owner Dashboard:</strong> You can now log in and access your owner dashboard</li>
              <li><strong>Add Your Campgrounds:</strong> Start listing your camping properties</li>
              <li><strong>Set Up Your Profile:</strong> Complete your business profile and settings</li>
              <li><strong>Upload Photos:</strong> Add high-quality images of your campgrounds</li>
              <li><strong>Set Pricing:</strong> Configure rates and availability for your campsites</li>
            </ul>
          </div>

          <p>If you have any questions or need assistance getting started, please don't hesitate to contact our support team.</p>
          
          <p>Welcome to the AdventureMate community!</p>
          
          <p>Best regards,<br>The AdventureMate Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AdventureMate. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Render the owner application approval email text template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {string} data.businessName - Name of the business
 * @param {string} data.adminName - Name of the admin who approved
 * @param {string} data.approvalDate - Date of approval
 * @returns {string} Text template
 */
const renderOwnerApprovalEmailText = ({ username, businessName, adminName, approvalDate }) => {
  return `
    Hello ${username},

    Congratulations! Your owner application for ${businessName} has been approved by our team.

    Application Details:
    - Business Name: ${businessName}
    - Approved By: ${adminName}
    - Approval Date: ${approvalDate}

    What's Next?
    - Access Owner Dashboard: You can now log in and access your owner dashboard
    - Add Your Campgrounds: Start listing your camping properties
    - Set Up Your Profile: Complete your business profile and settings
    - Upload Photos: Add high-quality images of your campgrounds
    - Set Pricing: Configure rates and availability for your campsites

    If you have any questions or need assistance getting started, please don't hesitate to contact our support team.

    Welcome to the AdventureMate community!

    Best regards,
    The AdventureMate Team

    © ${new Date().getFullYear()} AdventureMate. All rights reserved.
    This is an automated message, please do not reply to this email.
  `;
};

/**
 * Render the owner application rejection email HTML template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {string} data.businessName - Name of the business
 * @param {string} data.adminName - Name of the admin who rejected
 * @param {string} data.rejectionDate - Date of rejection
 * @param {string} data.reason - Reason for rejection
 * @returns {string} HTML template
 */
const renderOwnerRejectionEmail = ({
  username,
  businessName,
  adminName,
  rejectionDate,
  reason,
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Owner Application Update - AdventureMate</title>
      <style>
        /* Base styles */
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #dc3545;
          margin-bottom: 20px;
          text-align: center;
        }
        .content p {
          margin-bottom: 15px;
          font-size: 16px;
        }
        .rejection-box {
          background-color: #f8f9fa;
          border-left: 4px solid #dc3545;
          padding: 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .reason-box {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .reason-box h3 {
          color: #856404;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .next-steps {
          background-color: #e8f4fd;
          border: 1px solid #bee5eb;
          border-radius: 8px;
          padding: 25px;
          margin: 30px 0;
        }
        .next-steps h3 {
          color: #0c5460;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin-bottom: 8px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AdventureMate</h1>
        </div>
        <div class="content">
          <h2>Update on Your Owner Application</h2>
          <p>Hello ${username},</p>
          <p>Thank you for your interest in becoming an owner on AdventureMate. We have reviewed your application for <strong>${businessName}</strong>.</p>
          
          <div class="rejection-box">
            <p><strong>Application Status:</strong> Not Approved</p>
            <p>• Reviewed By: ${adminName}</p>
            <p>• Review Date: ${rejectionDate}</p>
          </div>

          <div class="reason-box">
            <h3>Reason for Decision:</h3>
            <p>${reason}</p>
          </div>

          <div class="next-steps">
            <h3>What You Can Do Next:</h3>
            <ul>
              <li><strong>Review the Feedback:</strong> Carefully consider the reason provided above</li>
              <li><strong>Address the Issues:</strong> Make necessary improvements to your application</li>
              <li><strong>Resubmit:</strong> You can submit a new application once you've addressed the concerns</li>
              <li><strong>Contact Support:</strong> If you have questions, our team is here to help</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="https://adventuremate.com/owner/apply" class="button">Submit New Application</a>
          </div>

          <p>We encourage you to address the feedback and submit a new application. We're here to support you in becoming a successful campground owner on our platform.</p>
          
          <p>If you have any questions about the feedback or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The AdventureMate Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AdventureMate. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Render the owner application rejection email text template
 * @param {Object} data - Template data
 * @param {string} data.username - User's name
 * @param {string} data.businessName - Name of the business
 * @param {string} data.adminName - Name of the admin who rejected
 * @param {string} data.rejectionDate - Date of rejection
 * @param {string} data.reason - Reason for rejection
 * @returns {string} Text template
 */
const renderOwnerRejectionEmailText = ({
  username,
  businessName,
  adminName,
  rejectionDate,
  reason,
}) => {
  return `
    Hello ${username},

    Thank you for your interest in becoming an owner on AdventureMate. We have reviewed your application for ${businessName}.

    Application Status: Not Approved
    - Reviewed By: ${adminName}
    - Review Date: ${rejectionDate}

    Reason for Decision:
    ${reason}

    What You Can Do Next:
    - Review the Feedback: Carefully consider the reason provided above
    - Address the Issues: Make necessary improvements to your application
    - Resubmit: You can submit a new application once you've addressed the concerns
    - Contact Support: If you have questions, our team is here to help

    Visit our website to submit a new application: https://adventuremate.com/owner/apply

    We encourage you to address the feedback and submit a new application. We're here to support you in becoming a successful campground owner on our platform.

    If you have any questions about the feedback or need assistance, please don't hesitate to contact our support team.

    Best regards,
    The AdventureMate Team

    © ${new Date().getFullYear()} AdventureMate. All rights reserved.
    This is an automated message, please do not reply to this email.
  `;
};

module.exports = {
  TEMPLATE_TYPES,
  getHtmlTemplate,
  getTextTemplate,
};
