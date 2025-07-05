const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const mongoose = require('mongoose');
const User = require('./models/user');
const Owner = require('./models/owner');

// Base URL for API requests
const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';

// Test user data
const TEST_USER = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'password123'
};

// Global variables to store test data
let adminToken;
let testUserId;
let ownerId;

/**
 * Main test function
 */
async function testOwnerManagementAPI() {
  try {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myancamp');
      console.log('Connected to MongoDB');
    }

    console.log('Testing Owner Management API...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Failed to login: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    adminToken = loginData.accessToken;
    console.log('✓ Admin login successful');

    // Step 2: Create a test user directly in the database
    console.log('\n2. Creating test user...');
    const testUser = new User({
      username: TEST_USER.username,
      email: TEST_USER.email
    });
    await testUser.setPassword(TEST_USER.password);
    await testUser.save();
    testUserId = testUser._id;
    console.log(`✓ Test user created: ${testUser.username} (${testUserId})`);

    // Step 3: Make the user an owner using the API
    console.log('\n3. Making user an owner via API...');
    const toggleOwnerResponse = await fetch(`${API_BASE_URL}/admin/users/${testUserId}/toggle-owner`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isOwner: true })
    });

    if (!toggleOwnerResponse.ok) {
      throw new Error(`Failed to make user an owner: ${toggleOwnerResponse.status}`);
    }

    const toggleOwnerData = await toggleOwnerResponse.json();
    console.log('✓ User promoted to owner');
    console.log(`Owner status: ${toggleOwnerData.user.isOwner}`);

    // Step 4: Verify owner profile exists
    console.log('\n4. Verifying owner profile...');
    const ownerProfile = await Owner.findOne({ user: testUserId });
    if (ownerProfile) {
      ownerId = ownerProfile._id;
      console.log('✓ Owner profile found');
      console.log(`Business name: ${ownerProfile.businessName}`);
      console.log(`Verification status: ${ownerProfile.verificationStatus}`);
      console.log(`Is active: ${ownerProfile.isActive}`);
    } else {
      console.log('❌ Owner profile not found');
    }

    // Step 5: Get owner details via API
    console.log('\n5. Getting owner details via API...');
    const ownerDetailsResponse = await fetch(`${API_BASE_URL}/admin/owners/${ownerId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!ownerDetailsResponse.ok) {
      throw new Error(`Failed to get owner details: ${ownerDetailsResponse.status}`);
    }

    const ownerDetails = await ownerDetailsResponse.json();
    console.log('✓ Owner details retrieved successfully');
    console.log(`Business name: ${ownerDetails.owner.businessName}`);

    // Step 6: Suspend owner via API
    console.log('\n6. Suspending owner via API...');
    const suspendOwnerResponse = await fetch(`${API_BASE_URL}/admin/owners/${ownerId}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ reason: 'Testing owner suspension' })
    });

    if (!suspendOwnerResponse.ok) {
      throw new Error(`Failed to suspend owner: ${suspendOwnerResponse.status}`);
    }

    const suspendOwnerData = await suspendOwnerResponse.json();
    console.log('✓ Owner suspended successfully');
    console.log(`Verification status: ${suspendOwnerData.owner.verificationStatus}`);
    console.log(`Is active: ${suspendOwnerData.owner.isActive}`);

    // Step 7: Reactivate owner via API
    console.log('\n7. Reactivating owner via API...');
    const reactivateOwnerResponse = await fetch(`${API_BASE_URL}/admin/owners/${ownerId}/reactivate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ notes: 'Testing owner reactivation' })
    });

    if (!reactivateOwnerResponse.ok) {
      throw new Error(`Failed to reactivate owner: ${reactivateOwnerResponse.status}`);
    }

    const reactivateOwnerData = await reactivateOwnerResponse.json();
    console.log('✓ Owner reactivated successfully');
    console.log(`Verification status: ${reactivateOwnerData.owner.verificationStatus}`);
    console.log(`Is active: ${reactivateOwnerData.owner.isActive}`);

    // Step 8: Revoke owner status via API
    console.log('\n8. Revoking owner status via API...');
    const revokeOwnerResponse = await fetch(`${API_BASE_URL}/admin/owners/${ownerId}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ reason: 'Testing owner revocation' })
    });

    if (!revokeOwnerResponse.ok) {
      throw new Error(`Failed to revoke owner status: ${revokeOwnerResponse.status}`);
    }

    const revokeOwnerData = await revokeOwnerResponse.json();
    console.log('✓ Owner status revoked successfully');
    console.log(`User owner status: ${revokeOwnerData.user.isOwner}`);

    console.log('\n✅ All owner management API tests passed!');

    // Cleanup
    console.log('\n9. Cleaning up test data...');
    await User.findByIdAndDelete(testUserId);
    if (ownerId) {
      await Owner.findByIdAndDelete(ownerId);
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
  testOwnerManagementAPI();
}

module.exports = testOwnerManagementAPI;
