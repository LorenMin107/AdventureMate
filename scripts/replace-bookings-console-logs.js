#!/usr/bin/env node

/**
 * Script to replace all console statements in bookings.js
 */

const fs = require('fs');
const path = require('path');

const bookingsFile = path.join(__dirname, '../controllers/api/bookings.js');
let content = fs.readFileSync(bookingsFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.error('Error creating checkout session:', error);",
    replace:
      "logError('Error creating checkout session', error, { \n      endpoint: '/api/v1/campgrounds/:id/checkout',\n      userId: req.user?._id,\n      campgroundId: req.params.id \n    });",
  },
  {
    search:
      'console.log(`[${timestamp}] Payment success endpoint called for session_id: ${session_id}`);',
    replace:
      "logInfo('Payment success endpoint called', { \n      sessionId: session_id,\n      timestamp,\n      endpoint: '/api/v1/bookings/payment-success' \n    });",
  },
  {
    search:
      'console.log(\n      `Request details - IP: ${requestIP}, User-Agent: ${userAgent}, Referer: ${referer}`\n    );',
    replace:
      "logDebug('Payment success request details', { \n      sessionId: session_id,\n      requestIP,\n      userAgent,\n      referer \n    });",
  },
  {
    search: 'console.log(`[${timestamp}] Payment verified as paid for session_id: ${session_id}`);',
    replace:
      "logInfo('Payment verified as paid', { \n      sessionId: session_id,\n      timestamp \n    });",
  },
  {
    search:
      'console.log(\n      `User mismatch for session_id: ${session_id}. Expected: ${userId}, Got: ${req.user._id.toString()}`\n    );',
    replace:
      "logWarn('User mismatch for payment session', { \n      sessionId: session_id,\n      expectedUserId: userId,\n      actualUserId: req.user._id.toString() \n    });",
  },
  {
    search:
      'console.log(`[${timestamp}] Duplicate booking detected for session_id: ${session_id}`);',
    replace:
      "logWarn('Duplicate booking detected', { \n      sessionId: session_id,\n      timestamp \n    });",
  },
  {
    search:
      'console.log(`Original booking created at: ${bookingCreatedAt} (${timeSinceCreation}ms ago)`);',
    replace:
      "logDebug('Original booking details', { \n      sessionId: session_id,\n      bookingCreatedAt,\n      timeSinceCreation \n    });",
  },
  {
    search:
      'console.log(\n      `Booking with session ID ${session_id} already exists. Redirecting to bookings view.`\n    );',
    replace:
      "logInfo('Redirecting to bookings view due to duplicate', { \n      sessionId: session_id \n    });",
  },
  {
    search: 'console.log(`[${timestamp}] Creating new booking for session_id: ${session_id}`);',
    replace:
      "logInfo('Creating new booking', { \n      sessionId: session_id,\n      timestamp \n    });",
  },
  {
    search: 'console.log(`[${timestamp}] Booking saved to database with _id: ${booking._id}`);',
    replace:
      "logInfo('Booking saved to database', { \n      sessionId: session_id,\n      bookingId: booking._id,\n      timestamp \n    });",
  },
  {
    search: 'console.log(`[${timestamp}] Campground updated with booking reference`);',
    replace:
      "logInfo('Campground updated with booking reference', { \n      sessionId: session_id,\n      timestamp \n    });",
  },
  {
    search: 'console.log(`[${timestamp}] Campsite updated with booked dates`);',
    replace:
      "logInfo('Campsite updated with booked dates', { \n      sessionId: session_id,\n      timestamp \n    });",
  },
  {
    search: 'console.log(`[${timestamp}] User updated with booking reference`);',
    replace:
      "logInfo('User updated with booking reference', { \n      sessionId: session_id,\n      timestamp \n    });",
  },
  {
    search:
      'console.log(`[${timestamp}] Booking creation process completed in ${processingTime}ms`);',
    replace:
      "logInfo('Booking creation process completed', { \n      sessionId: session_id,\n      processingTime,\n      timestamp \n    });",
  },
  {
    search: 'console.error(`[${timestamp}] Error fetching campsite data for response:`, err);',
    replace:
      "logError('Error fetching campsite data for response', err, { \n      sessionId: session_id,\n      timestamp \n    });",
  },
  {
    search: "console.error('Error handling payment success:', error);",
    replace:
      "logError('Error handling payment success', error, { \n      sessionId: session_id,\n      endpoint: '/api/v1/bookings/payment-success' \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(bookingsFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in bookings.js');
console.log(`📝 Applied ${replacements.length} replacements`);
