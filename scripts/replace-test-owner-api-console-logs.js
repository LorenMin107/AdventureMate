#!/usr/bin/env node

/**
 * Script to replace all console statements in test_owner_api.js
 */

const fs = require('fs');
const path = require('path');

const testOwnerApiFile = path.join(__dirname, '../test_owner_api.js');
let content = fs.readFileSync(testOwnerApiFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.log('Connected to MongoDB');",
    replace: "logInfo('Connected to MongoDB');",
  },
  {
    search: "console.log('Testing Owner Management API...\\n');",
    replace: "logInfo('Testing Owner Management API...');",
  },
  {
    search: "console.log('1. Logging in as admin...');",
    replace: "logInfo('1. Logging in as admin...');",
  },
  {
    search: "console.log('✓ Admin login successful');",
    replace: "logInfo('✓ Admin login successful');",
  },
  {
    search: "console.log('\\n2. Creating test user...');",
    replace: "logInfo('2. Creating test user...');",
  },
  {
    search: 'console.log(`✓ Test user created: ${testUser.username} (${testUserId})`);',
    replace: "logInfo('✓ Test user created', { username: testUser.username, userId: testUserId });",
  },
  {
    search: "console.log('\\n3. Making user an owner via API...');",
    replace: "logInfo('3. Making user an owner via API...');",
  },
  {
    search: "console.log('✓ User promoted to owner');",
    replace: "logInfo('✓ User promoted to owner');",
  },
  {
    search: 'console.log(`Owner status: ${toggleOwnerData.user.isOwner}`);',
    replace: "logInfo('Owner status updated', { isOwner: toggleOwnerData.user.isOwner });",
  },
  {
    search: "console.log('\\n4. Verifying owner profile...');",
    replace: "logInfo('4. Verifying owner profile...');",
  },
  {
    search: "console.log('✓ Owner profile found');",
    replace: "logInfo('✓ Owner profile found');",
  },
  {
    search: 'console.log(`Business name: ${ownerProfile.businessName}`);',
    replace: "logInfo('Owner profile details', { businessName: ownerProfile.businessName });",
  },
  {
    search: 'console.log(`Verification status: ${ownerProfile.verificationStatus}`);',
    replace:
      "logInfo('Owner verification status', { verificationStatus: ownerProfile.verificationStatus });",
  },
  {
    search: 'console.log(`Is active: ${ownerProfile.isActive}`);',
    replace: "logInfo('Owner active status', { isActive: ownerProfile.isActive });",
  },
  {
    search: "console.log('❌ Owner profile not found');",
    replace: "logError('❌ Owner profile not found');",
  },
  {
    search: "console.log('\\n5. Getting owner details via API...');",
    replace: "logInfo('5. Getting owner details via API...');",
  },
  {
    search: "console.log('✓ Owner details retrieved successfully');",
    replace: "logInfo('✓ Owner details retrieved successfully');",
  },
  {
    search: 'console.log(`Business name: ${ownerDetails.owner.businessName}`);',
    replace: "logInfo('Owner details', { businessName: ownerDetails.owner.businessName });",
  },
  {
    search: "console.log('\\n6. Suspending owner via API...');",
    replace: "logInfo('6. Suspending owner via API...');",
  },
  {
    search: "console.log('✓ Owner suspended successfully');",
    replace: "logInfo('✓ Owner suspended successfully');",
  },
  {
    search: 'console.log(`Verification status: ${suspendOwnerData.owner.verificationStatus}`);',
    replace:
      "logInfo('Owner verification status after suspension', { verificationStatus: suspendOwnerData.owner.verificationStatus });",
  },
  {
    search: 'console.log(`Is active: ${suspendOwnerData.owner.isActive}`);',
    replace:
      "logInfo('Owner active status after suspension', { isActive: suspendOwnerData.owner.isActive });",
  },
  {
    search: "console.log('\\n7. Reactivating owner via API...');",
    replace: "logInfo('7. Reactivating owner via API...');",
  },
  {
    search: "console.log('✓ Owner reactivated successfully');",
    replace: "logInfo('✓ Owner reactivated successfully');",
  },
  {
    search: 'console.log(`Verification status: ${reactivateOwnerData.owner.verificationStatus}`);',
    replace:
      "logInfo('Owner verification status after reactivation', { verificationStatus: reactivateOwnerData.owner.verificationStatus });",
  },
  {
    search: 'console.log(`Is active: ${reactivateOwnerData.owner.isActive}`);',
    replace:
      "logInfo('Owner active status after reactivation', { isActive: reactivateOwnerData.owner.isActive });",
  },
  {
    search: "console.log('\\n8. Revoking owner status via API...');",
    replace: "logInfo('8. Revoking owner status via API...');",
  },
  {
    search: "console.log('✓ Owner status revoked successfully');",
    replace: "logInfo('✓ Owner status revoked successfully');",
  },
  {
    search: 'console.log(`User owner status: ${revokeOwnerData.user.isOwner}`);',
    replace:
      "logInfo('User owner status after revocation', { isOwner: revokeOwnerData.user.isOwner });",
  },
  {
    search: "console.log('\\n✅ All owner management API tests passed!');",
    replace: "logInfo('✅ All owner management API tests passed!');",
  },
  {
    search: "console.log('\\n9. Cleaning up test data...');",
    replace: "logInfo('9. Cleaning up test data...');",
  },
  {
    search: "console.log('✓ Test data cleaned up');",
    replace: "logInfo('✓ Test data cleaned up');",
  },
  {
    search: "console.error('❌ Test failed:', error);",
    replace: "logError('❌ Test failed', error);",
  },
  {
    search: "console.log('MongoDB connection closed');",
    replace: "logInfo('MongoDB connection closed');",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(testOwnerApiFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in test_owner_api.js');
console.log(`📝 Applied ${replacements.length} replacements`);
