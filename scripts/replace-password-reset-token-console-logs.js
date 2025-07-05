#!/usr/bin/env node

/**
 * Script to replace all console statements in models/passwordResetToken.js
 */

const fs = require('fs');
const path = require('path');

const passwordResetTokenFile = path.join(__dirname, '../models/passwordResetToken.js');
let content = fs.readFileSync(passwordResetTokenFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.log('Finding valid password reset token in database:', token);",
    replace: "logDebug('Finding valid password reset token in database', { token });",
  },
  {
    search: "console.log('Current time:', new Date());",
    replace: "logDebug('Current time', { currentTime: new Date() });",
  },
  {
    search: "console.log('Token found in database:', result);",
    replace: "logDebug('Token found in database', { tokenId: result._id, userId: result.user });",
  },
  {
    search: "console.log('Token expires at:', result.expiresAt);",
    replace: "logDebug('Token expires at', { expiresAt: result.expiresAt });",
  },
  {
    search: "console.log('Token is used:', result.isUsed);",
    replace: "logDebug('Token is used', { isUsed: result.isUsed });",
  },
  {
    search: "console.log('No valid token found in database with this token string');",
    replace: "logDebug('No valid token found in database with this token string');",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(passwordResetTokenFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in models/passwordResetToken.js');
console.log(`📝 Applied ${replacements.length} replacements`);
