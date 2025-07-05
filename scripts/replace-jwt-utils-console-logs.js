#!/usr/bin/env node

/**
 * Script to replace all console statements in jwtUtils.js
 */

const fs = require('fs');
const path = require('path');

const jwtUtilsFile = path.join(__dirname, '../utils/jwtUtils.js');
let content = fs.readFileSync(jwtUtilsFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.error('Error blacklisting access token:', error);",
    replace:
      "logError('Error blacklisting access token', error, { \n      userId: user?._id,\n      tokenType: 'access',\n      reason \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(jwtUtilsFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in jwtUtils.js');
console.log(`📝 Applied ${replacements.length} replacements`);
