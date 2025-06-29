// Import the centralized configuration
const config = require("./config");

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override"); // to use PUT and DELETE requests in forms
const session = require("express-session"); // to manage sessions
const MongoStore = require("connect-mongo"); // store the session in the database
const flash = require("connect-flash"); // to show flash messages
const passport = require("passport"); // for authentication (login, logout)
const LocalStrategy = require("passport-local"); // local strategy for authentication
const mongoSanitize = require("express-mongo-sanitize"); // sanitize user input to prevent NoSQL Injection
const helmet = require("helmet"); // to set various HTTP headers for security (security middleware)
const cors = require("cors"); // to allow cross-origin requests
const swaggerUi = require("swagger-ui-express"); // for API documentation
const swaggerDocument = require("./docs/swagger.json"); // swagger documentation

const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");   
const userRoutes = require("./routes/users");
const bookingRoutes = require("./routes/bookings");
const User = require("./models/user");
const adminRoutes = require("./routes/admin");
const { addBookingCountToUser, addConfigToTemplates } = require("./middleware");

const ExpressError = require("./utils/ExpressError"); // import the ExpressError class from the utils folder
const ApiResponse = require("./utils/ApiResponse"); // import the ApiResponse class for standardized API responses

// Connect to MongoDB using configuration
// Using async IIFE for better error handling with async/await
(async () => {
  try {
    await mongoose.connect(config.db.url);
    console.log("Database connected to:", config.db.url);
  } catch (err) {
    console.error("MongoDB Atlas connection error:", err.message);

    // In development, try to connect to local MongoDB if Atlas connection fails
    if (!config.server.isProduction) {
      try {
        const localMongoUrl = "mongodb://localhost:27017/myan-camp";
        console.log("Attempting to connect to local MongoDB...");
        await mongoose.connect(localMongoUrl);
        console.log("Connected to local MongoDB:", localMongoUrl);
      } catch (localErr) {
        console.error("Local MongoDB connection also failed:", localErr.message);
        console.error("Please ensure MongoDB is running locally or check your Atlas connection string");
      }
    } else {
      // In production, exit the application if database connection fails
      console.error("Exiting application due to database connection failure");
      process.exit(1);
    }
  }
})();

const app = express(); // create an instance of express app to use its methods

app.engine("ejs", ejsMate); // set ejs-mate as the engine for ejs files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // set the views directory

app.use(express.urlencoded({ extended: true })); // to parse the form data
app.use(express.json()); // to parse JSON data
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public"))); // to serve static files like CSS, JS, images
app.use(mongoSanitize({ replaceWith: "_" })); // sanitize user input to prevent NoSQL Injection

// Configure CORS using centralized config
app.use(cors(config.cors));

// Store the session in the database using connect-mongo package (MongoStore) with centralized config
const store = new MongoStore({
  mongoUrl: config.db.url,
  touchAfter: config.session.storeOptions.touchAfter,
  crypto: {
    secret: config.session.storeOptions.crypto.secret,
  },
});

store.on("error", function (e) {
  console.log("Session Store Error", e);
});

// Set the session configuration options from centralized config
const sessionConfig = {
  store,
  name: config.session.name,
  secret: config.session.secret,
  resave: config.session.resave,
  saveUninitialized: config.session.saveUninitialized,
  cookie: {
    httpOnly: config.session.cookie.httpOnly,
    // In development, set secure to false to allow cookies over HTTP
    secure: process.env.NODE_ENV === 'production' ? config.session.cookie.secure : false,
    expires: Date.now() + config.session.cookie.expires,
    maxAge: config.session.cookie.maxAge,
    // Add SameSite attribute to allow cookies in cross-site requests
    sameSite: 'lax'
  },
};

app.use(session(sessionConfig));
app.use(flash()); // to show flash messages
app.use(helmet()); // to set various HTTP headers for security

// Content Security Policy (CSP) to prevent XSS attacks using centralized config
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...config.csp.connectSrc],
      scriptSrc: ["'unsafe-inline'", "'self'", ...config.csp.scriptSrc],
      styleSrc: ["'self'", "'unsafe-inline'", ...config.csp.styleSrc],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: ["'self'", ...config.csp.imgSrc],
      fontSrc: ["'self'", ...config.csp.fontSrc],
      formAction: ["'self'", ...config.csp.formAction],
      reportUri: "/csp-violation-report-endpoint",
      frameSrc: ["'self'"],
      upgradeInsecureRequests: [],
      baseUri: ["'self'"],
    },
  })
);

app.post("/csp-violation-report-endpoint", express.json(), (req, res) => {
  console.log("CSP Violation:", req.body);
  res.status(204).end();
});

app.use(passport.initialize()); // initialize passport for authentication
app.use(passport.session()); // use passport to manage sessions

app.use(addBookingCountToUser);
app.use(addConfigToTemplates); // Add configuration to res.locals for use in templates

passport.use(new LocalStrategy(User.authenticate())); // use the local strategy for authentication (login)  (User.authenticate() is a static method provided by passport-local-mongoose)
passport.serializeUser(User.serializeUser()); // serialize the user to store in the session cookie (login)
passport.deserializeUser(User.deserializeUser()); // deserialize the user to store in the session cookie (logout)

// Import session security middleware
const { validateSession, rotateSession } = require('./middleware/sessionSecurity');

// Apply session security middleware
app.use(validateSession);
app.use(rotateSession);

app.use((req, res, next) => {
  res.locals.currentUser = req.user; // make the current user available in all templates
  res.locals.success = req.flash("success"); // make the success flash message available in all templates
  res.locals.error = req.flash("error"); // make the error flash message available in all templates
  next();
});

// Import API versioning middleware
const { versionRoutes, deprecateEndpoint } = require("./middleware/apiVersioning");
const { authenticateJWT } = require("./middleware/jwtAuth");
const { apiLimiter } = require("./middleware/rateLimiter");

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Apply JWT authentication middleware to all API routes
// This middleware doesn't block requests without a JWT token, it just sets req.user if a token is provided
console.log('Applying JWT authentication middleware to all API routes');
app.use('/api', authenticateJWT);

// Apply versioning middleware to all API routes
app.use('/api', versionRoutes());

// API Routes
const apiV1Routes = require("./routes/api/v1");

// Traditional Routes
app.use("/campgrounds/:id/reviews", reviewRoutes); // use the review routes
app.use("/campgrounds", campgroundRoutes); // use the campground routes
// app.use("/bookings", bookingRoutes);
app.use("/admin", adminRoutes);
app.use("/", userRoutes); // use the user routes

// API Routes (Legacy - to be deprecated)
const campgroundApiRoutes = require("./routes/api/campgrounds");
const reviewApiRoutes = require("./routes/api/reviews");
const userApiRoutes = require("./routes/api/users");
const bookingApiRoutes = require("./routes/api/bookings");
const adminApiRoutes = require("./routes/api/admin");
const twoFactorAuthApiRoutes = require("./routes/api/twoFactorAuth");

// Add deprecation notices to legacy API routes
const deprecationOptions = {
  message: 'This endpoint is deprecated and will be removed in a future version',
  version: 'v2',
  alternativeUrl: '/api/v1'
};

app.use("/api/campgrounds/:id/reviews", 
  deprecateEndpoint({ ...deprecationOptions, alternativeUrl: '/api/v1/campgrounds/:id/reviews' }), 
  reviewApiRoutes
);
app.use("/api/campgrounds", 
  deprecateEndpoint({ ...deprecationOptions, alternativeUrl: '/api/v1/campgrounds' }), 
  campgroundApiRoutes
);
app.use("/api/bookings", 
  deprecateEndpoint({ ...deprecationOptions, alternativeUrl: '/api/v1/bookings' }), 
  bookingApiRoutes
);
app.use("/api/admin", 
  deprecateEndpoint({ ...deprecationOptions, alternativeUrl: '/api/v1/admin' }), 
  adminApiRoutes
);
app.use("/api/users", 
  deprecateEndpoint({ ...deprecationOptions, alternativeUrl: '/api/v1/users' }), 
  userApiRoutes
);
app.use("/api/2fa", 
  deprecateEndpoint({ ...deprecationOptions, alternativeUrl: '/api/v1/2fa' }), 
  twoFactorAuthApiRoutes
);

// Versioned API Routes
app.use("/api/v1", apiV1Routes); // use the versioned API routes

// API Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    docExpansion: 'none',
    persistAuthorization: true
  }
}));

app.get("/", (req, res) => {
  res.render("home");
});

// Serve React app
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "public/dist")));

  // For any routes that don't match API or traditional routes, serve the React app
  app.get("/app/*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/dist/index.html"));
  });
} else {
  // In development mode, handle React app routes
  app.get("/app/*", (req, res) => {
    res.redirect("http://localhost:5173" + req.originalUrl);
  });
}

app.all("*", (req, res, next) => {
  // catch all route
  if (req.originalUrl.startsWith('/api')) {
    return ApiResponse.error("API endpoint not found", "The requested API endpoint does not exist", 404).send(res);
  }
  next(new ExpressError("Page Not Found", 404)); // pass the error to the error handler middleware
});

// Import the error handler middleware
const { errorHandler } = require('./utils/errorHandler');

// Use the centralized error handler middleware
app.use(errorHandler);

// Function to start the server using port from centralized config
const startServer = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Serving on Port ${port}...`);
      resolve(server);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use, trying another port...`);
        reject(err);
      } else {
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
        console.error('Failed to start server:', err);
        process.exit(1);
      }
    }
  }

  console.error(`Could not find an available port after ${maxAttempts} attempts.`);
  process.exit(1);
};

// Start the server with port from config
tryStartServer(config.server.port);
