# Google OAuth Integration Setup Guide

## Overview

This guide explains how to set up Google OAuth authentication for the MyanCamp application. The integration allows users to sign in using their Google accounts.

## Prerequisites

- Google Cloud Console account
- Access to the application's environment configuration

## Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace organization)
3. Fill in the required information:
   - App name: "MyanCamp"
   - User support email: Your email address
   - Developer contact information: Your email address
4. Add the following scopes:
   - `openid`
   - `profile`
   - `email`
5. Add test users if needed (for development)

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Set the following redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for development)
   - `http://localhost:5173/auth/google/callback` (for Vite dev server)
   - `https://yourdomain.com/auth/google/callback` (for production)
5. Note down the Client ID and Client Secret

## Step 4: Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Frontend OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

## Step 5: Update Redirect URIs for Production

When deploying to production:

1. Update the redirect URI in Google Cloud Console to match your production domain
2. Update the `REACT_APP_GOOGLE_REDIRECT_URI` environment variable
3. Ensure your production domain is added to the authorized domains in OAuth consent screen

## Step 6: Test the Integration

1. Start the development server
2. Navigate to the login page
3. Click the "Continue with Google" button
4. Complete the OAuth flow
5. Verify that the user is successfully logged in

## Security Considerations

### Backend Security

- Store Google OAuth credentials securely in environment variables
- Never commit credentials to version control
- Use HTTPS in production
- Implement proper error handling for OAuth failures

### Frontend Security

- Use environment variables for client-side configuration
- Implement proper state management for OAuth tokens
- Handle OAuth errors gracefully
- Clear sensitive data from URL parameters after OAuth callback

### User Data Protection

- Only request necessary scopes (`openid`, `profile`, `email`)
- Implement proper data retention policies
- Allow users to disconnect their Google accounts
- Provide clear privacy policy regarding OAuth data usage

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**

   - Ensure the redirect URI in Google Cloud Console matches exactly
   - Check for trailing slashes or protocol mismatches

2. **"Client ID not found" error**

   - Verify the Google Client ID is correctly set in environment variables
   - Ensure the OAuth consent screen is properly configured

3. **"Access blocked" error**

   - Check if the app is in testing mode and add your email as a test user
   - Verify the OAuth consent screen is published

4. **CORS errors**
   - Ensure the redirect URI is properly configured
   - Check that the frontend and backend domains are correctly set

### Debug Mode

To enable debug logging for OAuth:

```javascript
// In development, you can add this to see OAuth flow details
console.log('OAuth redirect URI:', process.env.REACT_APP_GOOGLE_REDIRECT_URI);
console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
```

## API Endpoints

The following API endpoints are available for Google OAuth:

- `POST /api/v1/auth/google` - Handle Google OAuth callback
- `GET /auth/google/callback` - Frontend callback page

## User Experience Flow

1. User clicks "Continue with Google" button
2. User is redirected to Google OAuth consent screen
3. User grants permission to the application
4. Google redirects back to the application with an authorization code
5. Application exchanges the code for user information
6. User is logged in and redirected to the home page

## Account Linking

The system supports linking Google accounts to existing email addresses:

- If a user signs up with Google and the email already exists, the accounts are linked
- Users can use either their password or Google OAuth to sign in
- Profile information from Google is used to enhance the user profile

## Maintenance

### Regular Tasks

- Monitor OAuth usage and errors
- Update OAuth consent screen information as needed
- Review and update authorized domains
- Monitor for any security advisories from Google

### Updates

- Keep Google OAuth libraries updated
- Monitor for changes in Google OAuth API
- Test OAuth flow after any major updates

## Support

For issues related to Google OAuth:

1. Check the Google Cloud Console for any configuration issues
2. Review the application logs for detailed error messages
3. Verify environment variables are correctly set
4. Test with a fresh browser session to clear any cached OAuth state

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/rfc6819)
