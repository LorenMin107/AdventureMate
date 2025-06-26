if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

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

const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");   
const userRoutes = require("./routes/users");
const bookingRoutes = require("./routes/bookings");
const User = require("./models/user");
const adminRoutes = require("./routes/admin");
const { addBookingCountToUser } = require("./middleware");

const ExpressError = require("./utils/ExpressError"); // import the ExpressError class from the utils folder
const dbUrl = "mongodb://localhost:27017/myan-camp"; // set the database URL
mongoose.connect(dbUrl);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected!");
});

const app = express(); // create an instance of express app to use its methods

app.engine("ejs", ejsMate); // set ejs-mate as the engine for ejs files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // set the views directory

app.use(express.urlencoded({ extended: true })); // to parse the form data
app.use(express.json()); // to parse JSON data
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public"))); // to serve static files like CSS, JS, images
app.use(mongoSanitize({ replaceWith: "_" })); // sanitize user input to prevent NoSQL Injection

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? ["https://myancamp.com", "https://www.myancamp.com"] 
    : ["http://localhost:5173"],
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));

// store the session in the database using connect-mongo package (MongoStore) and set the session configuration options
const store = new MongoStore({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: "thisisnotagoodsecret",
  },
});

store.on("error", function (e) {
  console.log("Session Store Error", e);
});

// set the session configuration options
const sessionConfig = {
  store,
  name: "session",
  secret: "thisisnotagoodsecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true, // to prevent XSS attacks
    // secure: true, // to use secure cookies (HTTPS)
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash()); // to show flash messages
app.use(helmet()); // to set various HTTP headers for security

// Content Security Policy (CSP) to prevent XSS attacks by allowing only trusted sources for scripts, styles, etc.
const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
  "https://js.stripe.com/",
  "https://static.elfsight.com/",
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
];
const connectSrcUrls = [
  "https://api.mapbox.com/",
  "https://a.tiles.mapbox.com/",
  "https://b.tiles.mapbox.com/",
  "https://events.mapbox.com/",
  "https://api.stripe.com/",
  "https://core.service.elfsight.com/",
  "https://static.elfsight.com/",
];
const fontSrcUrls = ["https://fonts.gstatic.com/", "https://cdnjs.cloudflare.com/"];
const imgSrcUrls = [
  "'self'",
  "blob:",
  "data:",
  "https://res.cloudinary.com/dlvtzyb7j/",
  "https://images.unsplash.com/",
  "https://via.placeholder.com/",
  "https://static.elfsight.com/",
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls, "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: ["'self'", ...imgSrcUrls],
      fontSrc: ["'self'", ...fontSrcUrls],
      formAction: ["'self'", "http://localhost:3000", "https://checkout.stripe.com"], // Allow form submissions to your own domain with any port
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

passport.use(new LocalStrategy(User.authenticate())); // use the local strategy for authentication (login)  (User.authenticate() is a static method provided by passport-local-mongoose)
passport.serializeUser(User.serializeUser()); // serialize the user to store in the session cookie (login)
passport.deserializeUser(User.deserializeUser()); // deserialize the user to store in the session cookie (logout)

app.use((req, res, next) => {
  res.locals.currentUser = req.user; // make the current user available in all templates
  res.locals.success = req.flash("success"); // make the success flash message available in all templates
  res.locals.error = req.flash("error"); // make the error flash message available in all templates
  next();
});

// API Routes
const campgroundApiRoutes = require("./routes/api/campgrounds");
const reviewApiRoutes = require("./routes/api/reviews");
const userApiRoutes = require("./routes/api/users");
const bookingApiRoutes = require("./routes/api/bookings");
const adminApiRoutes = require("./routes/api/admin");

// Traditional Routes
app.use("/campgrounds/:id/reviews", reviewRoutes); // use the review routes
app.use("/campgrounds", campgroundRoutes); // use the campground routes
// app.use("/bookings", bookingRoutes);
app.use("/admin", adminRoutes);
app.use("/", userRoutes); // use the user routes

// API Routes
app.use("/api/campgrounds/:id/reviews", reviewApiRoutes); // use the review API routes
app.use("/api/campgrounds", campgroundApiRoutes); // use the campground API routes
app.use("/api/bookings", bookingApiRoutes); // use the booking API routes
app.use("/api/admin", adminApiRoutes); // use the admin API routes
app.use("/api/users", userApiRoutes); // use the user API routes

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
    return res.status(404).json({ error: "API endpoint not found" });
  }
  next(new ExpressError("Page Not Found", 404)); // pass the error to the error handler middleware
});

app.use((err, req, res, next) => {
  // error handler middleware
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";

  // Check if the request is an API request
  if (req.originalUrl.startsWith('/api')) {
    // Return JSON error response for API requests
    return res.status(statusCode).json({
      error: err.message,
      status: statusCode
    });
  }

  // Render error template for traditional requests
  res.status(statusCode).render("error", { err }); // render the error template with the error message
});

app.listen(3001, () => {
  console.log("Serving on Port 3001...");
});
