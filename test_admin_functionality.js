const mongoose = require('mongoose');
const User = require('./models/user');
const Owner = require('./models/owner');

// Test script to verify admin functionality
async function testAdminFunctionality() {
  try {
    // Connect to MongoDB (using the same connection as the main app)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myancamp');
      console.log('Connected to MongoDB');
    }

    console.log('Testing Admin Functionality...\n');

    // Test 1: Create test users
    console.log('1. Creating test users...');
    const testUser = new User({
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      phone: '+1234567890',
      isAdmin: false,
      isOwner: false
    });
    await testUser.save();
    console.log('✓ Test user created:', testUser.username);

    const adminUser = new User({
      username: 'admin_' + Date.now(),
      email: 'admin_' + Date.now() + '@example.com',
      phone: '+1234567891',
      isAdmin: true,
      isOwner: false
    });
    await adminUser.save();
    console.log('✓ Admin user created:', adminUser.username);

    // Test 2: Test user promotion to admin
    console.log('\n2. Testing user promotion to admin...');
    testUser.isAdmin = true;
    await testUser.save();
    console.log('✓ User promoted to admin');
    console.log('Admin status:', testUser.isAdmin);

    // Test 3: Test user promotion to owner
    console.log('\n3. Testing user promotion to owner...');
    
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
          country: 'Myanmar'
        },
        businessPhone: testUser.phone || 'Not provided',
        businessEmail: testUser.email,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: adminUser._id,
        verificationNotes: [{
          note: 'Owner status granted directly by admin',
          addedBy: adminUser._id,
          type: 'admin_note'
        }]
      });
      await owner.save();
      console.log('✓ Owner profile created:', owner._id);
    }

    testUser.isOwner = true;
    await testUser.save();
    console.log('✓ User promoted to owner');
    console.log('Owner status:', testUser.isOwner);

    // Test 4: Verify owner profile exists and is active
    console.log('\n4. Verifying owner profile...');
    const ownerProfile = await Owner.findOne({ user: testUser._id });
    if (ownerProfile) {
      console.log('✓ Owner profile found');
      console.log('Business name:', ownerProfile.businessName);
      console.log('Verification status:', ownerProfile.verificationStatus);
      console.log('Is active:', ownerProfile.isActive);
    } else {
      console.log('❌ Owner profile not found');
    }

    // Test 5: Test owner status removal
    console.log('\n5. Testing owner status removal...');
    if (ownerProfile) {
      ownerProfile.isActive = false;
      ownerProfile.verificationStatus = 'suspended';
      ownerProfile.suspendedAt = new Date();
      ownerProfile.suspendedBy = adminUser._id;
      ownerProfile.suspensionReason = 'Owner status removed by admin';
      ownerProfile.verificationNotes.push({
        note: 'Owner status removed by admin',
        addedBy: adminUser._id,
        type: 'admin_note'
      });
      await ownerProfile.save();
      console.log('✓ Owner profile deactivated');
    }

    testUser.isOwner = false;
    await testUser.save();
    console.log('✓ User owner status removed');
    console.log('Owner status:', testUser.isOwner);

    console.log('\n✅ All admin functionality tests passed!');

    // Cleanup
    console.log('\n6. Cleaning up test data...');
    await User.findByIdAndDelete(testUser._id);
    await User.findByIdAndDelete(adminUser._id);
    if (ownerProfile) {
      await Owner.findByIdAndDelete(ownerProfile._id);
    }
    console.log('✓ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close connection if we opened it
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the test
if (require.main === module) {
  testAdminFunctionality();
}

module.exports = testAdminFunctionality;