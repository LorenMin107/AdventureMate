#!/usr/bin/env node

/**
 * Script to replace all console statements in deprecation.js
 */

const fs = require('fs');
const path = require('path');

const deprecationFile = path.join(__dirname, '../middleware/deprecation.js');
let content = fs.readFileSync(deprecationFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.error('Error adding deprecation warning to response:', error);",
    replace:
      "logError('Error adding deprecation warning to response', error, { \n      endpoint: req.originalUrl,\n      method: req.method \n    });",
  },
  {
    search: "console.log('DEPRECATION USAGE:', JSON.stringify(logData));",
    replace:
      "logInfo('Deprecation usage logged', { \n      endpoint: logData.endpoint,\n      method: logData.method,\n      userId: logData.userId,\n      deprecationVersion: logData.deprecationVersion \n    });",
  },
  {
    search: ".catch(err => console.error('Error logging deprecation usage:', err));",
    replace:
      ".catch((err) => logError('Error logging deprecation usage', err, { \n      endpoint: logData.endpoint,\n      method: logData.method \n    }));",
  },
  {
    search: "console.error('Error adding auth conversion notice to response:', error);",
    replace:
      "logError('Error adding auth conversion notice to response', error, { \n      endpoint: req.originalUrl,\n      method: req.method \n    });",
  },
  {
    search: "console.error('Error converting session to JWT:', error);",
    replace:
      "logError('Error converting session to JWT', error, { \n      endpoint: req.originalUrl,\n      method: req.method,\n      userId: req.user?._id \n    });",
  },
  {
    search: "console.log('SESSION CONVERSION:', JSON.stringify(logData));",
    replace:
      "logInfo('Session conversion logged', { \n      endpoint: logData.endpoint,\n      method: logData.method,\n      userId: logData.userId,\n      successful: logData.successful \n    });",
  },
  {
    search: ".catch(err => console.error('Error logging session conversion:', err));",
    replace:
      ".catch((err) => logError('Error logging session conversion', err, { \n      endpoint: logData.endpoint,\n      method: logData.method \n    }));",
  },
  {
    search: "console.warn('Cannot log session conversion: No user ID provided');",
    replace:
      "logWarn('Cannot log session conversion: No user ID provided', { \n      endpoint: logData.endpoint,\n      method: logData.method \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(deprecationFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in deprecation.js');
console.log(`📝 Applied ${replacements.length} replacements`);
