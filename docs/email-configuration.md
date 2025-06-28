# Email Configuration Guide

This document provides information about the email configuration settings in MyanCamp.

## Overview

MyanCamp uses email functionality for various features including:
- Email verification during registration
- Password reset
- Booking confirmations
- Account updates

## Configuration Variables

The following environment variables need to be set in the `.env` file:

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | smtp.gmail.com |
| `EMAIL_PORT` | SMTP server port | 587 |
| `EMAIL_SECURE` | Whether to use TLS (true/false) | false |
| `EMAIL_USER` | Email username/address | your_email@gmail.com |
| `EMAIL_PASSWORD` | Email password or app password | your_password |
| `EMAIL_FROM` | Sender name and email | "MyanCamp" <noreply@myancamp.com> |

## Setting Up Email

### For Development

For development purposes, you can:

1. Use [Ethereal Email](https://ethereal.email/) for testing (automatically configured in development mode)
2. Use your own SMTP server by updating the `.env` file

When using development mode, email preview URLs will be logged to the console.

### For Production

For production, you should use a reliable SMTP service:

1. Update the `.env` file with your production SMTP settings
2. Ensure `EMAIL_SECURE` is set appropriately (usually `true` for production)
3. Consider using an app-specific password if using Gmail or similar services

## Email Service Providers

Some recommended email service providers:

- [SendGrid](https://sendgrid.com/)
- [Mailgun](https://www.mailgun.com/)
- [Amazon SES](https://aws.amazon.com/ses/)
- [Gmail](https://mail.google.com/) (with app passwords)

## Testing Email Configuration

To test if your email configuration is working:

1. Set up the environment variables in `.env`
2. Register a new user (which will trigger a verification email)
3. Check the logs for the email preview URL (in development) or your inbox (in production)

## Gmail Configuration

If you're using Gmail as your email service provider, follow these steps:

1. **Set up your .env file**:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false  # For port 587, use false as it uses STARTTLS
   EMAIL_USER=your_gmail_address@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM="MyanCamp" <your_gmail_address@gmail.com>  # Must use the same email as EMAIL_USER
   ```

   > **Important**: The email address in `EMAIL_FROM` must match the email address in `EMAIL_USER` when using Gmail.

2. **Generate an App Password** (required if you have 2-Step Verification enabled):
   - Go to your [Google Account](https://myaccount.google.com/)
   - Select "Security"
   - Under "Signing in to Google," select "App passwords" (requires 2-Step Verification to be enabled)
   - Select "Mail" as the app and "Other" as the device
   - Enter "MyanCamp" as the name
   - Click "Generate"
   - Use the generated 16-character password as your `EMAIL_PASSWORD` in the .env file

3. **If you don't have 2-Step Verification**:
   - Go to your [Google Account](https://myaccount.google.com/)
   - Select "Security"
   - Enable "Less secure app access" (Note: Google is phasing this out, so using an App Password is recommended)

## Troubleshooting

Common issues:

1. **Authentication failures**: 
   - Check your username and password
   - For Gmail, ensure you're using an App Password if 2FA is enabled
   - Verify that "Less secure app access" is enabled if not using an App Password

2. **Connection timeouts**: 
   - Verify the host and port settings
   - Check if your network blocks outgoing SMTP connections

3. **Gmail specific issues**:
   - Gmail may block sign-in attempts from apps it deems less secure
   - You might receive an email from Google about a blocked sign-in attempt
   - Follow the instructions in the email or go to your Google account security settings

4. **Rate limiting**: 
   - Gmail limits to 500 emails per day for regular accounts
   - Other providers have different limits
   - Consider using a dedicated email service like SendGrid for production
