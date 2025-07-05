#!/usr/bin/env node

/**
 * Script to replace remaining console statements in traditional controllers
 */

const fs = require('fs');
const path = require('path');

// Files to process
const files = [
  '../controllers/bookings.js',
  '../controllers/api/bookings.js',
  '../controllers/admin.js',
];

files.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Replacements for console statements
    const replacements = [
      {
        search:
          /console\.log\(\s*`\[${timestamp}\] Traditional payment success endpoint called for session_id: \${session_id}`\s*\);/g,
        replace:
          "logInfo('Traditional payment success endpoint called', { sessionId: session_id, timestamp });",
      },
      {
        search:
          /console\.log\(\s*`\[${timestamp}\] User mismatch for session_id: \${session_id}\. Expected: \${userId}, Got: \${req\.user\._id\.toString\(\)}`\s*\);/g,
        replace:
          "logWarn('User mismatch for payment session', { sessionId: session_id, expectedUserId: userId, actualUserId: req.user._id.toString(), timestamp });",
      },
      {
        search:
          /console\.log\(\s*`Booking with session ID \${session_id} already exists\. Redirecting to bookings view\.`\s*\);/g,
        replace:
          "logInfo('Booking with session ID already exists, redirecting to bookings view', { sessionId: session_id });",
      },
      {
        search:
          /console\.log\(\s*`\[${timestamp}\] Payment not completed for session_id: \${session_id}`\s*\);/g,
        replace: "logWarn('Payment not completed', { sessionId: session_id, timestamp });",
      },
      {
        search: /console\.error\(err\);/g,
        replace: "logError('Error in admin controller', err);",
      },
    ];

    // Apply replacements
    replacements.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });

    // Write the updated content back to the file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated ${filePath}`);
  }
});

console.log('✅ Successfully replaced remaining console statements in traditional controllers');
