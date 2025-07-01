# MyanCamp

MyanCamp is a comprehensive web application for discovering, booking, and reviewing campgrounds in Myanmar. This full-stack project uses Node.js and Express for the backend, MongoDB for the database, and React for the frontend. The application is in the process of migrating from server-rendered EJS templates to a modern React-based architecture.

## Features

### User Features
- **User Authentication**
  - Email/password registration and login
  - Email verification
  - Two-factor authentication (2FA)
  - JWT-based authentication
  - Password reset functionality
- **Campground Discovery**
  - Browse campgrounds with filtering and search
  - View campground details, photos, and location on map
  - See availability and pricing
- **Booking System**
  - Reserve campsites with date selection
  - Secure payment processing with Stripe
  - Booking management (view, cancel)
- **Review System**
  - Leave ratings and reviews for campgrounds
  - View other users' reviews
- **User Profiles**
  - View and update profile information
  - See booking history
  - Manage reviews

### Admin Features
- **Admin Dashboard**
  - Overview of key metrics (users, bookings, revenue)
  - Recent activity monitoring
- **Campground Management**
  - Create, update, and delete campgrounds
  - Manage campsite availability and pricing
- **User Management**
  - View and manage user accounts
  - Handle user permissions
- **Booking Management**
  - View all bookings
  - Process booking changes and cancellations
- **Review Moderation**
  - Approve or remove reviews

### Technical Features
- **Map Integration** with Mapbox for location visualization
- **Responsive Design** for mobile and desktop
- **Security** with Helmet, Mongo Sanitize, CSRF protection, and Content Security Policy
- **RESTful API** with versioning for frontend integration
- **Rate Limiting** to prevent abuse
- **Image Upload** with Cloudinary integration

## How to Run This Code

### Prerequisites
1. Node.js (v20.x or later recommended)
2. MongoDB (local installation or MongoDB Atlas account)
3. npm (usually comes with Node.js)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd path/to/MyanCamp
   ```

3. Install dependencies:
   ```
   npm install
   ```

### Environment Setup
1. Create a `.env` file in the root directory with the following variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_KEY=your_cloudinary_key
   CLOUDINARY_SECRET=your_cloudinary_secret
   MAPBOX_TOKEN=your_mapbox_token
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

   Optionally, if you want to use MongoDB Atlas instead of a local MongoDB:
   ```
   DB_URL=your_mongodb_atlas_connection_string
   ```

### Database Setup
1. Make sure MongoDB is running on your local machine:
   - For Windows: Start the MongoDB service
   - For macOS: Run `brew services start mongodb-community`
   - For Linux: Run `sudo systemctl start mongod`

   Alternatively, use MongoDB Atlas by setting the DB_URL in your .env file.

2. Seed the database with campground data:
   ```
   node seeds/index.js
   ```

3. Create an admin user:
   ```
   node seedDB.js
   ```
   This creates an admin user with:
   - Username: "admin"
   - Password: "asdf!"

### Running the Application

#### Recommended: Run Both Backend and Frontend
1. Start both the backend and frontend servers with a single command:
   ```
   npm run dev
   ```

   This will start both the backend server on port 3001 and the frontend server on port 5173.

#### Backend Only (Express API)
1. Start the backend server:
   ```
   npm run start
   ```

   For development with auto-restart on file changes:
   ```
   npm run dev:server
   ```

2. Access the API at:
   ```
   http://localhost:3001
   ```

#### Frontend Only (React)
1. Start the Vite development server:
   ```
   npm run dev:client
   ```

   > **Important**: The backend server must be running for the frontend to work properly. If you see connection errors, make sure you've started the backend server with `npm run dev:server` in a separate terminal.

2. Access the React application in your browser:
   ```
   http://localhost:5173
   ```

#### Building for Production
1. Build the React application:
   ```
   npm run build
   ```

2. Preview the built application:
   ```
   npm run preview
   ```

#### Code Quality and Testing
1. Run ESLint:
   ```
   npm run lint
   ```

2. Format code with Prettier:
   ```
   npm run format
   ```

3. Run tests:
   ```
   npm test
   ```

### Login Information
- Regular user: Create a new account through the registration page
- Admin user: 
  - Username: admin
  - Password: asdf!

### Usage
Register or log in to manage campgrounds, make bookings, and leave reviews.

## Technology Stack

### Backend
- **Node.js** (v20.x) - JavaScript runtime
- **Express.js** (v4.21.x) - Web framework
- **MongoDB** (v8.16.x) - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Passport.js** - Authentication middleware
  - Local strategy for username/password
  - JWT for API authentication
- **Express Session** - Session management
- **Connect Mongo** - MongoDB session store
- **Nodemailer** - Email sending
- **Multer & Cloudinary** - File uploads and storage
- **Stripe** - Payment processing
- **Speakeasy & QRCode** - Two-factor authentication
- **Helmet** - Security headers
- **Express Rate Limit** - API rate limiting
- **Express Mongo Sanitize** - Prevent NoSQL injection
- **Joi & Express Validator** - Data validation
- **Morgan** - HTTP request logging
- **Swagger UI Express** - API documentation

### Frontend
- **React** (v18.2.x) - UI library
- **React Router** (v6.22.x) - Client-side routing
- **React Query** (v5.28.x) - Data fetching and caching
- **React Hook Form** (v7.51.x) - Form handling
- **Yup** - Form validation
- **Axios** - HTTP client
- **Mapbox GL & React Map GL** - Maps and geolocation
- **React Datepicker** - Date selection

### Development & Testing
- **Vite** - Build tool and development server
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **React Testing Library** - Component testing

## Project Structure

### Backend Structure
- **app.js**: Main Express application file
- **models/**: Mongoose models
  - **user.js**: User account model with authentication
  - **campground.js**: Campground information model
  - **campsite.js**: Individual campsite model
  - **booking.js**: Booking and reservation model
  - **review.js**: User reviews model
  - **contact.js**: Contact form submissions
  - **emailVerificationToken.js**: Email verification
  - **refreshToken.js**: JWT refresh tokens
- **controllers/**: Business logic
  - **api/**: API controllers (JSON responses)
    - **admin.js**: Admin dashboard functionality
    - **auth.js**: Authentication endpoints
    - **bookings.js**: Booking management
    - **campgrounds.js**: Campground operations
    - **campsites.js**: Campsite operations
    - **reviews.js**: Review management
    - **twoFactorAuth.js**: 2FA functionality
    - **users.js**: User profile management
- **routes/**: Route definitions
  - **api/**: API routes
    - **admin.js**: Admin routes
    - **bookings.js**: Booking routes
    - **campgrounds.js**: Campground routes
    - **reviews.js**: Review routes
    - **twoFactorAuth.js**: 2FA routes
    - **users.js**: User routes
    - **v1/**: Versioned API routes
- **middleware/**: Custom middleware
  - **accountSecurity.js**: Login attempt limiting
  - **apiVersioning.js**: API version handling
  - **jwtAuth.js**: JWT authentication
  - **rateLimiter.js**: Rate limiting
  - **sessionSecurity.js**: Session protection
  - **validators.js**: Request validation
- **utils/**: Helper functions
- **views/**: EJS templates (legacy)
- **public/**: Static files

### Frontend Structure
- **client/**: React application
  - **src/**: Source code
    - **components/**: Reusable UI components
      - **admin/**: Admin-specific components
      - **auth/**: Authentication components
      - **booking/**: Booking-related components
      - **campground/**: Campground display components
      - **common/**: Shared UI elements
      - **map/**: Map-related components
      - **review/**: Review components
      - **user/**: User profile components
    - **context/**: React context providers
      - **AuthContext.jsx**: Authentication state
      - **UserContext.jsx**: User profile data
      - **FlashMessageContext.jsx**: Notifications
      - **ThemeContext.jsx**: Theme preferences
    - **hooks/**: Custom React hooks
    - **layouts/**: Page layouts
    - **pages/**: Page components
    - **navigation/**: Navigation components
    - **routes/**: Route definitions
    - **utils/**: Utility functions
    - **assets/**: Static assets
    - **__tests__/**: Test files

### Key Files

#### Models
- **models/user.js**: User schema and authentication setup.
- **models/campground.js**: Campground schema with virtuals and post hooks.
- **models/review.js**: Review schema.
- **models/booking.js**: Booking schema.

#### Controllers
- **controllers/campgrounds.js**: Handlers for campground routes.
- **controllers/reviews.js**: Handlers for review routes.
- **controllers/bookings.js**: Handlers for booking routes.

#### Routes
- **routes/campgrounds.js**: Routes for campground operations.
- **routes/reviews.js**: Routes for review operations.
- **routes/bookings.js**: Routes for booking operations.
- **routes/users.js**: Routes for user authentication and profile.

#### Views
- **views/layouts/boilerplate.ejs**: Main layout template.
- **views/campgrounds/**: Templates for campground operations.
- **views/reviews/**: Templates for review operations.
- **views/bookings/**: Templates for booking operations.
- **views/users/**: Templates for user authentication.

#### Public
- **public/stylesheets/**: CSS files.
- **public/javascripts/**: Client-side JavaScript files.

### Security
- **Helmet** for setting various HTTP headers.
- **Mongo Sanitize** to prevent NoSQL injection.
- **Local Passport** for hashing users' password with hash and salt.
- **CORS** for secure cross-origin requests.

### API Documentation

The application provides a RESTful API for the React frontend. All API endpoints are prefixed with `/api`.

#### Authentication Endpoints

- **POST /api/users/register**: Register a new user
- **POST /api/users/login**: Login a user
- **POST /api/users/logout**: Logout a user
- **GET /api/users/status**: Check authentication status
- **GET /api/users/profile**: Get current user profile

#### Campground Endpoints

- **GET /api/campgrounds**: Get all campgrounds
- **POST /api/campgrounds**: Create a new campground (admin only)
- **GET /api/campgrounds/search**: Search campgrounds
- **GET /api/campgrounds/:id**: Get a specific campground
- **PUT /api/campgrounds/:id**: Update a campground (author or admin only)
- **DELETE /api/campgrounds/:id**: Delete a campground (author or admin only)

#### Review Endpoints

- **GET /api/campgrounds/:id/reviews**: Get all reviews for a campground
- **POST /api/campgrounds/:id/reviews**: Create a new review
- **DELETE /api/campgrounds/:id/reviews/:reviewId**: Delete a review (author or admin only)

#### Booking Endpoints

- **GET /api/bookings**: Get all bookings for the current user
- **GET /api/bookings/:id**: Get a specific booking
- **POST /api/bookings/:id/book**: Create a booking (initial step)
- **POST /api/bookings/:id/checkout**: Create a checkout session for payment
- **GET /api/bookings/:id/success**: Handle successful payment

#### Admin Endpoints

- **GET /api/admin/dashboard**: Get dashboard statistics
- **GET /api/admin/bookings**: Get all bookings (paginated)
- **DELETE /api/admin/bookings/:id**: Cancel a booking
- **GET /api/admin/users**: Get all users (paginated)
- **GET /api/admin/users/:id**: Get user details

All API endpoints return JSON responses and use appropriate HTTP status codes. Authentication is required for most endpoints, and some endpoints require admin privileges.

## Authentication and Security

### Authentication Flow
1. **Registration**:
   - User registers with email, username, and password
   - Verification email is sent to the user's email address
   - User verifies email by clicking the link in the email

2. **Login**:
   - User logs in with username/email and password
   - If 2FA is enabled, user is prompted for verification code
   - On successful authentication, JWT tokens are issued (access and refresh)

3. **Two-Factor Authentication (2FA)**:
   - Users can enable 2FA from their profile settings
   - Setup involves scanning a QR code with an authenticator app
   - Backup codes are provided for emergency access
   - 2FA verification is required on login if enabled

### Security Measures
- **Password Security**:
  - Passwords are hashed using bcrypt via Passport-Local-Mongoose
  - Password strength requirements enforced
  - Account lockout after multiple failed attempts

- **JWT Security**:
  - Short-lived access tokens (15 minutes)
  - Refresh tokens with rotation
  - Secure, HTTP-only cookies

- **API Security**:
  - Rate limiting to prevent brute force attacks
  - Input validation and sanitization
  - MongoDB query sanitization
  - CORS configuration for API access control

- **HTTP Security Headers**:
  - Content Security Policy (CSP)
  - XSS Protection
  - Frame options
  - HSTS

## Deployment

### Prerequisites
- Node.js environment (v20.x or later)
- MongoDB database (Atlas recommended for production)
- Cloudinary account for image storage
- Mapbox account for maps
- Stripe account for payments
- SMTP service for emails

### Deployment Options

#### Heroku Deployment
1. Create a Heroku account and install the Heroku CLI
2. Create a new Heroku app:
   ```
   heroku create myancamp-app
   ```
3. Add MongoDB Atlas as an add-on or set up your database connection:
   ```
   heroku config:set DB_URL=your_mongodb_connection_string
   ```
4. Set up environment variables:
   ```
   heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
   heroku config:set CLOUDINARY_KEY=your_key
   heroku config:set CLOUDINARY_SECRET=your_secret
   heroku config:set MAPBOX_TOKEN=your_mapbox_token
   heroku config:set STRIPE_SECRET_KEY=your_stripe_key
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set SMTP_HOST=your_smtp_host
   heroku config:set SMTP_PORT=your_smtp_port
   heroku config:set SMTP_USER=your_smtp_user
   heroku config:set SMTP_PASS=your_smtp_password
   ```
5. Deploy your application:
   ```
   git push heroku main
   ```

#### Docker Deployment
1. Build the Docker image:
   ```
   docker build -t myancamp .
   ```
2. Run the container:
   ```
   docker run -p 3001:3001 --env-file .env myancamp
   ```

#### Manual VPS Deployment
1. Set up a VPS with Node.js installed
2. Clone the repository:
   ```
   git clone <repository-url>
   cd MyanCamp
   ```
3. Install dependencies:
   ```
   npm install --production
   ```
4. Build the frontend:
   ```
   npm run build
   ```
5. Set up environment variables
6. Start the application:
   ```
   npm start
   ```
7. Set up a reverse proxy (Nginx or Apache) and SSL

## Troubleshooting

### Common Issues

#### Connection Issues
- **MongoDB Connection Errors**: Verify your MongoDB connection string and ensure the database server is running.
- **API Connection Errors**: Check that the backend server is running and accessible from the frontend.

#### Authentication Issues
- **Login Failures**: Ensure your username and password are correct. Check if your account is locked due to too many failed attempts.
- **2FA Problems**: Verify that your authenticator app's time is synchronized. Try using a backup code if available.

#### Payment Issues
- **Stripe Payment Failures**: Check the Stripe dashboard for error details. Ensure your Stripe keys are correctly configured.

#### Image Upload Issues
- **Cloudinary Upload Errors**: Verify your Cloudinary credentials and check file size limits.

### Debugging

- **Backend Logs**: Check the server logs for error messages:
  ```
  npm run dev:server
  ```

- **Frontend Development**: Run the frontend in development mode for detailed error messages:
  ```
  npm run dev:client
  ```

- **Database Inspection**: Use MongoDB Compass to inspect your database collections.

## Contributing

We welcome contributions to MyanCamp! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a feature branch:
   ```
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Run tests:
   ```
   npm test
   ```
5. Submit a pull request

### Coding Standards
- Follow the ESLint configuration
- Format code with Prettier
- Write tests for new features
- Follow the existing code structure

### Pull Request Process
1. Update the README.md with details of changes if applicable
2. Update the documentation if needed
3. The PR should work in development environment
4. PRs require review from at least one maintainer

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- [Express.js](https://expressjs.com/)
- [React](https://reactjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Mapbox](https://www.mapbox.com/)
- [Cloudinary](https://cloudinary.com/)
- [Stripe](https://stripe.com/)
- All contributors who have helped shape this project
