#!/usr/bin/env node

/**
 * Generate secure secrets for AdventureMate application
 *
 * This script generates cryptographically secure random secrets for:
 * - JWT Access Token Secret
 * - JWT Refresh Token Secret
 * - Session Secret
 * - Session Store Secret
 *
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 Generating secure secrets for AdventureMate...\n');

// Generate JWT secrets (64 bytes = 128 hex characters)
const jwtAccessTokenSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshTokenSecret = crypto.randomBytes(64).toString('hex');

// Generate session secrets (32 bytes = 64 hex characters)
const sessionSecret = crypto.randomBytes(32).toString('hex');
const sessionStoreSecret = crypto.randomBytes(32).toString('hex');

console.log('📋 Copy these secrets to your .env file:\n');

console.log('# JWT Secrets');
console.log(`JWT_ACCESS_TOKEN_SECRET=${jwtAccessTokenSecret}`);
console.log(`JWT_REFRESH_TOKEN_SECRET=${jwtRefreshTokenSecret}`);
console.log('');

console.log('# Session Secrets');
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`SESSION_STORE_SECRET=${sessionStoreSecret}`);
console.log('');

console.log('📝 Example .env file content:');
console.log('=====================================');
console.log('NODE_ENV=development');
console.log('');
console.log('# Critical Security Variables');
console.log(`JWT_ACCESS_TOKEN_SECRET=${jwtAccessTokenSecret}`);
console.log(`JWT_REFRESH_TOKEN_SECRET=${jwtRefreshTokenSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`SESSION_STORE_SECRET=${sessionStoreSecret}`);
console.log('');
console.log('# Database');
console.log('DB_URL=mongodb://localhost:27017/adventure-mate');
console.log('');
console.log('# Redis (optional for development)');
console.log('REDIS_HOST=localhost');
console.log('REDIS_PORT=6379');
console.log('');
console.log('# Client URL');
console.log('CLIENT_URL=http://localhost:5173');
console.log('=====================================');
console.log('');

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('1. Never commit these secrets to version control');
console.log('2. Use different secrets for each environment (dev, staging, prod)');
console.log('3. Keep these secrets secure and rotate them regularly');
console.log('4. Make sure your .env file is in .gitignore');
console.log('');

console.log('✅ Secrets generated successfully!');
console.log('📖 See SECURITY-FIXES-README.md for more information.');
