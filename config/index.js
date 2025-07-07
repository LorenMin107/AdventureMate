// Configuration module for AdventureMate application
// This module centralizes all configuration values and provides validation

// Load environment variables from .env file in non-production environments
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Helper function to validate required environment variables
const validateEnv = (envVars) => {
  const missing = [];

  for (const [key, value] of Object.entries(envVars)) {
    if (value === undefined || value === null || value === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Database configuration
const db = {
  url: process.env.DB_URL || 'mongodb://localhost:27017/adventure-mate',
  options: {
    // Removed deprecated options that are no longer needed in MongoDB driver 4.0+
  },
};

// Redis configuration
const redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  // Cache TTL settings (in seconds)
  ttl: {
    campgrounds: 300, // 5 minutes
    users: 600, // 10 minutes
    bookings: 180, // 3 minutes
    reviews: 240, // 4 minutes
    adminStats: 300, // 5 minutes
    searchResults: 120, // 2 minutes
    session: 3600, // 1 hour
  },
};

// Server configuration
const server = {
  port: parseInt(process.env.PORT, 10) || 3001,
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
  logLevel: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL, 10) : 2, // Default to INFO level (2)
  // Client URL for frontend application
  clientUrl:
    process.env.CLIENT_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://adventuremate.com' : 'http://localhost:5173'),
};

// Session configuration
const session = {
  secret: process.env.SESSION_SECRET || 'thisisnotagoodsecret',
  name: 'session',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: 1000 * 60 * 60 * 24 * 7, // 1 week in milliseconds
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
  storeOptions: {
    touchAfter: 24 * 60 * 60, // 24 hours in seconds
    crypto: {
      secret: process.env.SESSION_STORE_SECRET || 'thisisnotagoodsecret',
    },
  },
};

// Cloudinary configuration
const cloudinary = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_KEY,
  apiSecret: process.env.CLOUDINARY_SECRET,
  folder: process.env.CLOUDINARY_FOLDER || 'AdventureMate',
  allowedFormats: (process.env.CLOUDINARY_ALLOWED_FORMATS || 'jpeg,png,jpg').split(','),
};

// Mapbox configuration
const mapbox = {
  token: process.env.MAPBOX_TOKEN,
};

// Stripe configuration
const stripe = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  publicKey: process.env.STRIPE_PUBLIC_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

// CORS configuration
const cors = {
  origin: server.isProduction
    ? ['https://adventuremate.com', 'https://www.adventuremate.com']
    : ['http://localhost:5173'],
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Content Security Policy configuration
const csp = {
  scriptSrc: [
    'https://stackpath.bootstrapcdn.com/',
    'https://api.tiles.mapbox.com/',
    'https://api.mapbox.com/',
    'https://kit.fontawesome.com/',
    'https://cdnjs.cloudflare.com/',
    'https://cdn.jsdelivr.net',
    'https://js.stripe.com/',
    'https://static.elfsight.com/',
  ],
  styleSrc: [
    'https://kit-free.fontawesome.com/',
    'https://stackpath.bootstrapcdn.com/',
    'https://api.mapbox.com/',
    'https://api.tiles.mapbox.com/',
    'https://fonts.googleapis.com/',
    'https://use.fontawesome.com/',
    'https://cdn.jsdelivr.net',
    'https://cdnjs.cloudflare.com',
  ],
  connectSrc: [
    'https://api.mapbox.com/',
    'https://a.tiles.mapbox.com/',
    'https://b.tiles.mapbox.com/',
    'https://events.mapbox.com/',
    'https://api.stripe.com/',
    'https://core.service.elfsight.com/',
    'https://static.elfsight.com/',
  ],
  fontSrc: ['https://fonts.gstatic.com/', 'https://cdnjs.cloudflare.com/'],
  imgSrc: [
    "'self'",
    'blob:',
    'data:',
    'https://res.cloudinary.com/dlvtzyb7j/',
    'https://images.unsplash.com/',
    'https://via.placeholder.com/',
    'https://static.elfsight.com/',
  ],
  formAction: ["'self'", 'http://localhost:3000', 'https://checkout.stripe.com'],
};

// JWT configuration
const jwt = {
  accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET || 'access_token_secret_dev_only',
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_token_secret_dev_only',
  accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m', // 15 minutes
  refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d', // 7 days
};

// Email configuration
const email = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  from: process.env.EMAIL_FROM || '"AdventureMate" <noreply@adventuremate.com>',
};

// Compression configuration
const compression = {
  // Enable compression for responses larger than 1KB
  threshold: 1024,
  // Compression level (0-9, higher = better compression but slower)
  level: 6,
  // Enable compression for all content types
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use default compression filter
    return require('compression').filter(req, res);
  },
  // Enable compression for specific content types
  contentType: [
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'application/xml',
    'application/xml+rss',
    'text/xml',
    'image/svg+xml',
  ],
};

// Validate required environment variables in production
if (server.isProduction) {
  validateEnv({
    DB_URL: db.url,
    SESSION_SECRET: session.secret,
    CLOUDINARY_CLOUD_NAME: cloudinary.cloudName,
    CLOUDINARY_KEY: cloudinary.apiKey,
    CLOUDINARY_SECRET: cloudinary.apiSecret,
    MAPBOX_TOKEN: mapbox.token,
    STRIPE_SECRET_KEY: stripe.secretKey,
    JWT_ACCESS_TOKEN_SECRET: jwt.accessTokenSecret,
    JWT_REFRESH_TOKEN_SECRET: jwt.refreshTokenSecret,
  });
}

// Export the configuration
module.exports = {
  db,
  redis,
  server,
  session,
  cloudinary,
  mapbox,
  stripe,
  cors,
  csp,
  jwt,
  email,
  compression,
};
