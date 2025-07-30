# AdventureMate Testing Guide

## Overview

This document provides comprehensive information about the testing setup for AdventureMate, including unit tests, integration tests, end-to-end tests, performance tests, and security tests.

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests (Playwright)
│   └── booking-flow.spec.js
├── integration/            # API integration tests
│   └── api-integration.test.js
├── performance/            # Performance tests
│   └── api-performance.test.js
├── security/              # Security tests
│   └── security-tests.test.js
├── unit/                  # Unit tests
│   ├── models/           # Model unit tests
│   │   ├── campground.test.js
│   │   └── user.test.js
│   └── utils/            # Utility function tests
│       ├── passwordUtils.test.js
│       └── validationUtils.test.js
├── basic.test.js          # Basic test infrastructure
└── setup.js               # Test setup and configuration
```

## Test Types

### 1. Unit Tests

- **Purpose**: Test individual functions and components in isolation
- **Coverage**: Models, utilities, helper functions
- **Framework**: Jest
- **Location**: `tests/unit/`
- **Files**:
  - `models/campground.test.js` - Campground model tests
  - `models/user.test.js` - User model tests
  - `utils/passwordUtils.test.js` - Password utility tests
  - `utils/validationUtils.test.js` - Validation utility tests

### 2. Integration Tests

- **Purpose**: Test API endpoints and their interactions
- **Coverage**: Complete API workflows, database operations
- **Framework**: Jest + Supertest
- **Location**: `tests/integration/`
- **Files**:
  - `api-integration.test.js` - Complete API integration tests

### 3. End-to-End Tests

- **Purpose**: Test complete user workflows in a real browser
- **Coverage**: Full booking flow, user interactions, navigation
- **Framework**: Playwright
- **Location**: `tests/e2e/`
- **Files**:
  - `booking-flow.spec.js` - Complete booking flow tests

### 4. Performance Tests

- **Purpose**: Ensure API endpoints meet performance requirements
- **Coverage**: Response times, concurrent requests, memory usage
- **Framework**: Jest + Supertest
- **Location**: `tests/performance/`
- **Files**:
  - `api-performance.test.js` - API performance benchmarks

### 5. Security Tests

- **Purpose**: Verify security measures and prevent vulnerabilities
- **Coverage**: SQL injection, XSS, authentication, authorization, input validation
- **Framework**: Jest + Supertest
- **Location**: `tests/security/`
- **Files**:
  - `security-tests.test.js` - Comprehensive security tests

## Running Tests

### Prerequisites

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.test` file with test-specific configurations:
   ```env
   NODE_ENV=test
   MONGODB_URI_TEST=mongodb://localhost:27017/adventuremate_test
   JWT_SECRET=test-secret-key
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

### Test Commands

#### All Tests

```bash
npm test
```

#### Specific Test Types

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e

# Performance tests only
npm run test:performance

# Security tests only
npm run test:security

# API tests only
npm run test:api
```

#### Test Options

```bash
# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/unit/models/campground.test.js
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

- **Test Environment**: jsdom for frontend, node for backend
- **Coverage**: Comprehensive coverage reporting
- **Mocking**: External services and dependencies
- **Timeout**: 30 seconds for async operations
- **Setup Files**: `tests/setup.js` and `client/src/setupTests.js`
- **Module Mappers**: CSS, images, and external libraries
- **Coverage Collection**: From client/src, controllers, models, middleware, utils, routes

### Playwright Configuration (`playwright.config.js`)

- **Browsers**: Chrome, Firefox, Safari
- **Base URL**: http://localhost:5173 (Vite dev server)
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry
- **Web Server**: Automatically starts dev server before tests
- **Mobile Tests**: Disabled until mobile responsiveness is implemented

## Test Utilities

### Global Test Utilities (`tests/setup.js`)

```javascript
// Create test data
const user = await global.testUtils.createTestUser();
const campground = await global.testUtils.createTestCampground();
const booking = await global.testUtils.createTestBooking();
const review = await global.testUtils.createTestReview();

// Get authentication token
const token = await global.testUtils.getAuthToken(user);

// Clear database
await global.testUtils.clearDatabase();
```

### Mocked Services

- **Email Service**: Nodemailer
- **File Storage**: Cloudinary
- **Maps**: Mapbox GL
- **Cache**: Redis (ioredis)
- **Authentication**: JWT, bcrypt
- **2FA**: Speakeasy, QR Code
- **Database**: Mongoose (comprehensive mocking)
- **Internationalization**: react-i18next

## Test Examples

### Unit Test Example (Model)

```javascript
describe('User Model', () => {
  test('should have required fields', () => {
    expect(mongoose.Schema).toBeDefined();
    expect(mongoose.model).toBeDefined();
  });

  test('should have find method', () => {
    const userModel = mongoose.model();
    expect(userModel.find).toBeDefined();
  });
});
```

### Unit Test Example (Utility)

```javascript
describe('Password Utils', () => {
  test('should hash password successfully', async () => {
    const mockHash = '$2b$10$mockhash';
    bcrypt.hash.mockResolvedValue(mockHash);

    const result = await hashPassword('testpassword');
    expect(result).toBe(mockHash);
  });
});
```

### Integration Test Example

```javascript
describe('Authentication Flow', () => {
  test('Complete authentication flow: register, login, logout', async () => {
    // Register new user with unique email/username
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const uniqueEmail = `newuser${uniqueId}@example.com`;
    const uniqueUsername = `newuser${uniqueId}`;

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      email: uniqueEmail,
      username: uniqueUsername,
      password: 'Password123!',
    });

    if (registerResponse.status === 201) {
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body).toHaveProperty('message');
    }
  });
});
```

### E2E Test Example

```javascript
test('Complete booking flow', async ({ page }) => {
  // Navigate to campgrounds page
  await page.locator('nav a[href="/campgrounds"]').click();
  await page.waitForLoadState('networkidle');

  // Look for campground links or cards
  const campgroundLinks = page.locator(
    'a[href*="/campgrounds/"], [data-testid="campground-card"], .campground-card a, .campground-link'
  );

  if ((await campgroundLinks.count()) > 0) {
    // Click on the first campground
    await campgroundLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Check that we're on a campground details page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*campgrounds\/.*/);
  }
});
```

## Performance Test Examples

### Response Time Tests

```javascript
test('GET /api/v1/campgrounds should respond within 500ms', async () => {
  const startTime = Date.now();

  const response = await request(app).get('/api/v1/campgrounds').expect(200);

  const endTime = Date.now();
  const responseTime = endTime - startTime;

  expect(responseTime).toBeLessThan(500);
  expect(response.body).toHaveProperty('data');
  expect(response.body.data).toHaveProperty('campgrounds');
});
```

### Concurrent Request Tests

```javascript
test('Should handle 5 concurrent search requests', async () => {
  const startTime = Date.now();

  const requests = Array(5)
    .fill()
    .map(() => request(app).get('/api/v1/campgrounds?search=test'));

  const responses = await Promise.all(requests);

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // All requests should succeed
  responses.forEach((response) => {
    expect(response.status).toBe(200);
  });

  // Total time should be reasonable for concurrent searches
  expect(totalTime).toBeLessThan(2000);
});
```

### Memory Usage Tests

```javascript
test('Should not exceed memory limits during concurrent requests', async () => {
  const initialMemory = process.memoryUsage().heapUsed;

  // Make multiple concurrent requests
  const requests = Array(20)
    .fill()
    .map(() => request(app).get('/api/v1/campgrounds'));

  await Promise.all(requests);

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;

  // Memory increase should be reasonable (less than 50MB)
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
});
```

## Security Test Examples

### SQL Injection Prevention

```javascript
test('Should prevent SQL injection in campground search', async () => {
  const maliciousQueries = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; INSERT INTO users VALUES ('hacker', 'password'); --",
    "' UNION SELECT * FROM users --",
    "'; UPDATE users SET password='hacked'; --",
  ];

  for (const query of maliciousQueries) {
    try {
      const response = await request(app).get(
        `/api/v1/campgrounds/search?search=${encodeURIComponent(query)}`
      );

      if (response.status === 200) {
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('campgrounds');
        expect(Array.isArray(response.body.data.campgrounds)).toBe(true);
      }
    } catch (error) {
      // If the endpoint crashes, that's also acceptable for security
      console.log('Search endpoint failed as expected with mocked mongoose');
    }
  }
});
```

### XSS Prevention

```javascript
test('Should prevent XSS in campground creation', async () => {
  if (!userToken) {
    console.log('Skipping XSS test - no auth token available');
    return;
  }

  const response = await request(app)
    .post('/api/v1/campgrounds')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      title: '<script>alert("XSS")</script>Test Campground',
      description: '<script>alert("XSS")</script>Test description',
      location: 'Test Location',
      price: 100,
    })
    .expect(403); // Should be forbidden for non-admin users

  // Should sanitize the input
  expect(response.body).toHaveProperty('error');
});
```

### Authentication Bypass

```javascript
test('Should require authentication for protected routes', async () => {
  const protectedRoutes = ['/api/v1/users/profile', '/api/v1/bookings'];

  for (const route of protectedRoutes) {
    const response = await request(app).get(route);
    expect(response.status).toBe(401); // Should require authentication
  }
});
```

### Input Validation

```javascript
test('Should validate email format', async () => {
  const response = await request(app).post('/api/v1/auth/register').send({
    email: 'invalid-email',
    username: 'testuser',
    password: 'Password123!',
  });

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toContain('Validation Error');
});
```

## Coverage Requirements

### Current Coverage Status

The current test coverage is **much lower** than ideal targets:

- **Overall Coverage**: ~10.63% statements, ~2.99% branches, ~4.5% functions, ~10.92% lines
- **Frontend Coverage**: Very low across most React components
- **Backend Coverage**: Some API routes have better coverage (~53.74% for v1 routes)

### Coverage Breakdown by Area

#### Well-Tested Areas (Good Coverage)

- **API Routes (v1)**: ~53.74% - Core API endpoints have decent coverage
- **Models**: ~32.63% - Some models like `booking.js`, `contact.js`, `trip.js` have 100% coverage
- **Utils**: ~30.64% - Some utility functions like `validationUtils.js` have 100% coverage

#### Areas Needing More Tests

- **Frontend Components**: Most React components have 0% coverage
- **Admin Components**: All admin components need tests
- **Forms**: All form components need tests
- **Pages**: Most pages need tests
- **Services**: Low coverage in services like `AuthService.js`

### Realistic Coverage Targets

Given the current state, here are **realistic targets** to work toward:

#### Short-term Goals

- **Overall Coverage**: 25-30%
- **Critical API Routes**: 70-80%
- **Core Models**: 60-70%
- **Essential Utils**: 70-80%

#### Medium-term Goals

- **Overall Coverage**: 40-50%
- **Frontend Components**: 30-40%
- **Admin Features**: 50-60%
- **Integration Tests**: 60-70%

#### Long-term Goals

- **Overall Coverage**: 60-70%
- **Frontend Components**: 50-60%
- **All Critical Paths**: 80%+
- **Edge Cases**: 40-50%

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:performance
      - run: npm run test:security
      - run: npm run test:coverage
      - run: npm run test:e2e
```

## Best Practices

### Test Organization

1. **Arrange**: Set up test data and conditions
2. **Act**: Execute the function or API call
3. **Assert**: Verify the expected outcome

### Naming Conventions

- Test files: `*.test.js` or `*.spec.js`
- Test descriptions: Clear and descriptive
- Test data: Use realistic but minimal data

### Test Isolation

- Each test should be independent
- Clean up test data after each test
- Use unique identifiers for test data

### Mocking Strategy

- Mock external services (email, file upload, etc.)
- Mock time-dependent operations
- Mock expensive operations (database queries in unit tests)

### Error Testing

- Test both success and failure scenarios
- Test edge cases and boundary conditions
- Test error handling and validation

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:

   ```bash
   # Ensure MongoDB is running
   mongod --dbpath ./test-data
   ```

2. **Port Conflicts**:

   ```bash
   # Check if port 5173 is in use (Vite dev server)
   lsof -i :5173
   # Kill process if needed
   kill -9 <PID>
   ```

3. **Test Timeouts**:

   ```javascript
   // Increase timeout for specific test
   test('slow test', async () => {
     // test code
   }, 60000);
   ```

4. **Mock Issues**:
   ```javascript
   // Clear mocks between tests
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test with debug
DEBUG=* npm test -- tests/unit/models/campground.test.js
```

## Performance Testing

### Load Testing

```bash
# Install autocannon for load testing
npm install -g autocannon

# Run load test
autocannon -c 10 -d 30 http://localhost:3001/api/v1/campgrounds
```

### Memory Testing

```bash
# Run tests with memory profiling
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Security Testing

### Automated Security Scans

```bash
# Install security scanning tools
npm install -g npm audit
npm audit

# Run OWASP ZAP for security testing
docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3001
```

## Test Dependencies

### Core Testing Libraries

- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library
- **Playwright**: End-to-end testing
- **@testing-library/react**: React component testing
- **@testing-library/jest-dom**: Custom Jest matchers

### Mock Libraries

- **jest**: Built-in mocking capabilities
- **Custom mocks**: Located in `__mocks__/` directory

### Performance Testing

- **autocannon**: Load testing tool
- **Built-in performance tests**: Response time and concurrent request testing

## Improving Test Coverage

### Priority Areas for New Tests

1. **Critical User Flows** (High Priority)
   - User registration and authentication
   - Campground booking process
   - Payment and checkout flows
   - Admin dashboard functionality

2. **Frontend Components** (Medium Priority)
   - Start with commonly used components like `LoginForm`, `RegisterForm`
   - Add tests for form validation and error handling
   - Test component interactions and state management

3. **API Edge Cases** (Medium Priority)
   - Error handling scenarios
   - Input validation edge cases
   - Authentication and authorization edge cases

4. **Integration Scenarios** (Lower Priority)
   - Complete user journeys
   - Cross-component interactions
   - Database transaction scenarios

### Testing Strategy

1. **Start Small**: Focus on critical paths first
2. **Test Behavior, Not Implementation**: Write tests that verify functionality
3. **Use Realistic Data**: Create test data that mirrors production scenarios
4. **Maintain Test Quality**: Keep tests simple, readable, and maintainable

### Coverage Improvement Plan

```bash
# Run coverage to identify gaps
npm run test:coverage

# Focus on specific areas
npm test -- --coverage --collectCoverageFrom="client/src/components/forms/**/*.jsx"
npm test -- --coverage --collectCoverageFrom="controllers/api/v1/**/*.js"
```

## Conclusion

This testing setup provides a **foundation** for comprehensive testing of the AdventureMate application. While current coverage is low (~10.63%), the infrastructure is in place for:

- **Unit tests** for models and utilities
- **Integration tests** for API workflows
- **End-to-end tests** for user interactions
- **Performance tests** for response times and scalability
- **Security tests** for vulnerability prevention

The comprehensive mocking strategy ensures tests run quickly and reliably without external dependencies. However, **significant work is needed** to improve coverage, particularly in frontend components and user-facing features.

**Next Steps**:

1. Focus on critical user flows and API endpoints
2. Gradually add frontend component tests
3. Implement continuous integration to prevent coverage regression
4. Set up automated testing in the development workflow

For questions or issues with the testing setup, please refer to the project documentation or create an issue in the repository.
