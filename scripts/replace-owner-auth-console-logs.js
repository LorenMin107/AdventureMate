#!/usr/bin/env node

/**
 * Script to replace all console statements in ownerAuth.js
 */

const fs = require('fs');
const path = require('path');

const ownerAuthFile = path.join(__dirname, '../middleware/ownerAuth.js');
let content = fs.readFileSync(ownerAuthFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: 'console.log(`Created missing owner profile for user ${req.user._id}`);',
    replace:
      "logInfo('Created missing owner profile', { \n      userId: req.user._id,\n      endpoint: req.originalUrl \n    });",
  },
  {
    search: "console.error('Error in requireVerifiedOwner middleware:', error);",
    replace:
      "logError('Error in requireVerifiedOwner middleware', error, { \n      endpoint: req.originalUrl,\n      userId: req.user?._id \n    });",
  },
  {
    search: 'console.log(`Created missing owner profile for user ${req.user._id}`);',
    replace:
      "logInfo('Created missing owner profile', { \n      userId: req.user._id,\n      endpoint: req.originalUrl \n    });",
  },
  {
    search: "console.error('Error in requireOwner middleware:', error);",
    replace:
      "logError('Error in requireOwner middleware', error, { \n      endpoint: req.originalUrl,\n      userId: req.user?._id \n    });",
  },
  {
    search: 'console.log(`Created missing owner profile for user ${req.user._id}`);',
    replace:
      "logInfo('Created missing owner profile', { \n      userId: req.user._id,\n      endpoint: req.originalUrl \n    });",
  },
  {
    search: "console.error('Error in requireCampgroundOwnership middleware:', error);",
    replace:
      "logError('Error in requireCampgroundOwnership middleware', error, { \n      endpoint: req.originalUrl,\n      userId: req.user?._id,\n      campgroundId: req.params.id || req.params.campgroundId \n    });",
  },
  {
    search: 'console.log(`Created missing owner profile for user ${req.user._id}`);',
    replace:
      "logInfo('Created missing owner profile', { \n      userId: req.user._id,\n      endpoint: req.originalUrl \n    });",
  },
  {
    search: "console.error('Error in canManageCampgrounds middleware:', error);",
    replace:
      "logError('Error in canManageCampgrounds middleware', error, { \n      endpoint: req.originalUrl,\n      userId: req.user?._id \n    });",
  },
  {
    search: "console.error('Error in populateOwner middleware:', error);",
    replace:
      "logError('Error in populateOwner middleware', error, { \n      endpoint: req.originalUrl,\n      userId: req.user?._id \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(ownerAuthFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in ownerAuth.js');
console.log(`📝 Applied ${replacements.length} replacements`);
