#!/usr/bin/env node

/**
 * Script to help identify and replace console.log statements with proper logging
 * This script scans the codebase and reports console.log usage for manual replacement
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to scan
const directories = ['controllers', 'middleware', 'utils', 'routes', 'models', 'client/src'];

// File extensions to scan
const extensions = ['.js', '.jsx'];

// Console methods to find
const consoleMethods = [
  'console.log',
  'console.error',
  'console.warn',
  'console.info',
  'console.debug',
];

function findConsoleStatements(dir) {
  const results = [];

  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          consoleMethods.forEach((method) => {
            if (line.includes(method)) {
              results.push({
                file: fullPath,
                line: index + 1,
                method,
                content: line.trim(),
              });
            }
          });
        });
      }
    }
  }

  scanDirectory(dir);
  return results;
}

function generateReplacementSuggestions(results) {
  console.log('\n=== Console Statement Analysis ===\n');

  const suggestions = {
    'controllers/api/': {
      pattern: /console\.(log|error|warn)\(/g,
      replacement: 'logInfo/logError/logWarn(',
      import: "const { logInfo, logError, logWarn, logDebug } = require('../../utils/logger');",
    },
    'controllers/': {
      pattern: /console\.(log|error|warn)\(/g,
      replacement: 'logInfo/logError/logWarn(',
      import: "const { logInfo, logError, logWarn, logDebug } = require('../utils/logger');",
    },
    'middleware/': {
      pattern: /console\.(log|error|warn)\(/g,
      replacement: 'logInfo/logError/logWarn(',
      import: "const { logInfo, logError, logWarn, logDebug } = require('../utils/logger');",
    },
    'utils/': {
      pattern: /console\.(log|error|warn)\(/g,
      replacement: 'logInfo/logError/logWarn(',
      import: "const { logInfo, logError, logWarn, logDebug } = require('./logger');",
    },
    'client/src/': {
      pattern: /console\.(log|error|warn)\(/g,
      replacement: 'console.log/console.error/console.warn(',
      note: 'Frontend logging - consider using a proper logging library like winston-browser or debug',
    },
  };

  // Group by directory
  const grouped = {};
  results.forEach((result) => {
    const dir = Object.keys(suggestions).find((key) => result.file.includes(key)) || 'other';
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push(result);
  });

  // Print results
  Object.entries(grouped).forEach(([dir, items]) => {
    console.log(`\n📁 ${dir.toUpperCase()}:`);
    console.log(`   Found ${items.length} console statements`);

    if (suggestions[dir]) {
      console.log(`   Suggested import: ${suggestions[dir].import}`);
      if (suggestions[dir].note) {
        console.log(`   Note: ${suggestions[dir].note}`);
      }
    }

    items.forEach((item) => {
      console.log(`   ${item.file}:${item.line} - ${item.method}`);
      console.log(`     ${item.content}`);
    });
  });

  console.log('\n=== Summary ===');
  console.log(`Total console statements found: ${results.length}`);
  console.log('\n=== Next Steps ===');
  console.log('1. Add logger imports to each file');
  console.log('2. Replace console.log with logInfo/logDebug');
  console.log('3. Replace console.error with logError');
  console.log('4. Replace console.warn with logWarn');
  console.log('5. Add appropriate metadata to log calls');
}

// Main execution
try {
  console.log('🔍 Scanning for console statements...\n');

  const allResults = [];
  directories.forEach((dir) => {
    if (fs.existsSync(dir)) {
      const results = findConsoleStatements(dir);
      allResults.push(...results);
    }
  });

  generateReplacementSuggestions(allResults);
} catch (error) {
  console.error('Error scanning files:', error);
  process.exit(1);
}
