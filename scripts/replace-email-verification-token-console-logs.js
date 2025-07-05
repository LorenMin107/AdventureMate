#!/usr/bin/env node

/**
 * Script to replace all console statements in models/emailVerificationToken.js
 */

const fs = require('fs');
const path = require('path');

const emailVerificationTokenFile = path.join(__dirname, '../models/emailVerificationToken.js');
let content = fs.readFileSync(emailVerificationTokenFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.log('Finding valid token in database:', token);",
    replace: "logDebug('Finding valid email verification token in database', { token });",
  },
  {
    search: "console.log('Current time:', new Date());",
    replace: "logDebug('Current time', { currentTime: new Date() });",
  },
  {
    search: "console.log('Token found in database:', result);",
    replace:
      "logDebug('Email verification token found in database', { tokenId: result._id, userId: result.user });",
  },
  {
    search: "console.log('Token expires at:', result.expiresAt);",
    replace: "logDebug('Email verification token expires at', { expiresAt: result.expiresAt });",
  },
  {
    search: "console.log('Token is used:', result.isUsed);",
    replace: "logDebug('Email verification token is used', { isUsed: result.isUsed });",
  },
  {
    search: "console.log('No valid token found in database with this token string');",
    replace:
      "logDebug('No valid email verification token found in database with this token string');",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(emailVerificationTokenFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in models/emailVerificationToken.js');
console.log(`📝 Applied ${replacements.length} replacements`);
