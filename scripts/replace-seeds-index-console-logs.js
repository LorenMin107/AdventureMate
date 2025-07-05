#!/usr/bin/env node

/**
 * Script to replace all console statements in seeds/index.js
 */

const fs = require('fs');
const path = require('path');

const seedsIndexFile = path.join(__dirname, '../seeds/index.js');
let content = fs.readFileSync(seedsIndexFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "db.on('error', console.error.bind(console, 'connection error:'));",
    replace: "db.on('error', (err) => logError('Database connection error', err));",
  },
  {
    search: "console.log('Database connected to:', config.db.url);",
    replace: "logInfo('Database connected', { url: config.db.url });",
  },
  {
    search:
      "console.log('Admin user not found! Please run seedDB.js first to create an admin user.');",
    replace:
      "logError('Admin user not found! Please run seedDB.js first to create an admin user.');",
  },
  {
    search: 'console.log(`Database already has ${campgroundCount} campgrounds. Skipping seed.`);',
    replace: "logInfo('Database already has campgrounds, skipping seed', { campgroundCount });",
  },
  {
    search: "console.log('Seeding campgrounds...');",
    replace: "logInfo('Seeding campgrounds...');",
  },
  {
    search: "console.log('Database connection closed.');",
    replace: "logInfo('Database connection closed.');",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(seedsIndexFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in seeds/index.js');
console.log(`📝 Applied ${replacements.length} replacements`);
