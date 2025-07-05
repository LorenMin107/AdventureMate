#!/usr/bin/env node

/**
 * Script to replace all console statements in twoFactorAuth.js
 */

const fs = require('fs');
const path = require('path');

const twoFactorAuthFile = path.join(__dirname, '../utils/twoFactorAuth.js');
let content = fs.readFileSync(twoFactorAuthFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.log('Generated QR code data URL length:', qrCodeDataUrl.length);",
    replace:
      "logDebug('Generated QR code data URL', { \n      length: qrCodeDataUrl.length \n    });",
  },
  {
    search: "console.log('QR code data URL starts with:', qrCodeDataUrl.substring(0, 30) + '...');",
    replace:
      "logDebug('QR code data URL preview', { \n      preview: qrCodeDataUrl.substring(0, 30) + '...' \n    });",
  },
  {
    search: "console.error('Error generating QR code:', error);",
    replace: "logError('Error generating QR code', error);",
  },
  {
    search: "console.error('Error verifying token:', error);",
    replace: "logError('Error verifying token', error);",
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
