#!/usr/bin/env node

/**
 * Script to replace all console statements in test_admin_functionality.js
 */

const fs = require('fs');
const path = require('path');

const testAdminFunctionalityFile = path.join(__dirname, '../test_admin_functionality.js');
let content = fs.readFileSync(testAdminFunctionalityFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.log('Connected to MongoDB');",
    replace: "logInfo('Connected to MongoDB');",
  },
  {
    search: "console.log('Testing Admin Functionality...\\n');",
    replace: "logInfo('Testing Admin Functionality...');",
  },
  {
    search: "console.log('1. Creating test users...');",
    replace: "logInfo('1. Creating test users...');",
  },
  {
    search: "console.log('✓ Test user created:', testUser.username);",
    replace: "logInfo('✓ Test user created', { username: testUser.username });",
  },
  {
    search: "console.log('✓ Admin user created:', adminUser.username);",
    replace: "logInfo('✓ Admin user created', { username: adminUser.username });",
  },
  {
    search: "console.log('\\n2. Testing user promotion to admin...');",
    replace: "logInfo('2. Testing user promotion to admin...');",
  },
  {
    search: "console.log('✓ User promoted to admin');",
    replace: "logInfo('✓ User promoted to admin');",
  },
  {
    search: "console.log('Admin status:', testUser.isAdmin);",
    replace: "logInfo('Admin status', { isAdmin: testUser.isAdmin });",
  },
  {
    search: "console.log('\\n3. Testing user promotion to owner...');",
    replace: "logInfo('3. Testing user promotion to owner...');",
  },
  {
    search: "console.log('✓ Owner profile created:', owner._id);",
    replace: "logInfo('✓ Owner profile created', { ownerId: owner._id });",
  },
  {
    search: "console.log('✓ User promoted to owner');",
    replace: "logInfo('✓ User promoted to owner');",
  },
  {
    search: "console.log('Owner status:', testUser.isOwner);",
    replace: "logInfo('Owner status', { isOwner: testUser.isOwner });",
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
    search: "console.log('Business name:', ownerProfile.businessName);",
    replace: "logInfo('Owner profile business name', { businessName: ownerProfile.businessName });",
  },
  {
    search: "console.log('Verification status:', ownerProfile.verificationStatus);",
    replace:
      "logInfo('Owner verification status', { verificationStatus: ownerProfile.verificationStatus });",
  },
  {
    search: "console.log('Is active:', ownerProfile.isActive);",
    replace: "logInfo('Owner active status', { isActive: ownerProfile.isActive });",
  },
  {
    search: "console.log('❌ Owner profile not found');",
    replace: "logError('❌ Owner profile not found');",
  },
  {
    search: "console.log('\\n5. Testing owner status removal...');",
    replace: "logInfo('5. Testing owner status removal...');",
  },
  {
    search: "console.log('✓ Owner profile deactivated');",
    replace: "logInfo('✓ Owner profile deactivated');",
  },
  {
    search: "console.log('✓ User owner status removed');",
    replace: "logInfo('✓ User owner status removed');",
  },
  {
    search: "console.log('Owner status:', testUser.isOwner);",
    replace: "logInfo('Owner status after removal', { isOwner: testUser.isOwner });",
  },
  {
    search: "console.log('\\n✅ All admin functionality tests passed!');",
    replace: "logInfo('✅ All admin functionality tests passed!');",
  },
  {
    search: "console.log('\\n6. Cleaning up test data...');",
    replace: "logInfo('6. Cleaning up test data...');",
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
fs.writeFileSync(testAdminFunctionalityFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in test_admin_functionality.js');
console.log(`📝 Applied ${replacements.length} replacements`);
