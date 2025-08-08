// Import the centralized configuration
const config = require('./config');

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const methodOverride = require('method-override'); // to use PUT and DELETE requests in forms
// JWT authentication is now used instead of passport sessions
const mongoSanitize = require('express-mongo-sanitize'); // sanitize user input to prevent NoSQL Injection
const helmet = require('helmet'); // to set various HTTP headers for security (security middleware)
const cors = require('cors'); // to allow cross-origin requests
const cookieParser = require('cookie-parser'); // to parse cookies
const compression = require('compression'); // for response compression

const swaggerUi = require('swagger-ui-express'); // for API documentation
const swaggerDocument = require('./docs/swagger.json'); // swagger documentation

// Import logging system
const {
  requestLogger,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logSecurity,
} = require('./utils/logger');

const User = require('./models/user');
const { addBookingCountToUser } = require('./middleware');

const ExpressError = require('./utils/ExpressError'); // import the ExpressError class from the utils folder
const ApiResponse = require('./utils/ApiResponse'); // import the ApiResponse class for standardized API responses
const redisCache = require('./utils/redis'); // import Redis cache utility
const dbMonitor = require('./utils/dbMonitor'); // import database monitoring utility

// Connect to MongoDB and Redis using configuration
// Using async IIFE for better error handling with async/await
(async () => {
  try {
    // Connect to MongoDB with connection pooling
    await mongoose.connect(config.db.url, config.db.options);
    logInfo('Database connected successfully with connection pooling', {
      url: config.db.url,
      maxPoolSize: config.db.options.maxPoolSize,
      minPoolSize: config.db.options.minPoolSize,
    });

    // Start database connection pool monitoring
    if (config.server.isDevelopment) {
      dbMonitor.startMonitoring(60000); // Monitor every minute in development
    }

    // Connect to Redis (optional - app will work without Redis)
    try {
      await redisCache.connect();
      logInfo('Redis cache initialized successfully');
    } catch (redisErr) {
      logWarn('Redis connection failed, continuing without cache', {
        error: redisErr.message,
        host: config.redis.host,
        port: config.redis.port,
      });
    }
  } catch (err) {
    logError('MongoDB Atlas connection error', err, {
      // Sanitize URL to remove credentials
      url: config.db.url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
    });

    // In development, try to connect to local MongoDB if Atlas connection fails
    if (!config.server.isProduction) {
      try {
        const localMongoUrl = 'mongodb://localhost:27017/myan-camp';
        logInfo('Attempting to connect to local MongoDB with connection pooling', {
          // Sanitize URL to remove credentials
          url: localMongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
        });
        await mongoose.connect(localMongoUrl, config.db.options);
        logInfo('Connected to local MongoDB with connection pooling', {
          // Sanitize URL to remove credentials
          url: localMongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
          maxPoolSize: config.db.options.maxPoolSize,
          minPoolSize: config.db.options.minPoolSize,
        });

        // Try Redis connection again
        try {
          await redisCache.connect();
          logInfo('Redis cache initialized successfully');
        } catch (redisErr) {
          logWarn('Redis connection failed, continuing without cache', {
            error: redisErr.message,
          });
        }
      } catch (localErr) {
        logError('Local MongoDB connection also failed', localErr, {
          atlasError: err.message,
          localError: localErr.message,
        });
        logError('Please ensure MongoDB is running locally or check your Atlas connection string');
      }
    } else {
      // In production, exit the application if database connection fails
      logError('Exiting application due to database connection failure');
      process.exit(1);
    }
  }
})();

const app = express(); // create an instance of express app to use its methods

app.use(express.urlencoded({ extended: true })); // to parse the form data
app.use(express.json()); // to parse JSON data
app.use(methodOverride('_method'));

// Apply compression middleware early in the chain
app.use(compression(config.compression));

app.use(express.static(path.join(__dirname, 'public'))); // to serve static files like CSS, JS, images
app.use(mongoSanitize({ replaceWith: '_' })); // sanitize user input to prevent NoSQL Injection

// Configure CORS using centralized config
app.use(cors(config.cors));

app.use(cookieParser()); // to parse cookies

app.use(helmet()); // to set various HTTP headers for security

// Content Security Policy (CSP) to prevent XSS attacks using centralized config
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...config.csp.connectSrc],
      scriptSrc: ["'unsafe-inline'", "'self'", ...config.csp.scriptSrc],
      styleSrc: ["'self'", "'unsafe-inline'", ...config.csp.styleSrc],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", ...config.csp.imgSrc],
      fontSrc: ["'self'", ...config.csp.fontSrc],
      formAction: ["'self'", ...config.csp.formAction],
      reportUri: '/csp-violation-report-endpoint',
      frameSrc: ["'self'"],
      upgradeInsecureRequests: [],
      baseUri: ["'self'"],
    },
  })
);

app.post('/csp-violation-report-endpoint', express.json(), (req, res) => {
  logSecurity('CSP Violation detected', {
    body: req.body,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  res.status(204).end();
});

// JWT authentication is now used instead of passport sessions
app.use(addBookingCountToUser);

// Import API versioning middleware
const { versionRoutes, deprecateEndpoint } = require('./middleware/apiVersioning');
const { authenticateJWT } = require('./middleware/jwtAuth');
const { apiLimiter } = require('./middleware/rateLimiter');

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Apply request logging middleware to all routes
app.use(requestLogger);

// Apply JWT authentication middleware to all API routes
// This middleware doesn't block requests without a JWT token, it just sets req.user if a token is provided
logInfo('Applying JWT authentication middleware to all API routes');
app.use('/api', authenticateJWT);

// Apply versioning middleware to all API routes
app.use('/api', versionRoutes());

// API Routes
const apiV1Routes = require('./routes/api/v1');

// Versioned API Routes
app.use('/api/v1', apiV1Routes); // use the versioned API routes

// API Documentation
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      docExpansion: 'none',
      persistAuthorization: true,
    },
  })
);

// Serve React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public/dist')));

  // For any routes that don't match API or traditional routes, serve the React app
  app.get('/app/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dist/index.html'));
  });
} else {
  // In development mode, handle React app routes
  app.get('/app/*', (req, res) => {
    res.redirect('http://localhost:5173' + req.originalUrl);
  });
}

app.all('*', (req, res, next) => {
  // catch all route
  if (req.originalUrl.startsWith('/api')) {
    return ApiResponse.error(
      'API endpoint not found',
      'The requested API endpoint does not exist',
      404
    ).send(res);
  }
  next(new ExpressError('Page Not Found', 404)); // pass the error to the error handler middleware
});

// Import the error handler middleware
const { errorHandler } = require('./utils/errorHandler');

// Use the centralized error handler middleware
app.use(errorHandler);

// Function to start the server using port from centralized config
const startServer = (port) => {
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port, () => {
        logInfo('Server started successfully', { port });
        resolve(server);
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          logWarn(`Port ${port} is already in use, trying another port`, { port });
          reject(err);
        } else {
          logError('Failed to start server', err, { port });
          reject(err);
        }
      });
  });
};

// Try to start the server on the specified port, or try alternative ports
const tryStartServer = async (initialPort, maxAttempts = 5) => {
  let currentPort = initialPort;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const server = await startServer(currentPort);
      return server;
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        attempts++;
        currentPort++;
      } else {
        logError('Failed to start server', err, { port: currentPort });
        process.exit(1);
      }
    }
  }

  logError(`Could not find an available port after ${maxAttempts} attempts`, null, {
    initialPort,
    maxAttempts,
  });
  process.exit(1);
};

// Export the app for testing
module.exports = app;

// Only start the server if this file is run directly (not when imported for testing)
if (require.main === module) {
  // Start the server with port from config
  tryStartServer(config.server.port);

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    logInfo('SIGTERM received, shutting down gracefully');
    await redisCache.disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logInfo('SIGINT received, shutting down gracefully');
    await redisCache.disconnect();
    process.exit(0);
  });
}
