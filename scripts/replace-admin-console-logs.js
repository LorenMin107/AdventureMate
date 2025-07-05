#!/usr/bin/env node

/**
 * Script to replace remaining console.error statements in admin.js
 */

const fs = require('fs');
const path = require('path');

const adminFile = path.join(__dirname, '../controllers/api/admin.js');
let content = fs.readFileSync(adminFile, 'utf8');

// Replacements for the remaining console.error statements
const replacements = [
  {
    search: "console.error('Error approving owner application:', error);",
    replace:
      "logError('Error approving owner application', error, { \n      endpoint: '/api/v1/admin/owner-applications/:id/approve',\n      userId: req.user?._id,\n      applicationId: req.params.id \n    });",
  },
  {
    search: "console.error('Error rejecting owner application:', error);",
    replace:
      "logError('Error rejecting owner application', error, { \n      endpoint: '/api/v1/admin/owner-applications/:id/reject',\n      userId: req.user?._id,\n      applicationId: req.params.id \n    });",
  },
  {
    search: "console.error('Error updating application review:', error);",
    replace:
      "logError('Error updating application review', error, { \n      endpoint: '/api/v1/admin/owner-applications/:id/review',\n      userId: req.user?._id,\n      applicationId: req.params.id \n    });",
  },
  {
    search: "console.error('Error fetching owners:', error);",
    replace:
      "logError('Error fetching owners', error, { \n      endpoint: '/api/v1/admin/owners',\n      userId: req.user?._id,\n      query: req.query \n    });",
  },
  {
    search: "console.error('Error fetching owner details:', error);",
    replace:
      "logError('Error fetching owner details', error, { \n      endpoint: '/api/v1/admin/owners/:id',\n      userId: req.user?._id,\n      ownerId: req.params.id \n    });",
  },
  {
    search: "console.error('Error suspending owner:', error);",
    replace:
      "logError('Error suspending owner', error, { \n      endpoint: '/api/v1/admin/owners/:id/suspend',\n      userId: req.user?._id,\n      ownerId: req.params.id \n    });",
  },
  {
    search: "console.error('Error reactivating owner:', error);",
    replace:
      "logError('Error reactivating owner', error, { \n      endpoint: '/api/v1/admin/owners/:id/reactivate',\n      userId: req.user?._id,\n      ownerId: req.params.id \n    });",
  },
  {
    search: "console.error('Error verifying owner:', error);",
    replace:
      "logError('Error verifying owner', error, { \n      endpoint: '/api/v1/admin/owners/:id/verify',\n      userId: req.user?._id,\n      ownerId: req.params.id \n    });",
  },
  {
    search: "console.error('Error revoking owner status:', error);",
    replace:
      "logError('Error revoking owner status', error, { \n      endpoint: '/api/v1/admin/owners/:id/revoke',\n      userId: req.user?._id,\n      ownerId: req.params.id \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(adminFile, content, 'utf8');

console.log('✅ Successfully replaced all console.error statements in admin.js');
console.log(`📝 Applied ${replacements.length} replacements`);
