#!/usr/bin/env node

/**
 * Script to replace console statements in remaining API controllers
 */

const fs = require('fs');
const path = require('path');

// Files to process with their replacements
const files = [
  {
    path: '../controllers/api/campsites.js',
    replacements: [
      {
        search: 'console.error("Failed to fetch campsites:", error);',
        replace:
          'logError("Failed to fetch campsites", error, { \n      endpoint: "/api/v1/campsites",\n      userId: req.user?._id \n    });',
      },
      {
        search: 'console.error("Error creating campsite:", error);',
        replace:
          'logError("Error creating campsite", error, { \n      endpoint: "/api/v1/campsites",\n      userId: req.user?._id,\n      campgroundId: req.params.campgroundId \n    });',
      },
      {
        search: 'console.error("Error fetching campsite:", error);',
        replace:
          'logError("Error fetching campsite", error, { \n      endpoint: "/api/v1/campsites/:id",\n      userId: req.user?._id,\n      campsiteId: req.params.id \n    });',
      },
      {
        search: 'console.error("Error updating campsite:", error);',
        replace:
          'logError("Error updating campsite", error, { \n      endpoint: "/api/v1/campsites/:id",\n      userId: req.user?._id,\n      campsiteId: req.params.id \n    });',
      },
      {
        search: 'console.error("Error deleting campsite:", error);',
        replace:
          'logError("Error deleting campsite", error, { \n      endpoint: "/api/v1/campsites/:id",\n      userId: req.user?._id,\n      campsiteId: req.params.id \n    });',
      },
    ],
  },
  {
    path: '../controllers/api/reviews.js',
    replacements: [
      {
        search: 'console.error("Error creating review:", error);',
        replace:
          'logError("Error creating review", error, { \n      endpoint: "/api/v1/campgrounds/:id/reviews",\n      userId: req.user?._id,\n      campgroundId: req.params.id \n    });',
      },
      {
        search: 'console.error("Error fetching reviews:", error);',
        replace:
          'logError("Error fetching reviews", error, { \n      endpoint: "/api/v1/campgrounds/:id/reviews",\n      campgroundId: req.params.id \n    });',
      },
      {
        search: 'console.error("Error deleting review:", error);',
        replace:
          'logError("Error deleting review", error, { \n      endpoint: "/api/v1/reviews/:id",\n      userId: req.user?._id,\n      reviewId: req.params.id \n    });',
      },
    ],
  },
];

files.forEach(({ path: filePath, replacements }) => {
  const fullPath = path.join(__dirname, filePath);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Add logger import if not already present
  if (
    !content.includes("require('../../utils/logger')") &&
    !content.includes('require("../utils/logger")')
  ) {
    const importLine =
      "const { logError, logInfo, logWarn, logDebug } = require('../../utils/logger');";
    const lastImportIndex = content.lastIndexOf('require(');
    const insertIndex = content.indexOf('\n', lastImportIndex) + 1;
    content = content.slice(0, insertIndex) + importLine + '\n' + content.slice(insertIndex);
  }

  // Apply replacements
  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
  });

  // Write the updated content back to the file
  fs.writeFileSync(fullPath, content, 'utf8');

  console.log(`✅ Successfully updated ${filePath}`);
});

console.log(`📝 Processed ${files.length} files`);
