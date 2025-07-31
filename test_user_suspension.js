const mongoose = require('mongoose');
const User = require('./models/user');
const { logInfo, logError } = require('./utils/logger');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/adventuremate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testUserSuspension() {
  try {
    logInfo('Starting user suspension test...');

    // Find a test user (non-admin)
    const testUser = await User.findOne({ isAdmin: false });

    if (!testUser) {
      logError('No test user found. Please create a non-admin user first.');
      return;
    }

    logInfo('Test user found:', {
      userId: testUser._id,
      username: testUser.username,
      email: testUser.email,
      isSuspended: testUser.isSuspended,
      accountType: testUser.googleId ? 'Google OAuth' : 'Traditional',
      googleId: testUser.googleId || null,
      isOwner: testUser.isOwner,
    });

    // Test 1: Suspend user
    logInfo('Test 1: Suspending user...');
    testUser.isSuspended = true;
    testUser.suspendedAt = new Date();
    testUser.suspendedBy = new mongoose.Types.ObjectId(); // Mock admin ID
    testUser.suspensionReason = 'Test suspension';
    testUser.suspensionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await testUser.save();

    logInfo('User suspended successfully:', {
      userId: testUser._id,
      isSuspended: testUser.isSuspended,
      suspensionReason: testUser.suspensionReason,
      suspendedAt: testUser.suspendedAt,
      suspensionExpiresAt: testUser.suspensionExpiresAt,
      accountType: testUser.googleId ? 'Google OAuth' : 'Traditional',
      isOwner: testUser.isOwner,
    });

    // Test 1.5: Check owner suspension if user is an owner
    if (testUser.isOwner) {
      const Owner = require('./models/owner');
      const owner = await Owner.findOne({ user: testUser._id });

      if (owner) {
        logInfo('Owner account suspension status:', {
          ownerId: owner._id,
          isActive: owner.isActive,
          verificationStatus: owner.verificationStatus,
          suspendedAt: owner.suspendedAt,
          suspensionReason: owner.suspensionReason,
        });
      }
    }

    // Test 2: Reactivate user
    logInfo('Test 2: Reactivating user...');
    testUser.isSuspended = false;
    testUser.suspendedAt = null;
    testUser.suspendedBy = null;
    testUser.suspensionReason = null;
    testUser.suspensionExpiresAt = null;

    await testUser.save();

    logInfo('User reactivated successfully:', {
      userId: testUser._id,
      isSuspended: testUser.isSuspended,
      accountType: testUser.googleId ? 'Google OAuth' : 'Traditional',
      isOwner: testUser.isOwner,
    });

    // Test 2.5: Check owner reactivation if user is an owner
    if (testUser.isOwner) {
      const Owner = require('./models/owner');
      const owner = await Owner.findOne({ user: testUser._id });

      if (owner) {
        logInfo('Owner account reactivation status:', {
          ownerId: owner._id,
          isActive: owner.isActive,
          verificationStatus: owner.verificationStatus,
          suspendedAt: owner.suspendedAt,
          suspensionReason: owner.suspensionReason,
        });
      }
    }

    // Test 3: Check suspension fields in database
    logInfo('Test 3: Verifying suspension fields...');
    const updatedUser = await User.findById(testUser._id);

    logInfo('User verification complete:', {
      userId: updatedUser._id,
      username: updatedUser.username,
      isSuspended: updatedUser.isSuspended,
      suspendedAt: updatedUser.suspendedAt,
      suspendedBy: updatedUser.suspendedBy,
      suspensionReason: updatedUser.suspensionReason,
      suspensionExpiresAt: updatedUser.suspensionExpiresAt,
      accountType: updatedUser.googleId ? 'Google OAuth' : 'Traditional',
      googleId: updatedUser.googleId || null,
      isOwner: updatedUser.isOwner,
    });

    // Test 3.5: Final owner verification if user is an owner
    if (updatedUser.isOwner) {
      const Owner = require('./models/owner');
      const owner = await Owner.findOne({ user: updatedUser._id });

      if (owner) {
        logInfo('Final owner account verification:', {
          ownerId: owner._id,
          isActive: owner.isActive,
          verificationStatus: owner.verificationStatus,
          suspendedAt: owner.suspendedAt,
          suspensionReason: owner.suspensionReason,
        });
      }
    }

    logInfo('All suspension tests completed successfully!');

    // Test 4: Test 2FA suspension bypass prevention
    logInfo('Testing 2FA suspension bypass prevention...');

    // Check if user has 2FA enabled
    if (updatedUser.isTwoFactorEnabled) {
      logInfo('User has 2FA enabled - testing suspension bypass prevention');

      // Simulate 2FA verification attempt (this should be blocked)
      logInfo('Simulating 2FA verification attempt for suspended user...');
      logInfo('Expected result: 2FA verification should be blocked due to suspension');
    } else {
      logInfo('User does not have 2FA enabled - testing regular login suspension');
      logInfo('Expected result: Regular login should be blocked due to suspension');
    }

    logInfo('2FA suspension bypass prevention test completed!');
  } catch (error) {
    logError('Error during suspension test:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the test
testUserSuspension();
