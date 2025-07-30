const mongoose = require('mongoose');

describe('Basic Test Infrastructure', () => {
  test('should have proper test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should have mongoose mocked', () => {
    expect(mongoose.connect).toBeDefined();
    expect(mongoose.model).toBeDefined();
    expect(mongoose.Schema).toBeDefined();
  });

  test('should be able to create mock models', () => {
    const User = mongoose.model('User');
    const Campground = mongoose.model('Campground');
    const Booking = mongoose.model('Booking');
    const Review = mongoose.model('Review');

    expect(User).toBeDefined();
    expect(Campground).toBeDefined();
    expect(Booking).toBeDefined();
    expect(Review).toBeDefined();
  });

  test('should be able to create and save mock data', async () => {
    const User = mongoose.model('User');
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.username).toBe(userData.username);
  });

  test('should have test utilities available', () => {
    expect(global.testUtils).toBeDefined();
    expect(global.testUtils.createTestUser).toBeDefined();
    expect(global.testUtils.createTestCampground).toBeDefined();
    expect(global.testUtils.createTestBooking).toBeDefined();
    expect(global.testUtils.createTestReview).toBeDefined();
  });

  test('should be able to use test utilities', async () => {
    const testUser = await global.testUtils.createTestUser();
    const testCampground = await global.testUtils.createTestCampground({}, testUser);

    expect(testUser._id).toBeDefined();
    expect(testUser.email).toBe('test@example.com');
    expect(testCampground._id).toBeDefined();
    expect(testCampground.title).toBe('Test Campground');
  });
});
