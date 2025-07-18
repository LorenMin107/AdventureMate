# Google OAuth Password Reset Error Handling

## Overview

This implementation adds proper error handling for users who attempt to use the "Forgot Password" feature with an email address that's associated with a Google OAuth account. Since Google OAuth users don't have passwords stored in our system, they should be guided to manage their passwords through Google's account settings instead.

## Security Benefits

1. **Prevents Confusion**: Users won't be confused when they don't receive a password reset email
2. **Security Best Practice**: Follows OAuth security principles by directing users to the correct password management system
3. **Clear User Guidance**: Provides clear instructions on how to manage their Google account password
4. **Audit Trail**: Logs attempts to reset passwords for Google OAuth accounts for security monitoring

## Implementation Details

### Backend Changes

#### 1. Updated Password Reset Controller (`controllers/api/auth.js`)

- Added check for `user.googleId` field before processing password reset
- Returns specific error response with code `GOOGLE_OAUTH_ACCOUNT`
- Includes helpful message directing users to Google account settings
- Logs the attempt for security monitoring

```javascript
// Check if the user is a Google OAuth user
if (user.googleId) {
  logInfo('Password reset requested for Google OAuth user', {
    email,
    userId: user._id,
    googleId: user.googleId,
  });

  return res.status(400).json({
    error: 'Google OAuth Account',
    message:
      'This email is associated with a Google account. Password resets are not available for Google OAuth users. Please use your Google account to sign in.',
    code: 'GOOGLE_OAUTH_ACCOUNT',
    email: email,
  });
}
```

### Frontend Changes

#### 1. Updated AuthService (`client/src/services/AuthService.js`)

- Added specific handling for `GOOGLE_OAUTH_ACCOUNT` error code
- Preserves error details for proper UI display

#### 2. Enhanced ForgotPasswordPage (`client/src/pages/ForgotPasswordPage.jsx`)

- Added new status `google-oauth` for specific error handling
- Created dedicated UI section for Google OAuth users
- Includes explanation and direct link to Google account settings
- Uses translation keys for internationalization

#### 3. Added CSS Styles (`client/src/pages/ForgotPasswordPage.css`)

- Google-themed styling with Google blue color (#4285f4)
- Responsive design for mobile devices
- Clear visual hierarchy and user guidance

#### 4. Internationalization Support

**English (`client/src/locales/en/translation.json`):**

```json
"googleOAuthError": {
  "title": "Google Account Detected",
  "message": "This email is associated with a Google account. Password resets are not available for Google OAuth users. Please use your Google account to sign in.",
  "explanation": "Why can't I reset my password?",
  "explanationText": "This email is associated with a Google account. Google OAuth users manage their passwords through their Google account settings, not through our application.",
  "manageGoogleAccount": "Manage Google Account",
  "backToLogin": "Back to Login"
}
```

**Thai (`client/src/locales/th/translation.json`):**

```json
"googleOAuthError": {
  "title": "ตรวจพบบัญชี Google",
  "message": "อีเมลนี้เชื่อมโยงกับบัญชี Google การรีเซ็ตรหัสผ่านไม่พร้อมใช้งานสำหรับผู้ใช้ Google OAuth กรุณาใช้บัญชี Google ของคุณเพื่อเข้าสู่ระบบ",
  "explanation": "ทำไมฉันจึงไม่สามารถรีเซ็ตรหัสผ่านได้?",
  "explanationText": "อีเมลนี้เชื่อมโยงกับบัญชี Google ผู้ใช้ Google OAuth จัดการรหัสผ่านผ่านการตั้งค่าบัญชี Google ไม่ใช่ผ่านแอปพลิเคชันของเรา",
  "manageGoogleAccount": "จัดการบัญชี Google",
  "backToLogin": "กลับไปยังล็อกอิน"
}
```

## User Experience Flow

1. **User enters Google OAuth email** in forgot password form
2. **System detects Google OAuth account** and shows specific error page
3. **Clear explanation** of why password reset isn't available
4. **Direct link** to Google account security settings
5. **Option to return** to login page

## Testing

A test script (`test_google_oauth_password_reset.js`) is provided to verify the implementation:

```bash
node test_google_oauth_password_reset.js
```

## Error Response Format

```json
{
  "error": "Google OAuth Account",
  "message": "This email is associated with a Google account. Password resets are not available for Google OAuth users. Please use your Google account to sign in.",
  "code": "GOOGLE_OAUTH_ACCOUNT",
  "email": "user@example.com"
}
```

## Security Considerations

1. **No Information Disclosure**: The error message doesn't reveal whether the email exists in our system
2. **Audit Logging**: All attempts are logged for security monitoring
3. **Rate Limiting**: Existing rate limiting still applies to prevent abuse
4. **Clear Guidance**: Users are directed to the correct password management system

## Future Enhancements

1. **Analytics**: Track how many users attempt password reset for Google OAuth accounts
2. **User Education**: Consider adding a note about Google OAuth on the login page
3. **Alternative Flows**: Consider offering to help users link their Google account if they forgot their password

## Related Features

This implementation complements the existing Google OAuth password change restrictions:

- Password change page blocks Google OAuth users
- Profile page shows appropriate messaging for Google OAuth users
- Consistent user experience across all password-related features
