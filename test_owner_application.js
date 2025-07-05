const mongoose = require('mongoose');
const User = require('./models/user');
const OwnerApplication = require('./models/ownerApplication');
const Owner = require('./models/owner');

// Test script to verify owner application functionality
async function testOwnerApplication() {
  try {
    // Connect to MongoDB (using the same connection as the main app)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myancamp');
      console.log('Connected to MongoDB');
    }

    console.log('Testing Owner Application System...\n');

    // Test 1: Create a test user
    console.log('1. Creating test user...');
    const testUser = new User({
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      phone: '+1234567890',
      isAdmin: false,
      isOwner: false
    });
    await testUser.save();
    console.log('✓ Test user created:', testUser.username);

    // Test 2: Create an owner application
    console.log('\n2. Creating owner application...');
    const application = new OwnerApplication({
      user: testUser._id,
      businessName: 'Test Camping Business',
      businessType: 'company',
      businessRegistrationNumber: 'REG123456',
      taxId: 'TAX789012',
      businessAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Myanmar'
      },
      businessPhone: '+1234567890',
      businessEmail: 'business@test.com',
      applicationReason: 'I want to list my camping properties on the platform',
      experience: 'I have 5 years of experience in hospitality',
      expectedProperties: 3,
      status: 'pending'
    });
    await application.save();
    console.log('✓ Owner application created:', application._id);

    // Test 3: Test application methods
    console.log('\n3. Testing application methods...');
    console.log('Can be modified:', application.canBeModified());
    console.log('Status display:', application.statusDisplay);
    console.log('Full business address:', application.fullBusinessAddress);

    // Test 4: Create an admin user
    console.log('\n4. Creating admin user...');
    const adminUser = new User({
      username: 'admin_' + Date.now(),
      email: 'admin_' + Date.now() + '@example.com',
      phone: '+1234567891',
      isAdmin: true,
      isOwner: false
    });
    await adminUser.save();
    console.log('✓ Admin user created:', adminUser.username);

    // Test 5: Approve application
    console.log('\n5. Testing application approval...');
    await application.approve(adminUser, 'Application looks good, approved!');
    console.log('✓ Application approved');
    console.log('New status:', application.status);
    console.log('Reviewed by:', application.reviewedBy);

    // Test 6: Create owner from application
    console.log('\n6. Creating owner from application...');
    const owner = new Owner({
      user: application.user,
      businessName: application.businessName,
      businessType: application.businessType,
      businessRegistrationNumber: application.businessRegistrationNumber,
      taxId: application.taxId,
      businessAddress: application.businessAddress,
      businessPhone: application.businessPhone,
      businessEmail: application.businessEmail,
      bankingInfo: application.bankingInfo,
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      verifiedBy: adminUser._id,
      verificationDocuments: application.documents.map(doc => ({
        type: doc.type,
        filename: doc.filename,
        url: doc.url,
        uploadedAt: doc.uploadedAt,
        status: 'approved'
      }))
    });
    await owner.save();
    console.log('✓ Owner created:', owner._id);

    // Test 7: Update user to mark as owner
    await User.findByIdAndUpdate(testUser._id, { isOwner: true });
    console.log('✓ User marked as owner');

    // Test 8: Test owner methods
    console.log('\n7. Testing owner methods...');
    console.log('Can manage campgrounds:', owner.canManageCampgrounds());
    console.log('Verification status display:', owner.verificationStatusDisplay);

    console.log('\n✅ All tests passed! Owner application system is working correctly.');

    // Cleanup
    console.log('\n8. Cleaning up test data...');
    await User.findByIdAndDelete(testUser._id);
    await User.findByIdAndDelete(adminUser._id);
    await OwnerApplication.findByIdAndDelete(application._id);
    await Owner.findByIdAndDelete(owner._id);
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
  testOwnerApplication();
}

module.exports = testOwnerApplication;