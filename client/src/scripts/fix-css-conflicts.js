#!/usr/bin/env node

/**
 * CSS Conflict Detection and Fix Script
 *
 * This script helps identify and fix CSS class name conflicts between different sections
 * of the AdventureMate application.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common class names that are likely to cause conflicts
const CONFLICTING_CLASSES = [
  'btn',
  'btn-primary',
  'btn-secondary',
  'btn-outline',
  'card',
  'card-header',
  'card-title',
  'card-body',
  'nav-item',
  'nav-link',
  'page-header',
  'loading-spinner',
  'loading',
  'error',
  'success',
  'warning',
  'info',
  'text-center',
  'text-left',
  'text-right',
  'mb-1',
  'mb-2',
  'mb-3',
  'p-1',
  'p-2',
  'p-3',
  'mt-1',
  'mt-2',
  'mt-3',
];

// Section prefixes
const SECTIONS = {
  forum: 'forum',
  admin: 'admin',
  owner: 'owner',
  common: 'common',
};

/**
 * Detect CSS conflicts in a file
 * @param {string} filePath - Path to the file to analyze
 * @returns {Array} Array of detected conflicts
 */
function detectConflicts(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const conflicts = [];

  CONFLICTING_CLASSES.forEach((className) => {
    const regex = new RegExp(`\\b${className}\\b`, 'g');
    const matches = content.match(regex);

    if (matches) {
      conflicts.push({
        className,
        count: matches.length,
        file: filePath,
      });
    }
  });

  return conflicts;
}

/**
 * Determine the section of a file based on its path
 * @param {string} filePath - Path to the file
 * @returns {string} Section name
 */
function getFileSection(filePath) {
  if (filePath.includes('/forum/') || filePath.includes('Forum')) {
    return 'forum';
  } else if (filePath.includes('/admin/') || filePath.includes('Admin')) {
    return 'admin';
  } else if (filePath.includes('/owner/') || filePath.includes('Owner')) {
    return 'owner';
  } else {
    return 'common';
  }
}

/**
 * Generate scoped class name
 * @param {string} section - Section prefix
 * @param {string} className - Base class name
 * @returns {string} Scoped class name
 */
function scopeClass(section, className) {
  return `${section}-${className}`;
}

/**
 * Fix CSS conflicts in a file
 * @param {string} filePath - Path to the file to fix
 * @param {string} section - Section prefix
 * @returns {boolean} Whether the file was modified
 */
function fixConflicts(filePath, section) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  CONFLICTING_CLASSES.forEach((className) => {
    const regex = new RegExp(`\\b${className}\\b`, 'g');
    const scopedClass = scopeClass(section, className);

    if (content.includes(className)) {
      // Replace class names in JSX className attributes
      content = content.replace(
        new RegExp(`className=["']([^"']*\\b)${className}\\b([^"']*)["']`, 'g'),
        (match, before, after) => {
          modified = true;
          return `className="${before}${scopedClass}${after}"`;
        }
      );

      // Replace class names in CSS selectors
      content = content.replace(new RegExp(`\\.${className}\\b`, 'g'), (match) => {
        modified = true;
        return `.${scopedClass}`;
      });
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return modified;
}

/**
 * Main function
 */
function main() {
  // Find all JSX and CSS files
  const jsxFiles = glob.sync('client/src/**/*.{jsx,js}');
  const cssFiles = glob.sync('client/src/**/*.css');
  const allFiles = [...jsxFiles, ...cssFiles];

  let totalConflicts = 0;
  let fixedFiles = 0;

  // Detect conflicts
  allFiles.forEach((filePath) => {
    const conflicts = detectConflicts(filePath);

    if (conflicts.length > 0) {
      conflicts.forEach((conflict) => {
        totalConflicts += conflict.count;
      });
    }
  });

  if (totalConflicts === 0) {
    return;
  }

  // Ask user if they want to fix conflicts
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Do you want to automatically fix these conflicts? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      allFiles.forEach((filePath) => {
        const section = getFileSection(filePath);
        const conflicts = detectConflicts(filePath);

        if (conflicts.length > 0) {
          if (fixConflicts(filePath, section)) {
            fixedFiles++;
          }
        }
      });
    } else {
    }

    rl.close();
  });
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  detectConflicts,
  fixConflicts,
  getFileSection,
  scopeClass,
};
