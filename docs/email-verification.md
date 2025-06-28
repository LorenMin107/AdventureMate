# Email Verification System

This document describes the email verification system implemented in MyanCamp.

## Overview

The email verification system allows users to verify their email addresses after registration. This helps ensure that users provide valid email addresses and can receive important communications from the platform.

## Features

1. **Email Verification on Registration**
   - When a user registers, a verification email is sent to their email address
   - The email contains a link with a unique token that expires after 24 hours
   - Users must click the link to verify their email address

2. **Email Verification Check on Login**
   - When a user logs in, the system checks if their email is verified
   - If not verified, the system sends a new verification email and prevents login
   - The user must verify their email before they can fully access the platform

3. **Manual Resend of Verification Email**
   - Users can request a new verification email if they didn't receive the original
   - This requires the user to be authenticated (logged in)
   - The system generates a new token and sends a new verification email

## Implementation Details

### Models

1. **User Model**
   - Added `isEmailVerified` (boolean) field to track verification status
   - Added `emailVerifiedAt` (date) field to record when verification occurred

2. **Email Verification Token Model**
   - Stores tokens for email verification
   - Includes user reference, email, token, expiration date, and usage status
   - Provides methods for token validation and management

### Utilities

1. **Email Utilities**
   - Functions for generating and validating email verification tokens
   - Functions for marking tokens as used
   - Functions for generating verification URLs

2. **Email Service**
   - Uses nodemailer for sending emails
   - Provides a development mode using Ethereal Email for testing
   - Includes templates for verification emails

### API Endpoints

1. **Registration**
   - `POST /api/v1/users/register` - Registers a new user and sends verification email

2. **Email Verification**
   - `GET /api/v1/auth/verify-email?token=<token>` - Verifies an email using a token
   - `POST /api/v1/auth/resend-verification-email` - Resends a verification email

3. **Login**
   - `POST /api/v1/auth/login` - Checks email verification status during login

## Configuration

Email settings are configured in `config/index.js`:

```javascript
// Email configuration
const email = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  from: process.env.EMAIL_FROM || '"MyanCamp" <noreply@myancamp.com>',
};
```

For production, set these environment variables. For development, the system uses Ethereal Email for testing.

## Testing

In development mode, the system uses Ethereal Email for testing. When an email is sent, a preview URL is logged to the console. You can use this URL to view the email in a browser.

## Frontend Interface

A frontend interface has been added for email verification:

1. **Email Verification Page**
   - Located at `/verify-email` route
   - Handles verification token from URL
   - Shows loading, success, and error states
   - Provides option to resend verification email
   - Responsive design for all devices

## Rate Limiting

Rate limiting has been implemented to prevent abuse:

1. **General API Rate Limiting**
   - Limits all API requests to 100 requests per 15 minutes per IP
   - Configured in `middleware/rateLimiter.js`

2. **Authentication Rate Limiting**
   - Limits authentication endpoints to 10 requests per hour per IP
   - Applies to login, refresh token, and logout endpoints

3. **Email Verification Rate Limiting**
   - Limits verification endpoint to 5 requests per hour per IP
   - Limits resend verification endpoint to 3 requests per day per IP

## Email Templates

Email templates have been added for different types of notifications:

1. **Template System**
   - Located in `utils/emailTemplates/templateManager.js`
   - Provides both HTML and text versions of emails
   - Supports dynamic content injection

2. **Template Types**
   - Verification emails
   - Welcome emails
   - Password reset emails
   - Booking confirmation emails
   - Account update emails

## HTML Email Styling

HTML emails have been styled for better user experience:

1. **Responsive Design**
   - Works on all devices and email clients
   - Uses media queries for mobile optimization

2. **Consistent Branding**
   - Consistent color scheme and typography
   - Clear call-to-action buttons

3. **Accessibility Features**
   - Fallback text links for email clients that don't support buttons
   - Clear hierarchy and readability

## Future Improvements

1. Add support for email attachments
2. Implement email tracking and analytics
3. Add more personalization options
4. Create an email template editor in the admin panel
