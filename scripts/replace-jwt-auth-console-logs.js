#!/usr/bin/env node

/**
 * Script to replace all console statements in jwtAuth.js
 */

const fs = require('fs');
const path = require('path');

const jwtAuthFile = path.join(__dirname, '../middleware/jwtAuth.js');
let content = fs.readFileSync(jwtAuthFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search:
      'console.log(\n          `JWT authentication failed: No token provided for ${req.method} ${req.originalUrl}`\n        );',
    replace:
      "logDebug('JWT authentication failed: No token provided', { \n          method: req.method,\n          url: req.originalUrl,\n          ip: req.ip \n        });",
  },
  {
    search:
      'console.log(`JWT authentication failed: User not found for token subject ${decoded.sub}`);',
    replace:
      "logWarn('JWT authentication failed: User not found', { \n          tokenSubject: decoded.sub,\n          method: req.method,\n          url: req.originalUrl \n        });",
  },
  {
    search:
      'console.log(\n          `JWT authentication failed: Token expired for ${req.method} ${req.originalUrl}`\n        );',
    replace:
      "logWarn('JWT authentication failed: Token expired', { \n          method: req.method,\n          url: req.originalUrl,\n          ip: req.ip \n        });",
  },
  {
    search:
      'console.log(\n          `JWT authentication failed: Token has been revoked for ${req.method} ${req.originalUrl}`\n        );',
    replace:
      "logWarn('JWT authentication failed: Token revoked', { \n          method: req.method,\n          url: req.originalUrl,\n          ip: req.ip \n        });",
  },
  {
    search:
      'console.log(\n          `JWT authentication failed: Invalid token for ${req.method} ${req.originalUrl} - ${tokenError.message}`\n        );',
    replace:
      "logWarn('JWT authentication failed: Invalid token', { \n          method: req.method,\n          url: req.originalUrl,\n          error: tokenError.message,\n          ip: req.ip \n        });",
  },
  {
    search: 'console.log(`JWT authentication failed: ${tokenError.name} - ${tokenError.message}`);',
    replace:
      "logWarn('JWT authentication failed', { \n          errorName: tokenError.name,\n          errorMessage: tokenError.message,\n          method: req.method,\n          url: req.originalUrl \n        });",
  },
  {
    search: "console.error('Error in JWT authentication middleware:', error);",
    replace:
      "logError('Error in JWT authentication middleware', error, { \n          method: req.method,\n          url: req.originalUrl,\n          ip: req.ip \n        });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(jwtAuthFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in jwtAuth.js');
console.log(`📝 Applied ${replacements.length} replacements`);
