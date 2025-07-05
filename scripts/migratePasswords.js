const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const config = require('../config');
const { logInfo, logError, logWarn } = require('../utils/logger');

// Connect to database
mongoose.connect(config.db.url);

const SALT_ROUNDS = 12;

/**
 * Check if a password hash is from passport-local-mongoose
 * Passport-local-mongoose uses a specific format: $2a$10$...
 */
const isPassportHash = (hash) => {
  return hash && hash.startsWith('$2a$') && hash.length === 60;
};

/**
 * Check if a password hash is from bcrypt
 */
const isBcryptHash = (hash) => {
  return hash && hash.startsWith('$2b$') && hash.length === 60;
};

/**
 * Check if a password field is missing or empty
 */
const isMissingPassword = (password) => {
  return !password || password === '' || password === undefined;
};

/**
 * Migrate user passwords from passport-local-mongoose to bcrypt
 */
const migrateUserPasswords = async () => {
  try {
    logInfo('Starting password migration from passport-local-mongoose to bcrypt');

    // Get all users
    const users = await User.find({});
    logInfo(`Found ${users.length} users to process`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Check if user has a password field
        if (isMissingPassword(user.password)) {
          logWarn(`User ${user.username} (${user._id}) has no password field - skipping`);
          skippedCount++;
          continue;
        }

        // Check if password is already in bcrypt format
        if (isBcryptHash(user.password)) {
          logInfo(`User ${user.username} (${user._id}) already has bcrypt password - skipping`);
          skippedCount++;
          continue;
        }

        // Check if password is in passport format
        if (isPassportHash(user.password)) {
          logWarn(
            `User ${user.username} (${user._id}) has passport-local-mongoose password - needs manual migration`
          );
          logWarn(`For user ${user.username}, you need to reset their password manually`);
          skippedCount++;
          continue;
        }

        // If password is not in expected format, log it
        logWarn(
          `User ${user.username} (${user._id}) has unexpected password format: ${user.password ? user.password.substring(0, 20) + '...' : 'null'}`
        );
        skippedCount++;
      } catch (error) {
        logError(`Error processing user ${user.username} (${user._id})`, error);
        errorCount++;
      }
    }

    logInfo('Password migration completed', {
      totalUsers: users.length,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount,
    });

    return {
      totalUsers: users.length,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount,
    };
  } catch (error) {
    logError('Error during password migration', error);
    throw error;
  }
};

/**
 * Reset all user passwords to a default password
 * Use this if you want to force all users to reset their passwords
 */
const resetAllPasswords = async (defaultPassword = 'changeme123') => {
  try {
    logInfo('Starting password reset for all users');

    const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

    const result = await User.updateMany(
      {},
      {
        password: hashedPassword,
        isEmailVerified: false, // Force email verification again
      }
    );

    logInfo('Password reset completed', {
      modifiedCount: result.modifiedCount,
      defaultPassword: defaultPassword,
    });

    return result;
  } catch (error) {
    logError('Error during password reset', error);
    throw error;
  }
};

/**
 * Delete all users and recreate admin user
 * Use this if you want to start fresh
 */
const resetDatabase = async () => {
  try {
    logInfo('Starting database reset');

    // Delete all users
    const deleteResult = await User.deleteMany({});
    logInfo(`Deleted ${deleteResult.deletedCount} users`);

    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    const adminUser = new User({
      username: 'admin',
      email: 'admin@myancamp.com',
      phone: '1234567890',
      password: hashedPassword,
      isAdmin: true,
      isEmailVerified: true,
    });

    await adminUser.save();
    logInfo('Created new admin user', {
      username: adminUser.username,
      email: adminUser.email,
      password: 'admin123', // This will be logged for reference
    });

    return {
      deletedUsers: deleteResult.deletedCount,
      newAdminUser: adminUser,
    };
  } catch (error) {
    logError('Error during database reset', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'migrate':
        await migrateUserPasswords();
        break;
      case 'reset-passwords':
        const defaultPassword = process.argv[3] || 'changeme123';
        await resetAllPasswords(defaultPassword);
        break;
      case 'reset-database':
        await resetDatabase();
        break;
      default:
        console.log(`
Password Migration Script

Usage:
  node scripts/migratePasswords.js <command> [options]

Commands:
  migrate              - Analyze existing passwords and show migration status
  reset-passwords      - Reset all passwords to a default password
  reset-database       - Delete all users and create fresh admin user

Examples:
  node scripts/migratePasswords.js migrate
  node scripts/migratePasswords.js reset-passwords mypassword123
  node scripts/migratePasswords.js reset-database

Note: 
- The 'migrate' command will analyze your existing data and show what needs to be done
- The 'reset-passwords' command will set all user passwords to a default value
- The 'reset-database' command will delete all users and create a fresh admin user
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
  migrateUserPasswords,
  resetAllPasswords,
  resetDatabase,
};
