#!/usr/bin/env node

/**
 * Script to replace all console statements in users.js
 */

const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '../controllers/api/users.js');
let content = fs.readFileSync(usersFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.error('Error fetching campground data for review:', err);",
    replace:
      "logError('Error fetching campground data for review', err, { \n      userId: req.user?._id,\n      reviewId: review._id \n    });",
  },
  {
    search: "console.error('Error fetching campground data for booking:', err);",
    replace:
      "logError('Error fetching campground data for booking', err, { \n      userId: req.user?._id,\n      bookingId: booking._id \n    });",
  },
  {
    search: "console.error('Error fetching campsite data:', err);",
    replace:
      "logError('Error fetching campsite data', err, { \n      userId: req.user?._id,\n      bookingId: booking._id \n    });",
  },
  {
    search: "console.error('Error fetching user:', error);",
    replace:
      "logError('Error fetching user', error, { \n      userId: req.user?._id,\n      endpoint: '/api/v1/users/profile' \n    });",
  },
  {
    search: "console.error('Error fetching campground data:', err);",
    replace:
      "logError('Error fetching campground data', err, { \n      userId: req.user?._id,\n      reviewId: review._id \n    });",
  },
  {
    search: "console.error('Error fetching campsite data:', err);",
    replace:
      "logError('Error fetching campsite data', err, { \n      userId: req.user?._id,\n      bookingId: booking._id \n    });",
  },
  {
    search: "console.error('Error updating profile:', error);",
    replace:
      "logError('Error updating profile', error, { \n      userId: req.user?._id,\n      endpoint: '/api/v1/users/profile' \n    });",
  },
  {
    search: "console.error('Error submitting contact:', error);",
    replace:
      "logError('Error submitting contact', error, { \n      userId: req.user?._id,\n      endpoint: '/api/v1/users/contact' \n    });",
  },
  {
    search: "console.error('Error fetching campground data for review:', err);",
    replace:
      "logError('Error fetching campground data for review', err, { \n      userId: req.user?._id,\n      reviewId: review._id \n    });",
  },
  {
    search: "console.error('Error fetching user reviews:', error);",
    replace:
      "logError('Error fetching user reviews', error, { \n      userId: req.user?._id,\n      endpoint: '/api/v1/users/reviews' \n    });",
  },
  {
    search: 'console.log(`Password reset requested for non-existent email: ${email}`);',
    replace: "logInfo('Password reset requested for non-existent email', { \n      email \n    });",
  },
  {
    search: "console.error('Error requesting password reset:', error);",
    replace:
      "logError('Error requesting password reset', error, { \n      email,\n      endpoint: '/api/v1/users/request-password-reset' \n    });",
  },
  {
    search: "console.log('Password change audit log created for user:', user._id);",
    replace: "logInfo('Password change audit log created', { \n      userId: user._id \n    });",
  },
  {
    search: "console.error('Error resetting password:', error);",
    replace:
      "logError('Error resetting password', error, { \n      endpoint: '/api/v1/users/reset-password' \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(usersFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in users.js');
console.log(`📝 Applied ${replacements.length} replacements`);
