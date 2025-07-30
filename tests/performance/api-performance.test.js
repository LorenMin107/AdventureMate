const request = require('supertest');
const app = require('../../app');

describe('API Performance Tests', () => {
  const baseURL = 'http://localhost:3000';

  describe('Campgrounds API Performance', () => {
    test('GET /api/v1/campgrounds should respond within 500ms', async () => {
      const startTime = Date.now();

      const response = await request(app).get('/api/v1/campgrounds').expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('campgrounds');
    });

    test('GET /api/v1/campgrounds/:id should respond within 300ms', async () => {
      // Use a hardcoded campground ID for performance testing
      const campgroundId = '6868035dc3a14a20320e6a06';

      const startTime = Date.now();

      const response = await request(app).get(`/api/v1/campgrounds/${campgroundId}`).expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(300);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('campground');
    });

    test('Campgrounds search should respond within 800ms', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/campgrounds?search=test&limit=10')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(800);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Bookings API Performance', () => {
    test('GET /api/v1/bookings should respond within 400ms', async () => {
      const startTime = Date.now();

      const response = await request(app).get('/api/v1/bookings').expect(401); // Should require authentication

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(400);
    });
  });

  describe('Authentication API Performance', () => {
    test('POST /api/v1/auth/login should respond within 300ms', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(401); // Should fail with invalid credentials

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(300);
    });

    test('POST /api/v1/auth/register should respond within 500ms', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'performance-test@example.com',
          username: 'performancetest',
          password: 'password123',
        })
        .expect(400); // Should fail with duplicate user

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('Concurrent Request Performance', () => {
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

    test('Should handle 10 concurrent authentication requests', async () => {
      const startTime = Date.now();

      const requests = Array(10)
        .fill()
        .map(() =>
          request(app).post('/api/v1/auth/login').send({
            email: 'test@example.com',
            password: 'password123',
          })
        );

      const responses = await Promise.all(requests);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should fail with 401 (invalid credentials)
      responses.forEach((response) => {
        expect(response.status).toBe(401);
      });

      // Total time should be reasonable for concurrent auth requests
      expect(totalTime).toBeLessThan(3000);
    });
  });

  describe('Database Query Performance', () => {
    test('Campgrounds with populated data should load within 600ms', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/campgrounds?populate=owner,reviews')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(600);
      expect(response.body).toHaveProperty('data');
    });

    test('Campground details with all relations should load within 500ms', async () => {
      // Use a hardcoded campground ID for performance testing
      const campgroundId = '6868035dc3a14a20320e6a06';

      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/v1/campgrounds/${campgroundId}?populate=owner,reviews,campsites`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Memory Usage Performance', () => {
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
  });

  describe('Response Size Performance', () => {
    test('Campground list response should be under 100KB', async () => {
      const response = await request(app).get('/api/v1/campgrounds').expect(200);

      const responseSize = JSON.stringify(response.body).length;

      expect(responseSize).toBeLessThan(100 * 1024); // 100KB
    });

    test('Campground details response should be under 50KB', async () => {
      // Use a hardcoded campground ID for performance testing
      const campgroundId = '6868035dc3a14a20320e6a06';

      const response = await request(app).get(`/api/v1/campgrounds/${campgroundId}`).expect(200);

      const responseSize = JSON.stringify(response.body).length;

      expect(responseSize).toBeLessThan(50 * 1024); // 50KB
    });
  });
});
