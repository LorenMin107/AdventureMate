#!/usr/bin/env node

/**
 * Script to replace all console statements in seedDB.js
 */

const fs = require('fs');
const path = require('path');

const seedDBFile = path.join(__dirname, '../seedDB.js');
let content = fs.readFileSync(seedDBFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.log('Admin user already exists!');",
    replace: "logInfo('Admin user already exists');",
  },
  {
    search: "console.log('Admin user created!');",
    replace: "logInfo('Admin user created successfully');",
  },
  {
    search: "console.error('Error creating admin user:', error);",
    replace: "logError('Error creating admin user', error);",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(seedDBFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in seedDB.js');
console.log(`📝 Applied ${replacements.length} replacements`);
