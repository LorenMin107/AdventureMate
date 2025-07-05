#!/usr/bin/env node

/**
 * Script to replace all console statements in emailService.js
 */

const fs = require('fs');
const path = require('path');

const emailServiceFile = path.join(__dirname, '../utils/emailService.js');
let content = fs.readFileSync(emailServiceFile, 'utf8');

// Replacements for console statements
const replacements = [
  {
    search: "console.log('Email transporter initialized with configured settings');",
    replace: "logInfo('Email transporter initialized with configured settings');",
  },
  {
    search: "console.log('No email configuration found, will use Ethereal Email for testing');",
    replace: "logInfo('No email configuration found, will use Ethereal Email for testing');",
  },
  {
    search: "console.log('Creating Ethereal Email test account for development...');",
    replace: "logInfo('Creating Ethereal Email test account for development');",
  },
  {
    search: "console.log('Ethereal Email test account created:', testAccount.user);",
    replace:
      "logInfo('Ethereal Email test account created', { \n      user: testAccount.user \n    });",
  },
  {
    search: "console.error('Failed to create Ethereal Email test account:', error);",
    replace: "logError('Failed to create Ethereal Email test account', error);",
  },
  {
    search:
      'console.log(`Attempting to send email to: ${options.to}, subject: ${options.subject}`);',
    replace:
      "logInfo('Attempting to send email', { \n      to: options.to,\n      subject: options.subject \n    });",
  },
  {
    search: "console.log('Email transporter obtained successfully');",
    replace: "logDebug('Email transporter obtained successfully');",
  },
  {
    search: "console.log('Sending email with options:', {",
    replace: "logDebug('Sending email with options', {",
  },
  {
    search: "console.log('Email sent successfully:', info.messageId);",
    replace:
      "logInfo('Email sent successfully', { \n      messageId: info.messageId,\n      to: options.to \n    });",
  },
  {
    search: "console.log('Email preview URL:', nodemailer.getTestMessageUrl(info));",
    replace:
      "logInfo('Email preview URL', { \n      previewUrl: nodemailer.getTestMessageUrl(info) \n    });",
  },
  {
    search: "console.error('Failed to send email:', error);",
    replace:
      "logError('Failed to send email', error, { \n      to: options.to,\n      subject: options.subject \n    });",
  },
];

// Apply replacements
replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(emailServiceFile, content, 'utf8');

console.log('✅ Successfully replaced all console statements in emailService.js');
console.log(`📝 Applied ${replacements.length} replacements`);
