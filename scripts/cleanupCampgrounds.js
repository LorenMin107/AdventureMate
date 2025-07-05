const mongoose = require('mongoose');
const Campground = require('../models/campground');
const Review = require('../models/review');
const config = require('../config');
const { logInfo, logError, logWarn } = require('../utils/logger');

// Connect to database
mongoose.connect(config.db.url);

/**
 * Clean up campgrounds with orphaned review references
 */
const cleanupOrphanedReviewReferences = async () => {
  try {
    logInfo('Checking for campgrounds with orphaned review references...');

    // Get all campgrounds
    const campgrounds = await Campground.find({});
    logInfo(`Found ${campgrounds.length} campgrounds`);

    let cleanedCount = 0;

    for (const campground of campgrounds) {
      if (campground.reviews && campground.reviews.length > 0) {
        logInfo(`Checking campground: ${campground.title} (${campground._id})`);
        logInfo(`Has ${campground.reviews.length} review references`);

        // Check which review references are valid
        const validReviewIds = [];
        for (const reviewId of campground.reviews) {
          const review = await Review.findById(reviewId);
          if (review) {
            validReviewIds.push(reviewId);
            logInfo(`Review ${reviewId} exists`);
          } else {
            logWarn(`Review ${reviewId} does not exist, will be removed from campground`);
          }
        }

        // Update campground if there are orphaned references
        if (validReviewIds.length !== campground.reviews.length) {
          campground.reviews = validReviewIds;
          await campground.save();
          logInfo(
            `Updated campground ${campground.title}, removed ${campground.reviews.length - validReviewIds.length} orphaned review references`
          );
          cleanedCount++;
        }
      }
    }

    logInfo('Cleanup completed', {
      totalCampgrounds: campgrounds.length,
      cleanedCampgrounds: cleanedCount,
    });

    return {
      totalCampgrounds: campgrounds.length,
      cleanedCampgrounds: cleanedCount,
    };
  } catch (error) {
    logError('Error cleaning up campgrounds', error);
    throw error;
  }
};

/**
 * Check for orphaned references in all collections
 */
const checkAllOrphanedReferences = async () => {
  try {
    logInfo('Checking for orphaned references across all collections...');

    // Check campgrounds with orphaned review references
    const campgrounds = await Campground.find({});
    let orphanedReviewRefs = 0;

    for (const campground of campgrounds) {
      if (campground.reviews && campground.reviews.length > 0) {
        for (const reviewId of campground.reviews) {
          const review = await Review.findById(reviewId);
          if (!review) {
            orphanedReviewRefs++;
            logWarn(`Campground ${campground.title} has orphaned review reference: ${reviewId}`);
          }
        }
      }
    }

    // Check reviews with orphaned author references
    const reviews = await Review.find({});
    let orphanedAuthorRefs = 0;

    for (const review of reviews) {
      if (review.author) {
        const user = await require('../models/user').findById(review.author);
        if (!user) {
          orphanedAuthorRefs++;
          logWarn(`Review ${review._id} has orphaned author reference: ${review.author}`);
        }
      }
    }

    logInfo('Orphaned reference analysis completed', {
      totalCampgrounds: campgrounds.length,
      totalReviews: reviews.length,
      orphanedReviewRefs,
      orphanedAuthorRefs,
    });

    return {
      totalCampgrounds: campgrounds.length,
      totalReviews: reviews.length,
      orphanedReviewRefs,
      orphanedAuthorRefs,
    };
  } catch (error) {
    logError('Error checking orphaned references', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'cleanup':
        await cleanupOrphanedReviewReferences();
        break;
      case 'check':
        await checkAllOrphanedReferences();
        break;
      default:
        console.log(`
Campground Cleanup Script

Usage:
  node scripts/cleanupCampgrounds.js <command>

Commands:
  cleanup            - Clean up campgrounds with orphaned review references
  check              - Check for orphaned references across all collections

Examples:
  node scripts/cleanupCampgrounds.js cleanup
  node scripts/cleanupCampgrounds.js check

Note: 
- The 'cleanup' command will remove orphaned review references from campgrounds
- The 'check' command will analyze all collections for orphaned references
        `);
    }
  } catch (error) {
    logError('Script execution failed', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logInfo('Database connection closed');
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  cleanupOrphanedReviewReferences,
  checkAllOrphanedReferences,
};
