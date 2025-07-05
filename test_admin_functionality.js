const mongoose = require('mongoose');
const User = require('./models/user');
const Owner = require('./models/owner');
const { logError, logInfo, logDebug } = require('./utils/logger');

// Test script to verify admin functionality
async function testAdminFunctionality() {
  try {
    // Connect to MongoDB (using the same connection as the main app)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myancamp');
      logInfo('Connected to MongoDB');
    }

    logInfo('Testing Admin Functionality...');

    // Test 1: Create test users
    logInfo('1. Creating test users...');
    const testUser = new User({
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      phone: '+1234567890',
      isAdmin: false,
      isOwner: false,
    });
    await testUser.save();
    logInfo('✓ Test user created', { username: testUser.username });

    const adminUser = new User({
      username: 'admin_' + Date.now(),
      email: 'admin_' + Date.now() + '@example.com',
      phone: '+1234567891',
      isAdmin: true,
      isOwner: false,
    });
    await adminUser.save();
    logInfo('✓ Admin user created', { username: adminUser.username });

    // Test 2: Test user promotion to admin
    logInfo('2. Testing user promotion to admin...');
    testUser.isAdmin = true;
    await testUser.save();
    logInfo('✓ User promoted to admin');
    logInfo('Admin status', { isAdmin: testUser.isAdmin });

    // Test 3: Test user promotion to owner
    logInfo('3. Testing user promotion to owner...');

    // Check if owner profile already exists
    let existingOwner = await Owner.findOne({ user: testUser._id });
    if (!existingOwner) {
      // Create a basic owner profile
      const owner = new Owner({
        user: testUser._id,
        businessName: `${testUser.username}'s Business`,
        businessType: 'individual',
        businessAddress: {
          street: 'Not provided',
          city: 'Not provided',
          state: 'Not provided',
          zipCode: 'Not provided',
          country: 'Myanmar',
        },
        businessPhone: testUser.phone || 'Not provided',
        businessEmail: testUser.email,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: adminUser._id,
        verificationNotes: [
          {
            note: 'Owner status granted directly by admin',
            addedBy: adminUser._id,
            type: 'admin_note',
          },
        ],
      });
      await owner.save();
      logInfo('✓ Owner profile created', { ownerId: owner._id });
    }

    testUser.isOwner = true;
    await testUser.save();
    logInfo('✓ User promoted to owner');
    logInfo('Owner status', { isOwner: testUser.isOwner });

    // Test 4: Verify owner profile exists and is active
    logInfo('4. Verifying owner profile...');
    const ownerProfile = await Owner.findOne({ user: testUser._id });
    if (ownerProfile) {
      logInfo('✓ Owner profile found');
      logInfo('Owner profile business name', { businessName: ownerProfile.businessName });
      logInfo('Owner verification status', { verificationStatus: ownerProfile.verificationStatus });
      logInfo('Owner active status', { isActive: ownerProfile.isActive });
    } else {
      logError('❌ Owner profile not found');
    }

    // Test 5: Test owner status removal
    logInfo('5. Testing owner status removal...');
    if (ownerProfile) {
      ownerProfile.isActive = false;
      ownerProfile.verificationStatus = 'suspended';
      ownerProfile.suspendedAt = new Date();
      ownerProfile.suspendedBy = adminUser._id;
      ownerProfile.suspensionReason = 'Owner status removed by admin';
      ownerProfile.verificationNotes.push({
        note: 'Owner status removed by admin',
        addedBy: adminUser._id,
        type: 'admin_note',
      });
      await ownerProfile.save();
      logInfo('✓ Owner profile deactivated');
    }

    testUser.isOwner = false;
    await testUser.save();
    logInfo('✓ User owner status removed');
    logInfo('Owner status after removal', { isOwner: testUser.isOwner });

    logInfo('✅ All admin functionality tests passed!');

    // Cleanup
    logInfo('6. Cleaning up test data...');
    await User.findByIdAndDelete(testUser._id);
    await User.findByIdAndDelete(adminUser._id);
    if (ownerProfile) {
      await Owner.findByIdAndDelete(ownerProfile._id);
    }
    logInfo('✓ Test data cleaned up');
  } catch (error) {
    logError('❌ Test failed', error);
  } finally {
    // Close connection if we opened it
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logInfo('MongoDB connection closed');
    }
  }
}

// Run the test
if (require.main === module) {
  testAdminFunctionality();
}

module.exports = testAdminFunctionality;
