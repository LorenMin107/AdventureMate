#!/usr/bin/env node

/**
 * Script to replace all console statements in ownerCampgrounds.js
 */

const fs = require('fs');
const path = require('path');

const ownerCampgroundsFile = path.join(__dirname, '../controllers/api/ownerCampgrounds.js');
let content = fs.readFileSync(ownerCampgroundsFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.error('Error fetching owner campgrounds:', error);",
    replace:
      "logError('Error fetching owner campgrounds', error, { \n      endpoint: '/api/owners/campgrounds',\n      userId: req.user?._id,\n      query: req.query \n    });",
  },
  {
    search: "console.error('Error creating campground:', error);",
    replace:
      "logError('Error creating campground', error, { \n      endpoint: '/api/owners/campgrounds',\n      userId: req.user?._id,\n      body: { title: req.body.title, location: req.body.location } \n    });",
  },
  {
    search: "console.error('Error fetching campground:', error);",
    replace:
      "logError('Error fetching campground', error, { \n      endpoint: '/api/owners/campgrounds/:id',\n      userId: req.user?._id,\n      campgroundId: req.params.id \n    });",
  },
  {
    search: "console.error('Error updating campground:', error);",
    replace:
      "logError('Error updating campground', error, { \n      endpoint: '/api/owners/campgrounds/:id',\n      userId: req.user?._id,\n      campgroundId: req.params.id \n    });",
  },
  {
    search: "console.error('Error deleting campground:', error);",
    replace:
      "logError('Error deleting campground', error, { \n      endpoint: '/api/owners/campgrounds/:id',\n      userId: req.user?._id,\n      campgroundId: req.params.id \n    });",
  },
  {
    search: "console.error('Error fetching campground bookings:', error);",
    replace:
      "logError('Error fetching campground bookings', error, { \n      endpoint: '/api/owners/campgrounds/:id/bookings',\n      userId: req.user?._id,\n      campgroundId: req.params.id \n    });",
  },
  {
    search: "console.error('Error updating booking status:', error);",
    replace:
      "logError('Error updating booking status', error, { \n      endpoint: '/api/owners/campgrounds/:campgroundId/bookings/:bookingId',\n      userId: req.user?._id,\n      campgroundId: req.params.campgroundId,\n      bookingId: req.params.bookingId \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(ownerCampgroundsFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in ownerCampgrounds.js');
console.log(`📝 Applied ${replacements.length} replacements`);
