#!/usr/bin/env node

/**
 * Script to replace all console statements in test_owner_application.js
 */

const fs = require('fs');
const path = require('path');

const testOwnerApplicationFile = path.join(__dirname, '../test_owner_application.js');
let content = fs.readFileSync(testOwnerApplicationFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.log('Connected to MongoDB');",
    replace: "logInfo('Connected to MongoDB');",
  },
  {
    search: "console.log('Testing Owner Application System...\\n');",
    replace: "logInfo('Testing Owner Application System...');",
  },
  {
    search: "console.log('1. Creating test user...');",
    replace: "logInfo('1. Creating test user...');",
  },
  {
    search: "console.log('✓ Test user created:', testUser.username);",
    replace: "logInfo('✓ Test user created', { username: testUser.username });",
  },
  {
    search: "console.log('\\n2. Creating owner application...');",
    replace: "logInfo('2. Creating owner application...');",
  },
  {
    search: "console.log('✓ Owner application created:', application._id);",
    replace: "logInfo('✓ Owner application created', { applicationId: application._id });",
  },
  {
    search: "console.log('\\n3. Testing application methods...');",
    replace: "logInfo('3. Testing application methods...');",
  },
  {
    search: "console.log('Can be modified:', application.canBeModified());",
    replace:
      "logInfo('Application can be modified', { canBeModified: application.canBeModified() });",
  },
  {
    search: "console.log('Status display:', application.statusDisplay);",
    replace: "logInfo('Application status display', { statusDisplay: application.statusDisplay });",
  },
  {
    search: "console.log('Full business address:', application.fullBusinessAddress);",
    replace:
      "logInfo('Application full business address', { fullBusinessAddress: application.fullBusinessAddress });",
  },
  {
    search: "console.log('\\n4. Creating admin user...');",
    replace: "logInfo('4. Creating admin user...');",
  },
  {
    search: "console.log('✓ Admin user created:', adminUser.username);",
    replace: "logInfo('✓ Admin user created', { username: adminUser.username });",
  },
  {
    search: "console.log('\\n5. Testing application approval...');",
    replace: "logInfo('5. Testing application approval...');",
  },
  {
    search: "console.log('✓ Application approved');",
    replace: "logInfo('✓ Application approved');",
  },
  {
    search: "console.log('New status:', application.status);",
    replace: "logInfo('Application new status', { status: application.status });",
  },
  {
    search: "console.log('Reviewed by:', application.reviewedBy);",
    replace: "logInfo('Application reviewed by', { reviewedBy: application.reviewedBy });",
  },
  {
    search: "console.log('\\n6. Creating owner from application...');",
    replace: "logInfo('6. Creating owner from application...');",
  },
  {
    search: "console.log('✓ Owner created:', owner._id);",
    replace: "logInfo('✓ Owner created', { ownerId: owner._id });",
  },
  {
    search: "console.log('✓ User marked as owner');",
    replace: "logInfo('✓ User marked as owner');",
  },
  {
    search: "console.log('\\n7. Testing owner methods...');",
    replace: "logInfo('7. Testing owner methods...');",
  },
  {
    search: "console.log('Can manage campgrounds:', owner.canManageCampgrounds());",
    replace:
      "logInfo('Owner can manage campgrounds', { canManageCampgrounds: owner.canManageCampgrounds() });",
  },
  {
    search: "console.log('Verification status display:', owner.verificationStatusDisplay);",
    replace:
      "logInfo('Owner verification status display', { verificationStatusDisplay: owner.verificationStatusDisplay });",
  },
  {
    search:
      "console.log('\\n✅ All tests passed! Owner application system is working correctly.');",
    replace: "logInfo('✅ All tests passed! Owner application system is working correctly.');",
  },
  {
    search: "console.log('\\n8. Cleaning up test data...');",
    replace: "logInfo('8. Cleaning up test data...');",
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
fs.writeFileSync(testOwnerApplicationFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in test_owner_application.js');
console.log(`📝 Applied ${replacements.length} replacements`);
