#!/usr/bin/env node

/**
 * Script to replace all console statements in permissions.js
 */

const fs = require('fs');
const path = require('path');

const permissionsFile = path.join(__dirname, '../middleware/permissions.js');
let content = fs.readFileSync(permissionsFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.error('Error checking resource ownership:', error);",
    replace:
      "logError('Error checking resource ownership', error, { \n      endpoint: req.originalUrl,\n      userId: req.user?._id,\n      method: req.method \n    });",
  },
  {
    search: ".catch(error => console.error('Error storing audit log:', error));",
    replace:
      ".catch((error) => logError('Error storing audit log', error, { \n      auditEntry: auditEntry.action + ':' + auditEntry.resource,\n      userId: auditEntry.user \n    }));",
  },
  {
    search: "console.log('AUDIT LOG:', JSON.stringify(auditEntry));",
    replace:
      "logInfo('Audit log entry created', { \n      action: auditEntry.action,\n      resource: auditEntry.resource,\n      userId: auditEntry.user,\n      ipAddress: auditEntry.ipAddress \n    });",
  },
  {
    search: "console.error('Error storing audit log:', error);",
    replace:
      "logError('Error storing audit log', error, { \n      action: auditEntry.action,\n      resource: auditEntry.resource,\n      userId: auditEntry.user \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(permissionsFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in permissions.js');
console.log(`📝 Applied ${replacements.length} replacements`);
