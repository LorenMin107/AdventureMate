# User Suspension Feature

## Overview

The user suspension feature allows administrators to temporarily or permanently suspend user accounts. This feature provides a way to manage problematic users while maintaining detailed audit trails and supporting both temporary and permanent suspensions.

## Features

### Core Functionality

- **Suspend Users**: Administrators can suspend users with optional duration limits
- **Reactivate Users**: Suspended users can be reactivated by administrators
- **Automatic Expiration**: Temporary suspensions automatically expire and reactivate users
- **Audit Trail**: All suspension actions are logged with reasons and timestamps
- **Token Revocation**: Suspended users are immediately logged out by revoking their tokens
- **Google OAuth Support**: Full suspension support for Google OAuth users
- **User-Friendly Dialogs**: Professional suspension dialog with form validation
- **Email Notifications**: Users are automatically notified when suspended or reactivated

### Security Features

- **Admin Protection**: Admins cannot suspend other admins or themselves
- **Authentication Blocking**: Suspended users cannot access protected endpoints
- **Token Validation**: JWT middleware checks suspension status on every request
- **OAuth Integration**: Suspension works seamlessly with Google OAuth authentication

## Database Schema

### User Model Updates

The User model has been extended with suspension fields:

```javascript
// User suspension fields
isSuspended: {
  type: Boolean,
  default: false,
},
suspendedAt: {
  type: Date,
  default: null,
},
suspendedBy: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  default: null,
},
suspensionReason: {
  type: String,
  default: null,
},
suspensionExpiresAt: {
  type: Date,
  default: null,
},
```

## API Endpoints

### Suspend User

```
POST /api/v1/admin/users/:id/suspend
```

**Request Body:**

```json
{
  "reason": "Violation of community guidelines",
  "duration": 7 // Optional: days until auto-reactivation
}
```

**Response:**

```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "username",
      "email": "email@example.com",
      "isSuspended": true,
      "suspendedAt": "2024-01-01T00:00:00.000Z",
      "suspensionReason": "Violation of community guidelines",
      "suspensionExpiresAt": "2024-01-08T00:00:00.000Z"
    }
  }
}
```

### Reactivate User

```
POST /api/v1/admin/users/:id/reactivate
```

**Request Body:**

```json
{
  "reason": "Appeal approved"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User reactivated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "username",
      "email": "email@example.com",
      "isSuspended": false,
      "suspendedAt": null,
      "suspensionReason": null,
      "suspensionExpiresAt": null
    }
  }
}
```

## Frontend Components

### UserList Component Updates

- Added "Status" column showing "Active" or "Suspended"
- Updated role display to include "Owner" role
- Enhanced styling for status indicators

### UserDetail Component Updates

- Added suspension status display
- Added suspension reason and timestamp display
- Added suspension expiry date display (if applicable)
- Added "Suspend User" / "Reactivate User" buttons
- Enhanced user profile information
- Added account type display (Google OAuth vs Traditional)
- Integrated professional suspension dialog with form validation

### SuspensionDialog Component

- **Professional UI**: Modern dialog with proper form validation
- **Reason Input**: Required textarea for suspension reasons
- **Duration Input**: Optional number input for temporary suspensions
- **Form Validation**: Client-side validation with error messages
- **Responsive Design**: Works on all device sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Authentication Middleware

### JWT Authentication Updates

The `authenticateJWT` middleware now includes suspension checks:

1. **User Suspension Check**: Verifies if user is suspended before allowing access
2. **Owner Suspension Check**: If user is an owner, also checks if owner account is suspended
3. **Auto-Expiration**: Automatically reactivates users and owner accounts when suspension expires
4. **Error Handling**: Returns appropriate error messages for suspended users and owners

### Authentication Flow Protection

All authentication flows now include suspension checks:

1. **Regular Login**: Checks suspension before generating access tokens
2. **2FA Login**: Checks suspension before completing 2FA verification
3. **Google OAuth**: Checks suspension before completing OAuth authentication
4. **Token Refresh**: Checks suspension before refreshing access tokens
5. **2FA Setup**: Checks suspension before allowing 2FA configuration

```javascript
// Check if user is suspended
if (user.isSuspended) {
  return sendAuthError(
    res,
    'Account suspended',
    'Your account has been suspended. Please contact support for more information.',
    403
  );
}

// If user is an owner, also check owner suspension status
if (user.isOwner) {
  const owner = await Owner.findOne({ user: user._id });

  if (owner && !owner.isActive) {
    return sendAuthError(
      res,
      'Owner account suspended',
      'Your owner account has been suspended. Please contact support for more information.',
      403
    );
  }
}

// Check if suspension has expired
if (user.suspensionExpiresAt && new Date() > user.suspensionExpiresAt) {
  // Auto-reactivate the user
  user.isSuspended = false;
  // ... clear suspension fields
  await user.save();

  // If user is an owner, also reactivate their owner account
  if (user.isOwner) {
    const owner = await Owner.findOne({ user: user._id });
    if (owner) {
      owner.isActive = true;
      owner.verificationStatus = 'verified';
      await owner.save();
    }
  }
}
```

## Translation Support

### English Translations

Added to `client/src/locales/en/translation.json`:

```json
{
  "userList": {
    "table": {
      "status": "Status"
    },
    "role": {
      "owner": "Owner"
    },
    "status": {
      "active": "Active",
      "suspended": "Suspended"
    }
  },
  "userDetail": {
    "suspensionStatusLabel": "Suspension Status",
    "suspendedStatus": "Suspended",
    "activeStatus": "Active",
    "suspensionReasonLabel": "Suspension Reason",
    "suspendedAtLabel": "Suspended At",
    "suspensionExpiresLabel": "Suspension Expires",
    "suspendButton": "Suspend User",
    "reactivateButton": "Reactivate User"
  }
}
```

### Thai Translations

Added to `client/src/locales/th/translation.json`:

```json
{
  "userList": {
    "table": {
      "status": "สถานะ"
    },
    "role": {
      "owner": "เจ้าของ"
    },
    "status": {
      "active": "ใช้งานอยู่",
      "suspended": "ถูกระงับ"
    }
  },
  "userDetail": {
    "suspensionStatusLabel": "สถานะการระงับ",
    "suspendedStatus": "ถูกระงับ",
    "activeStatus": "ใช้งานอยู่",
    "suspensionReasonLabel": "เหตุผลการระงับ",
    "suspendedAtLabel": "ถูกระงับเมื่อ",
    "suspensionExpiresLabel": "การระงับหมดอายุเมื่อ",
    "suspendButton": "ระงับผู้ใช้",
    "reactivateButton": "เปิดใช้งานผู้ใช้"
  }
}
```

## CSS Styling

### UserList Styling

Added styles for user status indicators:

```css
.user-status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-status.active {
  background-color: #28a745;
  color: white;
}

.user-status.suspended {
  background-color: #dc3545;
  color: white;
}
```

### UserDetail Styling

Added styles for suspension buttons:

```css
.user-detail-suspension-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
  margin-left: 0.5rem;
}

.user-detail-suspension-button.suspend {
  background-color: #dc3545;
  color: white;
}

.user-detail-suspension-button.reactivate {
  background-color: #28a745;
  color: white;
}
```

## Testing

### Test Script

A test script `test_user_suspension.js` is provided to verify the suspension functionality:

```bash
node test_user_suspension.js
```

The test script:

1. Finds a test user (non-admin)
2. Suspends the user with a reason and duration
3. Reactivates the user
4. Verifies all suspension fields are properly updated

## Security Considerations

### Admin Protection

- Admins cannot suspend themselves
- Admins cannot suspend other admins
- Only super admins should have suspension privileges

### Audit Logging

- All suspension actions are logged with:
  - Admin who performed the action
  - Timestamp of the action
  - Reason for suspension/reactivation
  - Duration (if applicable)
  - User type (Google OAuth vs Traditional)

### Token Management

- Suspended users have all their refresh tokens revoked
- This forces immediate logout and prevents access with existing tokens
- Works for both traditional and Google OAuth users

### Google OAuth Integration

- Google OAuth users are suspended using the same mechanism as traditional users
- JWT tokens are revoked immediately upon suspension
- OAuth users cannot bypass suspension by re-authenticating with Google
- Account type is logged for audit purposes

### Two-Factor Authentication (2FA) Integration

- **2FA Login Protection**: Suspended users cannot complete 2FA verification during login
- **2FA Setup Protection**: Suspended users cannot set up or modify 2FA settings
- **Temporary Token Protection**: Suspension checks are applied to temporary 2FA tokens
- **Refresh Token Protection**: Suspended users cannot refresh their access tokens
- **Comprehensive Coverage**: All authentication flows check for suspension status

### Owner Account Integration

- **Dual Suspension System**: When a user who is also an owner is suspended, both user and owner accounts are suspended
- **Owner Account Suspension**: Owner accounts are marked as inactive and verification status is set to 'suspended'
- **Owner Reactivation**: When a user is reactivated, their owner account is also reactivated
- **Auto-Expiration**: Temporary suspensions automatically reactivate both user and owner accounts
- **Comprehensive Logging**: All owner suspension actions are logged with detailed information

### User Notifications

- **Suspension Notifications**: Users receive detailed email notifications when suspended
- **Reactivation Notifications**: Users receive email notifications when their account is reactivated
- **Professional Email Templates**: Both HTML and text email formats with suspension details
- **Admin Contact Information**: Users can contact the admin who performed the action

## Usage Examples

### Temporary Suspension

```javascript
// Suspend user for 7 days
const response = await apiClient.post(`/admin/users/${userId}/suspend`, {
  reason: 'Violation of community guidelines',
  duration: 7,
});
```

### Permanent Suspension

```javascript
// Suspend user permanently
const response = await apiClient.post(`/admin/users/${userId}/suspend`, {
  reason: 'Serious violation of terms of service',
});
```

### Reactivation

```javascript
// Reactivate a suspended user
const response = await apiClient.post(`/admin/users/${userId}/reactivate`, {
  reason: 'Appeal approved',
});
```

## Future Enhancements

### Potential Improvements

1. **Bulk Operations**: Suspend multiple users at once
2. **Suspension Templates**: Predefined suspension reasons and durations
3. **Notification System**: Email notifications to suspended users
4. **Appeal System**: Allow users to appeal suspensions
5. **Suspension History**: Track all suspension actions for a user
6. **Automatic Suspension**: Trigger suspensions based on rule violations

### Monitoring

- Track suspension statistics
- Monitor suspension patterns
- Alert on unusual suspension activity

## Troubleshooting

### Common Issues

1. **User can still access after suspension**
   - Check if JWT middleware is properly configured
   - Verify token revocation is working
   - Check browser cache and local storage
   - For Google OAuth users: Verify they cannot bypass with new OAuth login
   - **NEW**: Check if the user has 2FA enabled and is bypassing suspension

2. **Suspension not showing in UI**
   - Verify suspension fields are included in API responses
   - Check translation keys are properly configured
   - Clear browser cache

3. **Auto-expiration not working**
   - Check server timezone settings
   - Verify suspensionExpiresAt field is properly set
   - Check JWT middleware is running on all protected routes

4. **Google OAuth user bypassing suspension**
   - Verify JWT middleware is checking suspension status
   - Check that token revocation is working properly
   - Ensure OAuth users cannot re-authenticate while suspended

5. **2FA users bypassing suspension**
   - **FIXED**: All authentication flows now check for suspension
   - Verify that suspension checks are applied to 2FA verification
   - Check if temporary tokens are being validated properly
   - Ensure refresh tokens are revoked for suspended users

### Debug Information

Enable debug logging to track suspension-related activities:

```javascript
// In your environment
DEBUG=suspension:* npm start
```

## Conclusion

The user suspension feature provides a comprehensive solution for managing problematic users while maintaining security, audit trails, and user experience. The implementation includes both backend API endpoints and frontend UI components with full internationalization support.
