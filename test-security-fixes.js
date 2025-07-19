#!/usr/bin/env node

/**
 * Test script to verify security fixes are working
 *
 * This script tests:
 * 1. JWT middleware properly enforces authentication
 * 2. Public endpoints still work
 * 3. Protected endpoints require valid tokens
 *
 * Usage: node test-security-fixes.js
 */

console.log('🔒 Testing Security Fixes...\n');

// Test JWT middleware behavior
console.log('1️⃣  Testing JWT middleware authentication enforcement...');

const { authenticateJWT, requireAuth } = require('./middleware/jwtAuth');

// Mock request and response objects
const createMockReq = (url, method = 'GET', headers = {}) => ({
  originalUrl: url,
  method: method,
  headers: { ...headers },
  ip: '127.0.0.1',
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    headersSent: false,
    data: null,
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.data = data;
      return this;
    },
  };
  return res;
};

// Test public endpoint (should work without token)
console.log('\n📋 Testing public endpoint access...');
const publicReq = createMockReq('/api/v1/campgrounds');
const publicRes = createMockRes();
let publicNextCalled = false;

authenticateJWT(publicReq, publicRes, () => {
  publicNextCalled = true;
});

if (publicNextCalled && !publicRes.data) {
  console.log('✅ PASSED: Public endpoints work without authentication');
} else {
  console.log('❌ FAILED: Public endpoints should work without authentication');
  console.log('   Next called:', publicNextCalled, 'Response data:', publicRes.data);
}

// Test protected endpoint without token (should fail)
console.log('\n📋 Testing protected endpoint without token...');
const protectedReq = createMockReq('/api/v1/users/profile');
const protectedRes = createMockRes();
let protectedNextCalled = false;

authenticateJWT(protectedReq, protectedRes, () => {
  protectedNextCalled = true;
});

if (!protectedNextCalled && protectedRes.statusCode === 401) {
  console.log('✅ PASSED: Protected endpoints require authentication');
} else {
  console.log('❌ FAILED: Protected endpoints should require authentication');
  console.log('   Next called:', protectedNextCalled, 'Status:', protectedRes.statusCode);
}

// Test protected endpoint with invalid token (should fail)
console.log('\n📋 Testing protected endpoint with invalid token...');
const invalidTokenReq = createMockReq('/api/v1/users/profile', 'GET', {
  authorization: 'Bearer invalid_token_here',
});
const invalidTokenRes = createMockRes();
let invalidTokenNextCalled = false;

authenticateJWT(invalidTokenReq, invalidTokenRes, () => {
  invalidTokenNextCalled = true;
});

if (!invalidTokenNextCalled && invalidTokenRes.statusCode === 401) {
  console.log('✅ PASSED: Invalid tokens are properly rejected');
} else {
  console.log('❌ FAILED: Invalid tokens should be rejected');
  console.log('   Next called:', invalidTokenNextCalled, 'Status:', invalidTokenRes.statusCode);
}

// Test admin endpoint without admin privileges
console.log('\n📋 Testing admin endpoint access control...');
const adminReq = createMockReq('/api/v1/admin/dashboard');
const adminRes = createMockRes();
let adminNextCalled = false;

// Mock a regular user (not admin)
adminReq.user = { isAdmin: false };

const { requireAdmin } = require('./middleware/jwtAuth');
requireAdmin(adminReq, adminRes, () => {
  adminNextCalled = true;
});

if (!adminNextCalled && adminRes.statusCode === 403) {
  console.log('✅ PASSED: Admin endpoints require admin privileges');
} else {
  console.log('❌ FAILED: Admin endpoints should require admin privileges');
  console.log('   Next called:', adminNextCalled, 'Status:', adminRes.statusCode);
}

// Test owner endpoint without owner privileges
console.log('\n📋 Testing owner endpoint access control...');
const ownerReq = createMockReq('/api/v1/owners/dashboard');
const ownerRes = createMockRes();
let ownerNextCalled = false;

// Mock a regular user (not owner)
ownerReq.user = { isOwner: false };

const { requireOwner } = require('./middleware/jwtAuth');
requireOwner(ownerReq, ownerRes, () => {
  ownerNextCalled = true;
});

if (!ownerNextCalled && ownerRes.statusCode === 403) {
  console.log('✅ PASSED: Owner endpoints require owner privileges');
} else {
  console.log('❌ FAILED: Owner endpoints should require owner privileges');
  console.log('   Next called:', ownerNextCalled, 'Status:', ownerRes.statusCode);
}

// Test public endpoints list with correct HTTP methods
console.log('\n📋 Testing public endpoints list...');
const publicEndpoints = [
  { url: '/api/v1/campgrounds', method: 'GET' },
  { url: '/api/v1/campgrounds/search', method: 'GET' },
  { url: '/api/v1/campgrounds/123', method: 'GET' },
  { url: '/api/v1/forum', method: 'GET' },
  { url: '/api/v1/weather', method: 'GET' },
  { url: '/api/v1/auth/login', method: 'POST' },
  { url: '/api/v1/auth/register', method: 'POST' },
  { url: '/api/v1/auth/refresh', method: 'POST' },
  { url: '/api/v1/auth/forgot-password', method: 'POST' },
  { url: '/api/v1/auth/reset-password', method: 'POST' },
  { url: '/api/v1/auth/verify-email', method: 'POST' },
  { url: '/api/v1/auth/resend-verification', method: 'POST' },
  { url: '/api/v1/auth/status', method: 'GET' },
  { url: '/api/v1/auth/google', method: 'POST' },
];

let publicEndpointsPassed = 0;
publicEndpoints.forEach((endpoint) => {
  const req = createMockReq(endpoint.url, endpoint.method);
  const res = createMockRes();
  let nextCalled = false;

  authenticateJWT(req, res, () => {
    nextCalled = true;
  });

  if (nextCalled && !res.data) {
    publicEndpointsPassed++;
  }
});

if (publicEndpointsPassed === publicEndpoints.length) {
  console.log(
    `✅ PASSED: All ${publicEndpoints.length} public endpoints work without authentication`
  );
} else {
  console.log(
    `❌ FAILED: Only ${publicEndpointsPassed}/${publicEndpoints.length} public endpoints work`
  );
  console.log('   Failed endpoints:');
  publicEndpoints.forEach((endpoint, index) => {
    const req = createMockReq(endpoint.url, endpoint.method);
    const res = createMockRes();
    let nextCalled = false;

    authenticateJWT(req, res, () => {
      nextCalled = true;
    });

    if (!(nextCalled && !res.data)) {
      console.log(`     - ${endpoint.method} ${endpoint.url}`);
    }
  });
}

// Test protected endpoints list
console.log('\n📋 Testing protected endpoints list...');
const protectedEndpoints = [
  { url: '/api/v1/users/profile', method: 'GET' },
  { url: '/api/v1/users/settings', method: 'GET' },
  { url: '/api/v1/bookings', method: 'GET' },
  { url: '/api/v1/admin/dashboard', method: 'GET' },
  { url: '/api/v1/owners/dashboard', method: 'GET' },
  { url: '/api/v1/campgrounds/new', method: 'POST' },
  { url: '/api/v1/reviews/create', method: 'POST' },
];

let protectedEndpointsPassed = 0;
protectedEndpoints.forEach((endpoint) => {
  const req = createMockReq(endpoint.url, endpoint.method);
  const res = createMockRes();
  let nextCalled = false;

  authenticateJWT(req, res, () => {
    nextCalled = true;
  });

  if (!nextCalled && res.statusCode === 401) {
    protectedEndpointsPassed++;
  }
});

if (protectedEndpointsPassed === protectedEndpoints.length) {
  console.log(
    `✅ PASSED: All ${protectedEndpoints.length} protected endpoints require authentication`
  );
} else {
  console.log(
    `❌ FAILED: Only ${protectedEndpointsPassed}/${protectedEndpoints.length} protected endpoints require authentication`
  );
  console.log('   Failed endpoints:');
  protectedEndpoints.forEach((endpoint, index) => {
    const req = createMockReq(endpoint.url, endpoint.method);
    const res = createMockRes();
    let nextCalled = false;

    authenticateJWT(req, res, () => {
      nextCalled = true;
    });

    if (!(!nextCalled && res.statusCode === 401)) {
      console.log(
        `     - ${endpoint.method} ${endpoint.url} (nextCalled: ${nextCalled}, status: ${res.statusCode})`
      );
    }
  });
}

console.log('\n🎉 Security tests completed!');
console.log('\n📋 Summary:');
console.log(`- Public endpoints tested: ${publicEndpoints.length}`);
console.log(`- Protected endpoints tested: ${protectedEndpoints.length}`);
console.log(
  `- Authentication enforcement: ${protectedEndpointsPassed === protectedEndpoints.length ? '✅ Working' : '❌ Needs attention'}`
);
console.log(
  `- Public access: ${publicEndpointsPassed === publicEndpoints.length ? '✅ Working' : '❌ Needs attention'}`
);
console.log(
  `- Admin access control: ${adminNextCalled === false && adminRes.statusCode === 403 ? '✅ Working' : '❌ Needs attention'}`
);
console.log(
  `- Owner access control: ${ownerNextCalled === false && ownerRes.statusCode === 403 ? '✅ Working' : '❌ Needs attention'}`
);

console.log(
  '\n📖 See SECURITY-FIXES-README.md for detailed information about the security improvements.'
);
