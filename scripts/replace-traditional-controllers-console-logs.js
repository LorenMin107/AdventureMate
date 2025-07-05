#!/usr/bin/env node

/**
 * Script to replace all console statements in traditional controllers
 */

const fs = require('fs');
const path = require('path');

// Files to process
const files = ['../controllers/bookings.js'];

files.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replacements for console statements
  const replacements = [
    {
      search:
        'console.log(\n    `[${timestamp}] Traditional payment success endpoint called for session_id: ${session_id}`\n  );',
      replace:
        "logInfo('Traditional payment success endpoint called', { \n    sessionId: session_id,\n    timestamp,\n    endpoint: '/bookings/payment-success' \n  });",
    },
    {
      search:
        'console.log(`Request details - IP: ${requestIP}, User-Agent: ${userAgent}, Referer: ${referer}`);',
      replace:
        "logDebug('Payment success request details', { \n    sessionId: session_id,\n    requestIP,\n    userAgent,\n    referer \n  });",
    },
    {
      search:
        'console.log(`[${timestamp}] Payment verified as paid for session_id: ${session_id}`);',
      replace:
        "logInfo('Payment verified as paid', { \n    sessionId: session_id,\n    timestamp \n  });",
    },
    {
      search:
        'console.log(\n        `[${timestamp}] User mismatch for session_id: ${session_id}. Expected: ${userId}, Got: ${req.user._id.toString()}`\n      );',
      replace:
        "logWarn('User mismatch for payment session', { \n    sessionId: session_id,\n    expectedUserId: userId,\n    actualUserId: req.user._id.toString() \n  });",
    },
    {
      search:
        'console.log(`[${timestamp}] Duplicate booking detected for session_id: ${session_id}`);',
      replace:
        "logWarn('Duplicate booking detected', { \n    sessionId: session_id,\n    timestamp \n  });",
    },
    {
      search:
        'console.log(`Original booking created at: ${bookingCreatedAt} (${timeSinceCreation}ms ago)`);',
      replace:
        "logDebug('Original booking details', { \n    sessionId: session_id,\n    bookingCreatedAt,\n    timeSinceCreation \n  });",
    },
    {
      search:
        'console.log(\n        `Booking with session ID ${session_id} already exists. Redirecting to bookings view.`\n      );',
      replace:
        "logInfo('Redirecting to bookings view due to duplicate', { \n    sessionId: session_id \n  });",
    },
    {
      search: 'console.log(`[${timestamp}] Creating new booking for session_id: ${session_id}`);',
      replace:
        "logInfo('Creating new booking', { \n    sessionId: session_id,\n    timestamp \n  });",
    },
    {
      search: 'console.log(`[${timestamp}] Booking saved to database with _id: ${booking._id}`);',
      replace:
        "logInfo('Booking saved to database', { \n    sessionId: session_id,\n    bookingId: booking._id,\n    timestamp \n  });",
    },
    {
      search: 'console.log(`[${timestamp}] Campground updated with booking reference`);',
      replace:
        "logInfo('Campground updated with booking reference', { \n    sessionId: session_id,\n    timestamp \n  });",
    },
    {
      search: 'console.log(`[${timestamp}] Campsite updated with booked dates`);',
      replace:
        "logInfo('Campsite updated with booked dates', { \n    sessionId: session_id,\n    timestamp \n  });",
    },
    {
      search: 'console.log(`[${timestamp}] User updated with booking reference`);',
      replace:
        "logInfo('User updated with booking reference', { \n    sessionId: session_id,\n    timestamp \n  });",
    },
    {
      search:
        'console.log(`[${timestamp}] Booking creation process completed in ${processingTime}ms`);',
      replace:
        "logInfo('Booking creation process completed', { \n    sessionId: session_id,\n    processingTime,\n    timestamp \n  });",
    },
  ];

  // Apply replacements
  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
  });

  // Write the updated content back to the file
  fs.writeFileSync(fullPath, content, 'utf8');

  console.log(`✅ Successfully replaced console statements in ${filePath}`);
});

console.log(`📝 Processed ${files.length} files`);
