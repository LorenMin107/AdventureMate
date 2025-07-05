#!/usr/bin/env node

/**
 * Script to replace all console statements in emailUtils.js
 */

const fs = require('fs');
const path = require('path');

const emailUtilsFile = path.join(__dirname, '../utils/emailUtils.js');
let content = fs.readFileSync(emailUtilsFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.log('Generating email verification token for user:', user._id);",
    replace: "logInfo('Generating email verification token', { \n      userId: user._id \n    });",
  },
  {
    search: "console.log('Generated token string:', tokenString);",
    replace:
      "logDebug('Generated token string', { \n      tokenLength: tokenString.length \n    });",
  },
  {
    search: "console.log('Token expires at:', expiresAt);",
    replace:
      "logDebug('Token expiration set', { \n      expiresAt: expiresAt.toISOString() \n    });",
  },
  {
    search: "console.log('Invalidating existing tokens for user:', user._id);",
    replace: "logInfo('Invalidating existing tokens', { \n      userId: user._id \n    });",
  },
  {
    search: "console.log('Saving token to database');",
    replace: "logDebug('Saving token to database');",
  },
  {
    search: "console.log('Token saved to database');",
    replace: "logInfo('Token saved to database');",
  },
  {
    search: "console.log('Checking if token has been used:', token);",
    replace:
      "logDebug('Checking if token has been used', { \n      tokenLength: token.length \n    });",
  },
  {
    search: "console.log('Token found but has been used:', usedToken);",
    replace:
      "logInfo('Token found but has been used', { \n      tokenId: usedToken._id,\n      userId: usedToken.user \n    });",
  },
  {
    search: "console.log('Verifying email token:', token);",
    replace: "logDebug('Verifying email token', { \n      tokenLength: token.length \n    });",
  },
  {
    search: "console.log('Token has already been used');",
    replace: "logInfo('Token has already been used');",
  },
  {
    search: "console.log('Token not found or invalid');",
    replace: "logInfo('Token not found or invalid');",
  },
  {
    search: "console.log('Token found and valid:', verificationToken);",
    replace:
      "logInfo('Token found and valid', { \n      tokenId: verificationToken._id,\n      userId: verificationToken.user \n    });",
  },
  {
    search: "console.log('Generating verification URL');",
    replace: "logDebug('Generating verification URL');",
  },
  {
    search: "console.log('Base URL from config:', config.server.clientUrl);",
    replace:
      "logDebug('Base URL from config', { \n      clientUrl: config.server.clientUrl \n    });",
  },
  {
    search: "console.log('Base URL parameter:', baseUrl);",
    replace: "logDebug('Base URL parameter', { \n      baseUrl \n    });",
  },
  {
    search: "console.log('Safe base URL:', safeBaseUrl);",
    replace: "logDebug('Safe base URL', { \n      safeBaseUrl \n    });",
  },
  {
    search: "console.log('Encoded token:', encodedToken);",
    replace: "logDebug('Encoded token', { \n      encodedToken \n    });",
  },
  {
    search: "console.log('Generated verification URL:', verificationUrl);",
    replace: "logInfo('Generated verification URL', { \n      verificationUrl \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(emailUtilsFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in emailUtils.js');
console.log(`📝 Applied ${replacements.length} replacements`);
