#!/usr/bin/env node

/**
 * Script to replace all console statements in owners.js
 */

const fs = require('fs');
const path = require('path');

const ownersFile = path.join(__dirname, '../controllers/api/owners.js');
let content = fs.readFileSync(ownersFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.error('Error registering owner:', error);",
    replace:
      "logError('Error registering owner', error, { \n      endpoint: '/api/owners/register',\n      userId: req.user?._id,\n      targetUserId: req.body.userId \n    });",
  },
  {
    search: "console.error('Error fetching owner profile:', error);",
    replace:
      "logError('Error fetching owner profile', error, { \n      endpoint: '/api/owners/profile',\n      userId: req.user?._id \n    });",
  },
  {
    search: "console.error('Error updating owner profile:', error);",
    replace:
      "logError('Error updating owner profile', error, { \n      endpoint: '/api/owners/profile',\n      userId: req.user?._id \n    });",
  },
  {
    search: "console.error('Error uploading verification documents:', error);",
    replace:
      "logError('Error uploading verification documents', error, { \n      endpoint: '/api/owners/verification-documents',\n      userId: req.user?._id \n    });",
  },
  {
    search: "console.error('Error fetching owner dashboard:', error);",
    replace:
      "logError('Error fetching owner dashboard', error, { \n      endpoint: '/api/owners/dashboard',\n      userId: req.user?._id \n    });",
  },
  {
    search: "console.error('Error fetching owner analytics:', error);",
    replace:
      "logError('Error fetching owner analytics', error, { \n      endpoint: '/api/owners/analytics',\n      userId: req.user?._id,\n      query: req.query \n    });",
  },
  {
    search: "console.error('Error fetching owner bookings:', error);",
    replace:
      "logError('Error fetching owner bookings', error, { \n      endpoint: '/api/owners/bookings',\n      userId: req.user?._id,\n      query: req.query \n    });",
  },
  {
    search: "console.error('Error submitting owner application:', error);",
    replace:
      "logError('Error submitting owner application', error, { \n      endpoint: '/api/owners/apply',\n      userId: req.user?._id \n    });",
  },
  {
    search: "console.error('Error fetching owner application:', error);",
    replace:
      "logError('Error fetching owner application', error, { \n      endpoint: '/api/owners/application',\n      userId: req.user?._id \n    });",
  },
  {
    search: "console.error('Error updating owner application:', error);",
    replace:
      "logError('Error updating owner application', error, { \n      endpoint: '/api/owners/application',\n      userId: req.user?._id \n    });",
  },
  {
    search: "console.error('Error uploading application documents:', error);",
    replace:
      "logError('Error uploading application documents', error, { \n      endpoint: '/api/owners/application/documents',\n      userId: req.user?._id \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(ownersFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in owners.js');
console.log(`📝 Applied ${replacements.length} replacements`);
