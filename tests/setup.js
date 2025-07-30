// Test setup file

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for tests
jest.setTimeout(30000);

// Polyfill TextEncoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill setImmediate for Node.js environment
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => {
    return setTimeout(() => callback(...args), 0);
  };
}

// Polyfill fetch for Node.js environment
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
    text: async () => '',
  });
}

// Mock import.meta for Vite environment variables
global.import = {
  meta: {
    env: {
      VITE_MAPBOX_TOKEN: 'test-mapbox-token',
      VITE_GOOGLE_CLIENT_ID: 'test-google-client-id',
      VITE_CLOUDINARY_CLOUD_NAME: 'test-cloudinary',
      VITE_CLOUDINARY_UPLOAD_PRESET: 'test-preset',
      VITE_STRIPE_PUBLISHABLE_KEY: 'test-stripe-key',
      VITE_API_BASE_URL: 'http://localhost:3001',
    },
  },
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock external services
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'test-public-id',
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
}));

jest.mock('mapbox-gl', () => ({
  accessToken: 'test-token',
}));

// Mock Redis
jest.mock('ioredis', () => {
  const Redis = jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    flushall: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
  }));
  return Redis;
});

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-jwt-token'),
  verify: jest.fn().mockReturnValue({
    sub: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    isAdmin: false,
    isOwner: false,
    type: 'access',
  }),
  decode: jest.fn().mockReturnValue({
    sub: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    isAdmin: false,
    isOwner: false,
    type: 'access',
  }),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$test.hash.value'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('$2b$10$testsalt'),
}));

// Mock speakeasy for 2FA
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({
    base32: 'test-secret-base32',
    otpauth_url: 'otpauth://totp/test',
  }),
  totp: jest.fn().mockReturnValue('123456'),
  verify: jest.fn().mockReturnValue(true),
}));

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,test-qr-code'),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, // Return the key as the translation
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  Trans: ({ children }) => children,
}));

// Mock mongoose to avoid ES module issues and fix schema methods
jest.mock('mongoose', () => {
  const ObjectId = jest.fn().mockImplementation((id) => ({
    toString: () => id || '507f1f77bcf86cd799439011',
    toHexString: () => id || '507f1f77bcf86cd799439011',
  }));
  const Types = { ObjectId };

  function Schema() {
    this.methods = {};
    this.statics = {};
  }
  Schema.Types = Types;
  Schema.prototype.pre = jest.fn().mockReturnThis();
  Schema.prototype.post = jest.fn().mockReturnThis();
  Schema.prototype.index = jest.fn().mockReturnThis();
  Schema.prototype.virtual = jest.fn().mockReturnThis();
  Schema.prototype.set = jest.fn().mockReturnThis();
  Schema.prototype.get = jest.fn().mockReturnThis();

  // Create mock model constructor
  function MockModel(data = {}) {
    this._id = data._id || 'test-id';
    this.email = data.email;
    this.username = data.username;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.isEmailVerified = data.isEmailVerified || false;
    this.isAdmin = data.isAdmin || false;
    this.isOwner = data.isOwner || false;
    this.title = data.title;
    this.description = data.description;
    this.location = data.location;
    this.price = data.price;
    this.images = data.images || [];
    this.geometry = data.geometry;
    this.user = data.user;
    this.campground = data.campground;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.totalDays = data.totalDays;
    this.totalPrice = data.totalPrice;
    this.guests = data.guests;
    this.status = data.status;
    this.paid = data.paid;
    this.body = data.body;
    this.rating = data.rating;
    this.author = data.author;
    this.token = data.token;
    this.expiresAt = data.expiresAt;
    this.isRevoked = data.isRevoked || false;
    this.revokedAt = data.revokedAt;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;

    // Mock save method
    this.save = jest.fn().mockResolvedValue(this);

    // Mock schema methods
    this.isExpired = jest.fn().mockReturnValue(false);
    this.isValid = jest.fn().mockReturnValue(true);
    this.revoke = jest.fn().mockResolvedValue(this);
  }

  // Add static methods to MockModel
  MockModel.create = jest.fn().mockImplementation((data) => {
    return Promise.resolve(new MockModel(data));
  });

  MockModel.find = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue([]),
    populate: jest.fn().mockReturnThis(),
  });

  MockModel.findById = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
    populate: jest.fn().mockReturnThis(),
  });

  MockModel.findOne = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
  });

  MockModel.deleteMany = jest.fn().mockResolvedValue({});
  MockModel.findByIdAndDelete = jest.fn().mockResolvedValue({});

  // Mock static methods
  MockModel.findValidToken = jest.fn().mockResolvedValue(null);
  MockModel.revokeAllUserTokens = jest.fn().mockResolvedValue({});

  // Add BlacklistedToken specific static methods
  MockModel.isBlacklisted = jest.fn().mockResolvedValue(false);
  MockModel.addToBlacklist = jest.fn().mockResolvedValue({});
  MockModel.countDocuments = jest.fn().mockResolvedValue(0);

  // Add distinct method for campground queries
  MockModel.distinct = jest.fn().mockResolvedValue([]);

  return {
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      close: jest.fn().mockResolvedValue({}),
      collections: {},
    },
    Schema,
    model: jest.fn().mockReturnValue(MockModel),
    Types,
  };
});

// Global test utilities
global.testUtils = {
  createTestUser: async (userData = {}) => {
    const defaultData = {
      _id: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
      password: '$2b$10$test.hash.value',
      isEmailVerified: true,
      ...userData,
    };
    return defaultData;
  },

  createTestCampground: async (campgroundData = {}, user = null) => {
    if (!user) {
      user = await global.testUtils.createTestUser();
    }
    const defaultData = {
      _id: 'test-campground-id',
      title: 'Test Campground',
      description: 'A test campground',
      location: 'Test Location',
      price: 100,
      owner: user._id,
      ...campgroundData,
    };
    return defaultData;
  },

  createTestBooking: async (bookingData = {}, user = null, campground = null) => {
    if (!user) {
      user = await global.testUtils.createTestUser();
    }
    if (!campground) {
      campground = await global.testUtils.createTestCampground({}, user);
    }
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 86400000);
    const defaultData = {
      _id: 'test-booking-id',
      user: user._id,
      campground: campground._id,
      startDate: startDate,
      endDate: endDate,
      totalDays: 1,
      totalPrice: 100,
      guests: 2,
      status: 'pending',
      paid: false,
      ...bookingData,
    };
    return defaultData;
  },

  createTestReview: async (reviewData = {}, user = null, campground = null) => {
    if (!user) {
      user = await global.testUtils.createTestUser();
    }
    if (!campground) {
      campground = await global.testUtils.createTestCampground({}, user);
    }
    const defaultData = {
      _id: 'test-review-id',
      body: 'Great campground! Had a wonderful time.',
      rating: 5,
      author: user._id,
      campground: campground._id,
      ...reviewData,
    };
    return defaultData;
  },

  getAuthToken: async (user = null) => {
    if (!user) {
      user = await global.testUtils.createTestUser();
    }
    return 'test-jwt-token';
  },

  clearDatabase: async () => {
    // Mock database clearing
    return Promise.resolve();
  },
};

console.log('Test setup complete');
