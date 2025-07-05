const mongoose = require('mongoose');
const Review = require('../models/review');
const User = require('../models/user');
const config = require('../config');
const { logInfo, logError, logWarn } = require('../utils/logger');

// Connect to database
mongoose.connect(config.db.url);

/**
 * Check for orphaned reviews (reviews without valid authors)
 */
const checkOrphanedReviews = async () => {
  try {
    logInfo('Checking for orphaned reviews...');

    // Get all reviews
    const reviews = await Review.find({}).populate('author');
    logInfo(`Found ${reviews.length} total reviews`);

    let orphanedCount = 0;
    let validCount = 0;

    for (const review of reviews) {
      if (!review.author) {
        logWarn(`Found orphaned review: ${review._id}`, {
          reviewId: review._id,
          campgroundId: review.campground,
          body: review.body?.substring(0, 50) + '...',
          createdAt: review.createdAt,
        });
        orphanedCount++;
      } else {
        validCount++;
      }
    }

    logInfo('Review analysis completed', {
      totalReviews: reviews.length,
      validReviews: validCount,
      orphanedReviews: orphanedCount,
    });

    return {
      totalReviews: reviews.length,
      validReviews: validCount,
      orphanedReviews: orphanedCount,
    };
  } catch (error) {
    logError('Error checking orphaned reviews', error);
    throw error;
  }
};

/**
 * Clean up orphaned reviews by deleting them
 */
const cleanupOrphanedReviews = async () => {
  try {
    logInfo('Starting cleanup of orphaned reviews...');

    // Find reviews where author is null or doesn't exist
    const orphanedReviews = await Review.find({
      $or: [{ author: null }, { author: { $exists: false } }],
    });

    logInfo(`Found ${orphanedReviews.length} orphaned reviews to delete`);

    if (orphanedReviews.length > 0) {
      const deleteResult = await Review.deleteMany({
        $or: [{ author: null }, { author: { $exists: false } }],
      });

      logInfo('Cleanup completed', {
        deletedCount: deleteResult.deletedCount,
      });

      return deleteResult;
    } else {
      logInfo('No orphaned reviews found to clean up');
      return { deletedCount: 0 };
    }
  } catch (error) {
    logError('Error cleaning up orphaned reviews', error);
    throw error;
  }
};

/**
 * Check for reviews with invalid author references
 */
const checkInvalidAuthorReferences = async () => {
  try {
    logInfo('Checking for reviews with invalid author references...');

    // Get all reviews
    const reviews = await Review.find({});
    logInfo(`Found ${reviews.length} reviews to check`);

    let invalidCount = 0;
    let validCount = 0;

    for (const review of reviews) {
      if (review.author) {
        // Check if the referenced user exists
        const user = await User.findById(review.author);
        if (!user) {
          logWarn(`Found review with invalid author reference: ${review._id}`, {
            reviewId: review._id,
            authorId: review.author,
            campgroundId: review.campground,
            body: review.body?.substring(0, 50) + '...',
          });
          invalidCount++;
        } else {
          validCount++;
        }
      } else {
        logWarn(`Found review with null author: ${review._id}`, {
          reviewId: review._id,
          campgroundId: review.campground,
          body: review.body?.substring(0, 50) + '...',
        });
        invalidCount++;
      }
    }

    logInfo('Author reference analysis completed', {
      totalReviews: reviews.length,
      validReferences: validCount,
      invalidReferences: invalidCount,
    });

    return {
      totalReviews: reviews.length,
      validReferences: validCount,
      invalidReferences: invalidCount,
    };
  } catch (error) {
    logError('Error checking author references', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'check':
        await checkOrphanedReviews();
        break;
      case 'cleanup':
        await cleanupOrphanedReviews();
        break;
      case 'check-references':
        await checkInvalidAuthorReferences();
        break;
      default:
        console.log(`
Review Analysis Script

Usage:
  node scripts/checkReviews.js <command>

Commands:
  check              - Check for orphaned reviews
  cleanup            - Delete orphaned reviews
  check-references   - Check for invalid author references

Examples:
  node scripts/checkReviews.js check
  node scripts/checkReviews.js cleanup
  node scripts/checkReviews.js check-references

Note: 
- The 'check' command will analyze your reviews and show orphaned ones
- The 'cleanup' command will delete orphaned reviews
- The 'check-references' command will check for invalid author references
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
  checkOrphanedReviews,
  cleanupOrphanedReviews,
  checkInvalidAuthorReferences,
};
