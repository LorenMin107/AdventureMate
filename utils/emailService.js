const nodemailer = require('nodemailer');
const config = require('../config');
const {
  TEMPLATE_TYPES,
  getHtmlTemplate,
  getTextTemplate,
} = require('./emailTemplates/templateManager');
const { logError, logInfo, logDebug } = require('./logger');

// Create a transporter object using SMTP transport
let transporter;

// Initialize the transporter based on environment
// Check if email configuration is provided
if (config.email.host && config.email.user && config.email.password) {
  // Use configured email settings
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
  logInfo('Email transporter initialized with configured settings');
} else {
  // No email configuration provided - will use ethereal.email for testing
  // This will be initialized on first use
  transporter = null;
  logInfo('No email configuration found, will use Ethereal Email for testing');
}

/**
 * Get the email transporter
 * If configured transporter exists, returns it
 * Otherwise, creates a test account with Ethereal Email
 * @returns {Promise<Object>} Nodemailer transporter
 */
const getTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  try {
    // Create a test account for development
    logInfo('Creating Ethereal Email test account for development');
    const testAccount = await nodemailer.createTestAccount();

    // Create a transporter object using the test account
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    logInfo('Ethereal Email test account created', {
      user: testAccount.user,
    });
    return transporter;
  } catch (error) {
    logError('Failed to create Ethereal Email test account', error);
    throw new Error('Failed to initialize email transporter');
  }
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} Email send info
 */
const sendEmail = async (options) => {
  try {
    logInfo('Attempting to send email', {
      to: options.to,
      subject: options.subject,
    });

    const transport = await getTransporter();
    logDebug('Email transporter obtained successfully');

    const mailOptions = {
      from: config.email.from || '"MyanCamp" <noreply@myancamp.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    logDebug('Sending email with options', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const info = await transport.sendMail(mailOptions);
    logInfo('Email sent successfully', {
      messageId: info.messageId,
      to: options.to,
    });

    // Log preview URL in development
    if (!config.server.isProduction && nodemailer.getTestMessageUrl(info)) {
      logInfo('Email preview URL', {
        previewUrl: nodemailer.getTestMessageUrl(info),
      });
    }

    return info;
  } catch (error) {
    logError('Failed to send email', error, {
      to: options.to,
      subject: options.subject,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send a verification email
 * @param {Object} user - User object
 * @param {string} verificationUrl - Verification URL
 * @returns {Promise<Object>} Email send info
 */
const sendVerificationEmail = async (user, verificationUrl) => {
  const subject = 'Verify your email address';

  const html = getHtmlTemplate(TEMPLATE_TYPES.VERIFICATION, {
    username: user.username,
    verificationUrl,
  });

  const text = getTextTemplate(TEMPLATE_TYPES.VERIFICATION, {
    username: user.username,
    verificationUrl,
  });

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

/**
 * Send a welcome email
 * @param {Object} user - User object
 * @returns {Promise<Object>} Email send info
 */
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to MyanCamp!';

  const html = getHtmlTemplate(TEMPLATE_TYPES.WELCOME, {
    username: user.username,
  });

  const text = getTextTemplate(TEMPLATE_TYPES.WELCOME, {
    username: user.username,
  });

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

/**
 * Send a password reset email
 * @param {Object} user - User object
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<Object>} Email send info
 */
const sendPasswordResetEmail = async (user, resetUrl) => {
  const subject = 'Reset your password';

  const html = getHtmlTemplate(TEMPLATE_TYPES.PASSWORD_RESET, {
    username: user.username,
    resetUrl,
  });

  const text = getTextTemplate(TEMPLATE_TYPES.PASSWORD_RESET, {
    username: user.username,
    resetUrl,
  });

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

/**
 * Send a booking confirmation email
 * @param {Object} user - User object
 * @param {Object} booking - Booking object
 * @returns {Promise<Object>} Email send info
 */
const sendBookingConfirmationEmail = async (user, booking) => {
  const subject = 'Your booking confirmation';

  const html = getHtmlTemplate(TEMPLATE_TYPES.BOOKING_CONFIRMATION, {
    username: user.username,
    booking,
  });

  const text = getTextTemplate(TEMPLATE_TYPES.BOOKING_CONFIRMATION, {
    username: user.username,
    booking,
  });

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

/**
 * Send an account update email
 * @param {Object} user - User object
 * @param {Object} updates - Object containing the updates made
 * @returns {Promise<Object>} Email send info
 */
const sendAccountUpdateEmail = async (user, updates) => {
  const subject = 'Your account has been updated';

  const html = getHtmlTemplate(TEMPLATE_TYPES.ACCOUNT_UPDATE, {
    username: user.username,
    updates,
  });

  const text = getTextTemplate(TEMPLATE_TYPES.ACCOUNT_UPDATE, {
    username: user.username,
    updates,
  });

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

/**
 * Send a trip invite email
 * @param {Object} options - Trip invite options
 * @param {string} options.to - Recipient email
 * @param {string} options.inviter - Inviter username
 * @param {string} options.tripName - Trip name
 * @param {string} options.inviteUrl - Invite URL
 * @param {string} options.tripDescription - Trip description
 * @param {string} options.tripStartDate - Trip start date
 * @param {string} options.tripEndDate - Trip end date
 * @param {string} options.inviterMessage - Inviter message
 * @returns {Promise<Object>} Email send info
 */
const sendTripInviteEmail = async ({
  to,
  inviter,
  tripName,
  inviteUrl,
  tripDescription,
  tripStartDate,
  tripEndDate,
  inviterMessage,
}) => {
  const subject = `${inviter} invited you to join a trip on MyanCamp!`;

  const html = getHtmlTemplate(TEMPLATE_TYPES.TRIP_INVITE, {
    inviter,
    tripName,
    inviteUrl,
    tripDescription,
    tripStartDate,
    tripEndDate,
    inviterMessage,
  });

  const text = getTextTemplate(TEMPLATE_TYPES.TRIP_INVITE, {
    inviter,
    tripName,
    inviteUrl,
    tripDescription,
    tripStartDate,
    tripEndDate,
    inviterMessage,
  });

  return await sendEmail({
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendAccountUpdateEmail,
  sendTripInviteEmail,
};
