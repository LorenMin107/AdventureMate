const mongoose = require('mongoose');
const User = require('../models/user');
const Booking = require('../models/booking');
const Review = require('../models/review');
const SafetyAlert = require('../models/safetyAlert');
const Trip = require('../models/trip');
const OwnerApplication = require('../models/ownerApplication');
const config = require('../config');
const { logInfo, logError, logWarn } = require('../utils/logger');

// Connect to database
mongoose.connect(config.db.url);

/**
 * Clean up orphaned user references across all collections
 */
const cleanupOrphanedUserReferences = async () => {
  try {
    logInfo('Starting cleanup of orphaned user references...');

    // Get all user IDs that exist
    const existingUsers = await User.find({}, '_id');
    const existingUserIds = existingUsers.map((user) => user._id.toString());

    logInfo(`Found ${existingUserIds.length} existing users`);

    let totalCleaned = 0;

    // 1. Clean up orphaned booking references
    logInfo('Checking bookings for orphaned user references...');
    const orphanedBookings = await Booking.find({
      user: { $nin: existingUserIds },
    });

    if (orphanedBookings.length > 0) {
      logWarn(`Found ${orphanedBookings.length} bookings with orphaned user references`);
      await Booking.deleteMany({ user: { $nin: existingUserIds } });
      totalCleaned += orphanedBookings.length;
      logInfo(`Deleted ${orphanedBookings.length} orphaned bookings`);
    }

    // 2. Clean up orphaned review references
    logInfo('Checking reviews for orphaned author references...');
    const orphanedReviews = await Review.find({
      author: { $nin: existingUserIds },
    });

    if (orphanedReviews.length > 0) {
      logWarn(`Found ${orphanedReviews.length} reviews with orphaned author references`);
      await Review.deleteMany({ author: { $nin: existingUserIds } });
      totalCleaned += orphanedReviews.length;
      logInfo(`Deleted ${orphanedReviews.length} orphaned reviews`);
    }

    // 3. Clean up orphaned safety alert references
    logInfo('Checking safety alerts for orphaned createdBy references...');
    const orphanedSafetyAlerts = await SafetyAlert.find({
      createdBy: { $nin: existingUserIds },
    });

    if (orphanedSafetyAlerts.length > 0) {
      logWarn(
        `Found ${orphanedSafetyAlerts.length} safety alerts with orphaned createdBy references`
      );
      await SafetyAlert.deleteMany({ createdBy: { $nin: existingUserIds } });
      totalCleaned += orphanedSafetyAlerts.length;
      logInfo(`Deleted ${orphanedSafetyAlerts.length} orphaned safety alerts`);
    }

    // 4. Clean up orphaned trip references
    logInfo('Checking trips for orphaned user references...');
    const orphanedTrips = await Trip.find({
      user: { $nin: existingUserIds },
    });

    if (orphanedTrips.length > 0) {
      logWarn(`Found ${orphanedTrips.length} trips with orphaned user references`);
      await Trip.deleteMany({ user: { $nin: existingUserIds } });
      totalCleaned += orphanedTrips.length;
      logInfo(`Deleted ${orphanedTrips.length} orphaned trips`);
    }

    // 5. Clean up orphaned owner application references
    logInfo('Checking owner applications for orphaned user references...');
    const orphanedApplications = await OwnerApplication.find({
      user: { $nin: existingUserIds },
    });

    if (orphanedApplications.length > 0) {
      logWarn(
        `Found ${orphanedApplications.length} owner applications with orphaned user references`
      );
      await OwnerApplication.deleteMany({ user: { $nin: existingUserIds } });
      totalCleaned += orphanedApplications.length;
      logInfo(`Deleted ${orphanedApplications.length} orphaned owner applications`);
    }

    // 6. Clean up orphaned acknowledgments in safety alerts
    logInfo('Checking safety alerts for orphaned acknowledgment references...');
    const safetyAlertsWithAcks = await SafetyAlert.find({
      'acknowledgedBy.user': { $exists: true },
    });

    let ackCleaned = 0;
    for (const alert of safetyAlertsWithAcks) {
      if (alert.acknowledgedBy && alert.acknowledgedBy.length > 0) {
        const originalLength = alert.acknowledgedBy.length;
        alert.acknowledgedBy = alert.acknowledgedBy.filter((ack) =>
          existingUserIds.includes(ack.user.toString())
        );

        if (alert.acknowledgedBy.length !== originalLength) {
          await alert.save();
          ackCleaned += originalLength - alert.acknowledgedBy.length;
        }
      }
    }

    if (ackCleaned > 0) {
      logInfo(`Cleaned up ${ackCleaned} orphaned acknowledgment references`);
    }

    // 7. Clean up orphaned collaborator references in trips
    logInfo('Checking trips for orphaned collaborator references...');
    const tripsWithCollaborators = await Trip.find({
      collaborators: { $exists: true, $ne: [] },
    });

    let collaboratorCleaned = 0;
    for (const trip of tripsWithCollaborators) {
      if (trip.collaborators && trip.collaborators.length > 0) {
        const originalLength = trip.collaborators.length;
        trip.collaborators = trip.collaborators.filter((collaboratorId) =>
          existingUserIds.includes(collaboratorId.toString())
        );

        if (trip.collaborators.length !== originalLength) {
          await trip.save();
          collaboratorCleaned += originalLength - trip.collaborators.length;
        }
      }
    }

    if (collaboratorCleaned > 0) {
      logInfo(`Cleaned up ${collaboratorCleaned} orphaned collaborator references`);
    }

    logInfo('Cleanup completed', {
      totalDocumentsCleaned: totalCleaned,
      acknowledgmentReferencesCleaned: ackCleaned,
      collaboratorReferencesCleaned: collaboratorCleaned,
    });

    return {
      totalDocumentsCleaned: totalCleaned,
      acknowledgmentReferencesCleaned: ackCleaned,
      collaboratorReferencesCleaned: collaboratorCleaned,
    };
  } catch (error) {
    logError('Error cleaning up orphaned user references', error);
    throw error;
  }
};

/**
 * Check for orphaned references without cleaning them up
 */
const checkOrphanedUserReferences = async () => {
  try {
    logInfo('Checking for orphaned user references across all collections...');

    // Get all user IDs that exist
    const existingUsers = await User.find({}, '_id');
    const existingUserIds = existingUsers.map((user) => user._id.toString());

    logInfo(`Found ${existingUserIds.length} existing users`);

    const results = {};

    // 1. Check bookings
    const orphanedBookings = await Booking.find({
      user: { $nin: existingUserIds },
    });
    results.orphanedBookings = orphanedBookings.length;

    // 2. Check reviews
    const orphanedReviews = await Review.find({
      author: { $nin: existingUserIds },
    });
    results.orphanedReviews = orphanedReviews.length;

    // 3. Check safety alerts
    const orphanedSafetyAlerts = await SafetyAlert.find({
      createdBy: { $nin: existingUserIds },
    });
    results.orphanedSafetyAlerts = orphanedSafetyAlerts.length;

    // 4. Check trips
    const orphanedTrips = await Trip.find({
      user: { $nin: existingUserIds },
    });
    results.orphanedTrips = orphanedTrips.length;

    // 5. Check owner applications
    const orphanedApplications = await OwnerApplication.find({
      user: { $nin: existingUserIds },
    });
    results.orphanedApplications = orphanedApplications.length;

    // 6. Check acknowledgment references
    const safetyAlertsWithAcks = await SafetyAlert.find({
      'acknowledgedBy.user': { $exists: true },
    });

    let orphanedAcks = 0;
    for (const alert of safetyAlertsWithAcks) {
      if (alert.acknowledgedBy && alert.acknowledgedBy.length > 0) {
        orphanedAcks += alert.acknowledgedBy.filter(
          (ack) => !existingUserIds.includes(ack.user.toString())
        ).length;
      }
    }
    results.orphanedAcknowledgments = orphanedAcks;

    // 7. Check collaborator references
    const tripsWithCollaborators = await Trip.find({
      collaborators: { $exists: true, $ne: [] },
    });

    let orphanedCollaborators = 0;
    for (const trip of tripsWithCollaborators) {
      if (trip.collaborators && trip.collaborators.length > 0) {
        orphanedCollaborators += trip.collaborators.filter(
          (collaboratorId) => !existingUserIds.includes(collaboratorId.toString())
        ).length;
      }
    }
    results.orphanedCollaborators = orphanedCollaborators;

    logInfo('Orphaned reference analysis completed', results);

    return results;
  } catch (error) {
    logError('Error checking orphaned user references', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'cleanup':
        await cleanupOrphanedUserReferences();
        break;
      case 'check':
        await checkOrphanedUserReferences();
        break;
      default:
        console.log(`
Orphaned User Reference Cleanup Script

Usage:
  node scripts/cleanupOrphanedUsers.js <command>

Commands:
  cleanup            - Clean up orphaned user references across all collections
  check              - Check for orphaned user references without cleaning them up

Examples:
  node scripts/cleanupOrphanedUsers.js check
  node scripts/cleanupOrphanedUsers.js cleanup

Note: 
- The 'check' command will analyze all collections for orphaned user references
- The 'cleanup' command will remove orphaned references from all collections
- This script should be run after deleting users from MongoDB Atlas
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
  cleanupOrphanedUserReferences,
  checkOrphanedUserReferences,
};
