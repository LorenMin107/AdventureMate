#!/usr/bin/env node

/**
 * Script to replace all console statements in twoFactorAuth.js
 */

const fs = require('fs');
const path = require('path');

const twoFactorAuthFile = path.join(__dirname, '../controllers/api/twoFactorAuth.js');
let content = fs.readFileSync(twoFactorAuthFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.log('Initiating 2FA setup for user:', req.user ? req.user._id : 'No user');",
    replace:
      "logInfo('Initiating 2FA setup', { \n      userId: req.user?._id,\n      endpoint: '/api/v1/2fa/setup' \n    });",
  },
  {
    search: "console.log('User not authenticated');",
    replace:
      "logWarn('2FA setup attempted without authentication', { \n      endpoint: '/api/v1/2fa/setup' \n    });",
  },
  {
    search: "console.log('2FA already enabled for user:', req.user._id);",
    replace: "logInfo('2FA already enabled', { \n      userId: req.user._id \n    });",
  },
  {
    search: "console.log('Generating secret for user:', req.user.username);",
    replace:
      "logDebug('Generating 2FA secret', { \n      userId: req.user._id,\n      username: req.user.username \n    });",
  },
  {
    search: "console.log('Secret saved for user:', req.user._id);",
    replace: "logDebug('2FA secret saved', { \n      userId: req.user._id \n    });",
  },
  {
    search: "console.log('Generating QR code');",
    replace: "logDebug('Generating 2FA QR code', { \n      userId: req.user._id \n    });",
  },
  {
    search: "console.log('QR code generated successfully');",
    replace:
      "logDebug('2FA QR code generated successfully', { \n      userId: req.user._id \n    });",
  },
  {
    search: "console.log('Sending 2FA setup response');",
    replace: "logDebug('Sending 2FA setup response', { \n      userId: req.user._id \n    });",
  },
  {
    search: "console.error('Error initiating 2FA setup:', error);",
    replace:
      "logError('Error initiating 2FA setup', error, { \n      userId: req.user?._id,\n      endpoint: '/api/v1/2fa/setup' \n    });",
  },
  {
    search: "console.error('Error verifying 2FA setup:', error);",
    replace:
      "logError('Error verifying 2FA setup', error, { \n      userId: req.user?._id,\n      endpoint: '/api/v1/2fa/verify-setup' \n    });",
  },
  {
    search: "console.error('Error disabling 2FA:', error);",
    replace:
      "logError('Error disabling 2FA', error, { \n      userId: req.user?._id,\n      endpoint: '/api/v1/2fa/disable' \n    });",
  },
  {
    search: "console.error('Error verifying 2FA login:', error);",
    replace:
      "logError('Error verifying 2FA login', error, { \n      userId: req.user?._id,\n      endpoint: '/api/v1/2fa/verify-login' \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(twoFactorAuthFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in twoFactorAuth.js');
console.log(`📝 Applied ${replacements.length} replacements`);
