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
    const transport = await getTransporter();

    const mailOptions = {
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transport.sendMail(mailOptions);

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
  const subject = 'Welcome to AdventureMate!';

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
  const subject = `${inviter} invited you to join a trip on AdventureMate!`;

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

/**
 * Send suspension notification email to user
 * @param {string} userEmail - User's email address
 * @param {Object} suspensionData - Suspension details
 * @param {string} suspensionData.username - Username
 * @param {string} suspensionData.reason - Suspension reason
 * @param {Date} suspensionData.suspendedAt - When user was suspended
 * @param {Date} suspensionData.suspensionExpiresAt - When suspension expires (if temporary)
 * @param {string} suspensionData.adminEmail - Admin's email who performed the action
 * @returns {Promise<Object>} Email send info
 */
const sendSuspensionNotification = async (userEmail, suspensionData) => {
  try {
    const { username, reason, suspendedAt, suspensionExpiresAt, adminEmail } = suspensionData;

    const isTemporary = suspensionData.suspensionExpiresAt;
    const expiryDate = isTemporary ? new Date(suspensionExpiresAt).toLocaleDateString() : null;

    const subject = isTemporary
      ? 'Your account has been temporarily suspended'
      : 'Your account has been suspended';

    const textContent = `
Dear ${username},

Your account has been ${isTemporary ? 'temporarily suspended' : 'suspended'} from AdventureMate.

Suspension Details:
- Reason: ${reason}
- Suspended on: ${new Date(suspendedAt).toLocaleDateString()}
${isTemporary ? `- Suspension expires: ${expiryDate}` : '- This is a permanent suspension'}
- Admin contact: ${adminEmail}

If you believe this suspension was made in error, please contact our support team.

Best regards,
The AdventureMate Team
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Account Suspension Notice</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc3545; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Suspension Notice</h1>
        </div>
        <div class="content">
            <p>Dear ${username},</p>
            
            <p>Your account has been <strong>${isTemporary ? 'temporarily suspended' : 'suspended'}</strong> from AdventureMate.</p>
            
            <div class="details">
                <h3>Suspension Details:</h3>
                <ul>
                    <li><strong>Reason:</strong> ${reason}</li>
                    <li><strong>Suspended on:</strong> ${new Date(suspendedAt).toLocaleDateString()}</li>
                    ${isTemporary ? `<li><strong>Suspension expires:</strong> ${expiryDate}</li>` : '<li><strong>Type:</strong> Permanent suspension</li>'}
                    <li><strong>Admin contact:</strong> ${adminEmail}</li>
                </ul>
            </div>
            
            <p>If you believe this suspension was made in error, please contact our support team.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The AdventureMate Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return await sendEmail({
      to: userEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });
  } catch (error) {
    logError('Failed to send suspension notification email', error, {
      userEmail,
      suspensionData,
    });
    throw error;
  }
};

/**
 * Send reactivation notification email to user
 * @param {string} userEmail - User's email address
 * @param {Object} reactivationData - Reactivation details
 * @param {string} reactivationData.username - Username
 * @param {string} reactivationData.reason - Reactivation reason (optional)
 * @param {string} reactivationData.adminEmail - Admin's email who performed the action
 * @returns {Promise<Object>} Email send info
 */
const sendReactivationNotification = async (userEmail, reactivationData) => {
  try {
    const { username, reason, adminEmail } = reactivationData;

    const subject = 'Your account has been reactivated';

    const textContent = `
Dear ${username},

Your account has been reactivated and you can now access AdventureMate again.

Reactivation Details:
- Reactivated on: ${new Date().toLocaleDateString()}
${reason ? `- Reason: ${reason}` : ''}
- Admin contact: ${adminEmail}

Welcome back to AdventureMate!

Best regards,
The AdventureMate Team
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Account Reactivation Notice</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Reactivation Notice</h1>
        </div>
        <div class="content">
            <p>Dear ${username},</p>
            
            <p>Your account has been <strong>reactivated</strong> and you can now access AdventureMate again.</p>
            
            <div class="details">
                <h3>Reactivation Details:</h3>
                <ul>
                    <li><strong>Reactivated on:</strong> ${new Date().toLocaleDateString()}</li>
                    ${reason ? `<li><strong>Reason:</strong> ${reason}</li>` : ''}
                    <li><strong>Admin contact:</strong> ${adminEmail}</li>
                </ul>
            </div>
            
            <p>Welcome back to AdventureMate!</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The AdventureMate Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return await sendEmail({
      to: userEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });
  } catch (error) {
    logError('Failed to send reactivation notification email', error, {
      userEmail,
      reactivationData,
    });
    throw error;
  }
};

/**
 * Send owner application approval email
 * @param {Object} user - User object
 * @param {Object} application - Owner application object
 * @param {Object} adminUser - Admin user who approved the application
 * @returns {Promise<Object>} Email send info
 */
const sendOwnerApplicationApprovalEmail = async (user, application, adminUser) => {
  const subject = 'Your Owner Application Has Been Approved!';

  const html = getHtmlTemplate(TEMPLATE_TYPES.OWNER_APPROVAL, {
    username: user.username,
    businessName: application.businessName,
    adminName: adminUser.username,
    approvalDate: new Date().toLocaleDateString(),
  });

  const text = getTextTemplate(TEMPLATE_TYPES.OWNER_APPROVAL, {
    username: user.username,
    businessName: application.businessName,
    adminName: adminUser.username,
    approvalDate: new Date().toLocaleDateString(),
  });

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

/**
 * Send owner application rejection email
 * @param {Object} user - User object
 * @param {Object} application - Owner application object
 * @param {Object} adminUser - Admin user who rejected the application
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Email send info
 */
const sendOwnerApplicationRejectionEmail = async (user, application, adminUser, reason) => {
  const subject = 'Update on Your Owner Application';

  const html = getHtmlTemplate(TEMPLATE_TYPES.OWNER_REJECTION, {
    username: user.username,
    businessName: application.businessName,
    adminName: adminUser.username,
    rejectionDate: new Date().toLocaleDateString(),
    reason: reason,
  });

  const text = getTextTemplate(TEMPLATE_TYPES.OWNER_REJECTION, {
    username: user.username,
    businessName: application.businessName,
    adminName: adminUser.username,
    rejectionDate: new Date().toLocaleDateString(),
    reason: reason,
  });

  return await sendEmail({
    to: user.email,
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
  sendSuspensionNotification,
  sendReactivationNotification,
  sendOwnerApplicationApprovalEmail,
  sendOwnerApplicationRejectionEmail,
};
