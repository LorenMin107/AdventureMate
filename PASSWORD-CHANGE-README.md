# Password Change Functionality

This document describes the implementation of the password change functionality for authenticated users in the MyanCamp application.

## Overview

The password change functionality allows authenticated users to change their password while logged in. This is different from password reset (for forgotten passwords) as it requires the user to be authenticated and provide their current password.

## Features

- **Secure Authentication**: Requires current password verification
- **Password Strength Validation**: Ensures new passwords meet security requirements
- **Audit Logging**: Tracks password changes for security monitoring
- **User-Friendly Interface**: Modern, responsive design with real-time feedback
- **Multiple Access Points**: Available in profile settings and dedicated page

## Backend Implementation

### API Endpoint

**PUT** `/api/v1/users/change-password`

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response:**

```json
{
  "message": "Password changed successfully"
}
```

### Controller Function

Located in `controllers/api/users.js`:

```javascript
module.exports.changePassword = async (req, res) => {
  // Validates current password
  // Checks new password strength
  // Updates password with bcrypt hashing
  // Creates audit log entry
  // Returns success message
};
```

### Security Features

1. **Current Password Verification**: Users must provide their current password
2. **Password Strength Validation**: New passwords must meet minimum requirements
3. **Audit Logging**: All password changes are logged with IP address and user agent
4. **JWT Authentication**: Requires valid access token
5. **Email Verification**: Users must have verified email addresses

### Password Requirements

- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character

## Frontend Implementation

### Components

#### PasswordChangeForm

- **Location**: `client/src/components/PasswordChangeForm.jsx`
- **Features**:
  - Real-time password strength indicator
  - Password visibility toggles
  - Form validation with error messages
  - Password requirements checklist
  - Responsive design

#### PasswordChangePage

- **Location**: `client/src/pages/PasswordChangePage.jsx`
- **Features**:
  - Dedicated page for password changes
  - Clean, focused user experience
  - Navigation back to profile

### Integration Points

#### Profile Page

- **Location**: `client/src/pages/ProfilePage.jsx`
- **Integration**: Security section with link to password change page

#### Owner Settings Page

- **Location**: `client/src/pages/OwnerSettingsPage.jsx`
- **Integration**: Security section with password change option

### Services

#### AuthService

- **Location**: `client/src/services/AuthService.js`
- **Method**: `changePassword(currentPassword, newPassword)`

#### AuthContext

- **Location**: `client/src/context/AuthContext.jsx`
- **Method**: `changePassword(currentPassword, newPassword)`

## User Experience

### Access Methods

1. **Profile Page**: Navigate to Profile → Security → Change Password
2. **Owner Settings**: Navigate to Owner Settings → Security → Change Password
3. **Direct URL**: `/password-change`

### User Flow

1. User navigates to password change page
2. User enters current password
3. User enters new password (with real-time strength feedback)
4. User confirms new password
5. System validates current password and new password strength
6. Password is updated and user receives success message
7. User can continue using the application with new password

### Visual Feedback

- **Password Strength Bar**: Real-time indicator showing password strength
- **Requirements Checklist**: Visual checkmarks for met requirements
- **Error Messages**: Clear feedback for validation errors
- **Success Messages**: Confirmation when password is changed
- **Loading States**: Visual feedback during API calls

## Security Considerations

### Password Storage

- Passwords are hashed using bcrypt with 12 salt rounds
- Original passwords are never stored in plain text

### Audit Logging

- All password changes are logged with:
  - Timestamp
  - IP address
  - User agent
  - Reason for change (set to 'change')

### Session Management

- Password changes don't invalidate existing sessions
- Users continue using the same session after password change

### Rate Limiting

- Password change attempts are subject to rate limiting
- Prevents brute force attacks

## Testing

### Manual Testing

1. Navigate to profile page
2. Click "Change Password" in security section
3. Enter current password
4. Enter new password with various strength levels
5. Verify validation messages
6. Complete password change
7. Verify login works with new password

### Automated Testing

Run the test script:

```bash
node test_password_change.js
```

This script tests:

- User registration and login
- Password change functionality
- Password validation
- Error handling

## Error Handling

### Common Error Scenarios

1. **Invalid Current Password**

   - Error: "Current password is incorrect"
   - Status: 400

2. **Weak New Password**

   - Error: Password strength validation message
   - Status: 400

3. **Missing Fields**

   - Error: "Current password and new password are required"
   - Status: 400

4. **Unauthorized Access**

   - Error: "You must be logged in to change your password"
   - Status: 401

5. **User Not Found**
   - Error: "User not found"
   - Status: 404

## Styling

### CSS Variables

The components use CSS custom properties for theming:

- `--card-bg`: Background color for form cards
- `--border-color`: Border colors
- `--text-primary`: Primary text color
- `--text-secondary`: Secondary text color
- `--primary-color`: Primary button color
- `--error-color`: Error message color
- `--success-color`: Success indicator color

### Responsive Design

- Mobile-first approach
- Responsive grid layouts
- Touch-friendly button sizes
- Optimized for various screen sizes

### Dark Theme Support

- Automatic dark theme detection
- Consistent styling across themes
- Smooth transitions between themes

## Future Enhancements

### Potential Improvements

1. **Password History**: Prevent reuse of recent passwords
2. **Password Expiry**: Force password changes after certain time periods
3. **Multi-factor Authentication**: Require 2FA for password changes
4. **Email Notifications**: Send confirmation emails for password changes
5. **Session Invalidation**: Option to invalidate all sessions after password change

### Security Enhancements

1. **Password Breach Checking**: Check new passwords against known breaches
2. **Advanced Password Policies**: Configurable password requirements
3. **Account Lockout**: Temporary lockout after failed attempts
4. **Geolocation Tracking**: Log location of password changes

## Troubleshooting

### Common Issues

1. **Password Change Fails**

   - Verify current password is correct
   - Check password meets strength requirements
   - Ensure user is authenticated

2. **Form Validation Errors**

   - Check all required fields are filled
   - Verify password confirmation matches
   - Ensure password meets minimum requirements

3. **API Errors**
   - Check authentication token is valid
   - Verify API endpoint is accessible
   - Check server logs for detailed errors

### Debug Information

Enable debug logging by setting environment variable:

```bash
DEBUG=myancamp:password-change
```

## Conclusion

The password change functionality provides a secure, user-friendly way for authenticated users to update their passwords. The implementation follows security best practices and provides a smooth user experience across all devices and themes.
