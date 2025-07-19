# AdventureMate - Campground Booking Platform

AdventureMate is a comprehensive full-stack web application for discovering, booking, and reviewing campgrounds. Built with modern technologies including Node.js, Express, MongoDB, React, and Vite, the platform provides a seamless experience for campers, campground owners, and administrators.

## 🎉 Latest Updates - Error Handling & UX Improvements

### Safety Alert Delete Functionality Fix (Latest)

**Status:** ✅ Completed  
**Date:** July 2025

- ✅ **Fixed safety alert deletion** - Resolved 404 errors when deleting campground-level alerts using campsite endpoints
- ✅ **Smart endpoint detection** - System now automatically detects alert type and uses appropriate API endpoint
- ✅ **Enhanced error logging** - Improved debugging with detailed console output for alert operations
- ✅ **Consistent logic** - Delete function now follows same pattern as acknowledge function for reliability

### Redis Configuration Fix (Latest)

**Status:** ✅ Completed  
**Date:** July 2025

- ✅ **Fixed Docker Redis connection** - Application now connects to local Redis instance instead of containerized Redis
- ✅ **Improved data persistence** - Redis data persists across container restarts
- ✅ **Simplified architecture** - No need to manage separate Redis container for development
- ✅ **Better performance** - Direct connection to local Redis instance

### Profile Update Error Handling Fix

**Status:** ✅ Completed  
**Date:** July 2025

- ✅ **Fixed validation error display** - Profile update errors now show as field-specific messages in the modal
- ✅ **Improved error boundary behavior** - Validation errors no longer trigger generic error pages
- ✅ **Enhanced user experience** - Modal stays open on errors, closes only on successful updates
- ✅ **Better error messages** - Users see specific feedback like "Username is already taken" instead of generic errors

### Phase 3 Complete - API Migration Finalized

The application has successfully completed the migration to API-only architecture:

- ✅ **Traditional routes removed** - All functionality now uses `/api/v1/*` endpoints
- ✅ **EJS templates removed** - Complete removal of server-side rendering dependencies
- ✅ **JWT authentication** - Secure token-based authentication
- ✅ **Performance optimized** - Enhanced caching and response times
- ✅ **Security hardened** - Latest security best practices applied
- ✅ **Documentation updated** - Comprehensive API documentation

### Architecture Overview

The application now uses a modern, scalable API-only architecture with React frontend:

**Backend (API-Only):**

```
/api/v1/
├── auth/           # Authentication & authorization
├── users/          # User management
├── campgrounds/    # Campground operations
├── campsites/      # Campsite management
├── bookings/       # Booking system
├── reviews/        # Review system
├── trips/          # Trip planning
├── forum/          # Community forum
├── admin/          # Admin operations
├── owners/         # Owner operations
├── weather/        # Weather data
├── safety-alerts/  # Safety alerts
├── mapbox/         # Geocoding services
└── cloudinary/     # Image optimization
```

**Frontend (React SPA):**

- Modern React 18 with Vite
- React Router for client-side routing
- React Query for server state management
- Complete internationalization (English/Thai)
- Responsive design with custom components

### Key Benefits

- **Scalability**: API can serve web, mobile, and third-party clients
- **Performance**: Optimized caching and response times
- **Security**: JWT authentication with proper token management
- **Maintainability**: Clean, modular codebase
- **Monitoring**: Comprehensive logging and error tracking

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm run start:prod

# Run tests
npm test

# Run API tests
npm run test:api
```

For detailed API documentation, see [API Documentation](./docs/api.md).

## 🐳 Docker Development

### Quick Start with Docker

```bash
# Start all services (uses local Redis)
docker-compose up -d

# Start with development tools
docker-compose --profile tools up -d

# View logs
docker-compose logs -f app

# Restart application
docker-compose restart app

# Stop all services
docker-compose down
```

### Docker Configuration

- **Application**: Runs on port 3001 (backend) and 5173 (frontend)
- **MongoDB**: Runs on port 27017 with persistent data
- **Redis**: Uses local Redis instance (not containerized) for better performance
- **Development Tools**: Mongo Express (8081) and Redis Commander (8082) available with `--profile tools`

### Environment Variables

The Docker setup automatically loads environment variables from your `.env` file. Key configurations:

- **Database**: MongoDB Atlas connection string
- **Redis**: Local Redis instance via `host.docker.internal`
- **API Keys**: Mapbox, Cloudinary, Stripe, OpenWeatherMap
- **JWT Secrets**: Secure token management

### Docker Commands Reference

```bash
# Basic operations
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose restart app    # Restart application
docker-compose logs -f app    # Follow application logs

# Development tools
docker-compose --profile tools up -d    # Start with Mongo Express & Redis Commander
docker-compose exec app sh              # Access application shell
docker-compose exec mongodb mongosh     # Access MongoDB shell

# Monitoring
docker-compose ps                       # Check container status
docker stats                           # Monitor resource usage
docker-compose logs app --tail=20      # View recent logs
```

## 🚀 Features

### Modern Tech Stack

- **Frontend**: React 18 with Vite for fast development and building
- **State Management**: React Query for efficient server state management
- **UI Components**: Custom components with responsive design
- **Maps**: Integrated Mapbox for interactive campground locations and location picking
- **Forms**: React Hook Form with Yup validation
- **PDF Generation**: @react-pdf/renderer for booking confirmations
- **Internationalization**: React-i18next for complete bilingual support (English/Thai)

### 🌍 Internationalization (i18n)

- **Complete Bilingual Support**: Full English and Thai language support across the entire application
- **Dynamic Language Switching**: Users can switch between languages with persistent preference storage
- **Comprehensive Coverage**: All user-facing text translated including:
  - Admin dashboard and management interfaces
  - Owner portal and campground management
  - User authentication and profile management
  - Booking system and payment flows
  - Forum system with posts, replies, and Q&A
  - Trip planning and itinerary management
  - Weather and safety alert components
  - Form validation and error messages
  - Navigation and common UI elements
- **React-i18next Integration**: Modern internationalization framework with interpolation and pluralization support
- **Consistent Terminology**: Centralized translation management ensures consistent language usage
- **SEO Optimized**: Multi-language support improves search engine optimization for Thai users

### For Campers

- **User Authentication & Security**
  - Email/password registration with email verification
  - Two-factor authentication (2FA) with QR code setup
  - JWT-based authentication with secure token management
  - Password reset functionality with email verification
  - Account security with login attempt limiting
  - Toggle password visibility in login and registration forms

- **Campground Discovery**
  - Browse campgrounds with advanced filtering and search
  - Interactive maps with Mapbox integration and clustering
  - **Real-time Weather Integration**: Current weather and 3-day forecast for each campground location
  - View detailed campground information, photos, and amenities
  - Real-time availability checking and pricing
  - Responsive design for mobile and desktop

- **Booking System**
  - Reserve campsites with flexible date selection
  - Secure payment processing with Stripe integration
  - Booking management (view, modify, cancel)
  - Email confirmations and notifications
  - Booking history and receipts

- **Review & Rating System**
  - Leave detailed ratings and reviews for campgrounds
  - View other users' reviews with helpful voting
  - Photo uploads in reviews
  - Review moderation and reporting

- **User Profiles**
  - Comprehensive profile management with real-time validation
  - Booking history and preferences
  - Review history and contributions
  - Account settings and security preferences
  - **Enhanced Error Handling**: Field-specific validation errors displayed in modals without triggering error pages

### 🌤️ Weather Integration System

- **Real-time Weather Data**: Current temperature, conditions, and 3-day forecast for each campground
- **OpenWeatherMap Integration**: Free API with comprehensive weather information
- **Smart Caching**: Redis-based caching (15 minutes) to reduce API calls and improve performance
- **Responsive Weather Display**: Compact weather boxes in map popups with full weather details
- **Theme Integration**: Weather components follow the app's dark/light theme system
- **Location-based**: Weather data fetched based on campground coordinates
- **Error Handling**: Graceful fallback when weather data is unavailable

### 🚨 Safety Alerts System

- **Safety Alert Management**: Complete CRUD operations for safety alerts with role-based permissions
- **Alert Acknowledgment**: Users must acknowledge safety alerts before booking campsites
- **Permission System**: Only campground owners and admins can create and manage alerts
- **Integration**: Safety alerts prominently displayed on campground and campsite pages
- **Caching**: Redis-based caching for improved performance and reduced database load
- **Validation**: Comprehensive input validation and error handling for all alert operations
- **User Experience**: Clear alert display with acknowledgment tracking and management

### 🗺️ Enhanced Map Popup System

- **Smart Pricing Display**: Intelligent pricing information based on campground status
  - Shows "From $X / night" for campgrounds with available campsites
  - Displays "No campsites available yet." for campgrounds without campsites
- **Custom Popup Layout**: Professional popup design with custom close buttons
- **Weather Integration**: Weather information prominently displayed at the top of popups
- **Responsive Design**: Popups auto-expand to fit content without clipping
- **Dark Theme**: Consistent dark theme styling throughout popup components
- **Flexible Layout**: Clean vertical stacking with proper spacing and typography
- **Interactive Elements**: Hover effects and smooth transitions for better UX
- **Content Management**: Proper text truncation and overflow handling for long addresses
- **Dynamic Positioning**: Smart popup positioning to avoid edge clipping
- **Performance Optimized**: Efficient data loading with backend campsite population
- **Backend Integration**: Optimized API endpoints with campsite data population for efficient frontend rendering

### For Campground Owners

- **Owner Dashboard**
  - Real-time analytics and performance metrics
  - Revenue tracking and booking statistics
  - Customer insights and feedback analysis

- **Campground Management**
  - Create and manage multiple campgrounds
  - **Advanced Location Input System**: Interactive Mapbox map picker with search and autocomplete
  - Add/edit campsites with detailed information
  - Set pricing, availability, and restrictions
  - Photo gallery management with Cloudinary

- **Booking Management**
  - View and manage all bookings
  - Accept, reject, or modify reservations
  - Customer communication tools
  - Calendar view for availability

- **Safety Alerts Management**
  - Create and manage safety alerts for campgrounds
  - Set alert acknowledgment requirements
  - Track user acknowledgments
  - Alert history and management

- **Owner Verification System**
  - Secure owner registration process
  - Document verification and approval
  - Profile completion requirements

### For Administrators

- **Admin Dashboard**
  - Comprehensive platform overview
  - User, campground, and booking statistics
  - Revenue and growth analytics
  - System health monitoring

- **User Management**
  - View and manage all user accounts
  - Handle user permissions and roles
  - Account verification and moderation
  - Support ticket management

- **Content Moderation**
  - Review and approve campground listings
  - Moderate user reviews and comments
  - Handle reports and disputes
  - Quality control and standards enforcement
  - Manage safety alerts across all campgrounds

- **Platform Management**
  - System configuration and settings
  - API monitoring and rate limiting
  - Security audit logs
  - Backup and maintenance tools

### 🛡️ Robust Error Handling System

- **Intelligent Error Boundaries**: React error boundaries catch unhandled errors while allowing local error handling
- **Field-Specific Validation**: Form validation errors displayed under relevant input fields
- **Modal Error Handling**: Validation errors handled locally in modals without triggering full-page errors
- **Graceful Degradation**: System continues functioning even when non-critical services fail
- **User-Friendly Messages**: Clear, actionable error messages instead of technical jargon
- **Error Logging**: Comprehensive error tracking and logging for debugging and monitoring
- **Consistent UX**: Uniform error handling patterns across all components and pages

### 🗺️ Advanced Location System

- **Interactive Map Picker**: Drag-and-drop location selection with Mapbox integration
- **Geocoding & Reverse Geocoding**: Automatic address-to-coordinates conversion
- **Search & Autocomplete**: Location search with suggestions focused on Thailand
- **Structured Address Fields**: Street, city, state, and country with validation
- **Real-time Validation**: Immediate feedback on location data
- **Cache Management**: Redis-based caching for improved performance
- **Error Handling**: Detailed validation error reporting for better user experience

## 🛠 Technology Stack

### Backend

- **Runtime**: Node.js (v20.x)
- **Framework**: Express.js (v4.21.x)
- **Database**: MongoDB (v8.16.x) with Mongoose ODM
- **Authentication**: JWT with refresh token rotation
- **File Storage**: Cloudinary for image management
- **Payment Processing**: Stripe integration
- **Email Service**: Nodemailer with SMTP
- **Maps & Geocoding**: Mapbox GL API with Geocoding API
- **Weather Data**: OpenWeatherMap API for real-time weather information
- **Caching**: Redis for performance optimization
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston with daily rotation and structured error reporting
- **Testing**: Jest with supertest

### Frontend

- **Framework**: React (v18.2.x) with Vite
- **Routing**: React Router (v6.22.x)
- **State Management**: React Query (v5.28.x) for server state
- **Forms**: React Hook Form (v7.51.x) with Yup validation
- **HTTP Client**: Axios with interceptors
- **Maps**: React Map GL with Mapbox integration
- **UI Components**: Custom components with CSS modules
- **Weather Components**: WeatherBox component with React Query integration
- **Date Handling**: React Datepicker
- **Internationalization**: React-i18next for bilingual support (English/Thai)
- **Testing**: Jest with React Testing Library

### Development Tools

- **Build Tool**: Vite for fast development and building
- **Code Quality**: ESLint with Prettier
- **Version Control**: Git with conventional commits
- **API Documentation**: Swagger UI Express
- **Environment Management**: dotenv with validation

## 📦 Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm (v9 or higher) or yarn
- Git
- Redis (for caching and rate limiting)
- Mapbox API key (for maps and geocoding)
- OpenWeatherMap API key (for weather data)
- Cloudinary account (for image uploads)
- Stripe account (for payments)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd AdventureMate
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/adventuremate

   # JWT
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=30d
   JWT_COOKIE_EXPIRES=30

   # Email (Nodemailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_specific_password
   EMAIL_FROM=AdventureMate <noreply@adventuremate.com>

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_KEY=your_api_key
   CLOUDINARY_SECRET=your_api_secret

   # Mapbox (Required for location system)
   MAPBOX_TOKEN=your_mapbox_token

   # OpenWeatherMap (Required for weather integration)
   OPENWEATHER_KEY=your_openweathermap_api_key

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Redis (Required for caching)
   REDIS_URL=redis://localhost:6379

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=15*60*1000  # 15 minutes
   RATE_LIMIT_MAX=100  # limit each IP to 100 requests per windowMs
   ```

4. **Database Setup**

   ```bash
   # Seed the database with sample data
   node seeds/index.js

   # Create admin user
   node seedDB.js
   ```

5. **Start Development Servers**

   ```bash
   # Start both backend and frontend
   npm run dev

   # Or start individually:
   npm run dev:server  # Backend on port 3000
   npm run dev:client  # Frontend on port 5173
   ```

### Database Seeding

The application includes comprehensive seeding scripts:

```bash
# Seed campgrounds, users, and sample data
node seeds/index.js

# Create admin user (username: admin, password: asdf!)
node seedDB.js

# Update existing data (if needed)
node scripts/updateReviews.js
node scripts/updateUsers.js
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both servers
npm run dev:server       # Backend only
npm run dev:client       # Frontend only

# Building
npm run build           # Build React app
npm run preview         # Preview built app

# Code Quality
npm run lint            # ESLint check
npm run format          # Prettier formatting
npm test                # Run tests
```

### Project Structure

```
AdventureMate/
├── client/                 # React frontend (Vite + React 18)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── MapPicker.jsx  # Interactive location picker
│   │   │   ├── SafetyAlertList.jsx  # Safety alerts display
│   │   │   ├── SafetyAlertForm.jsx  # Safety alert creation/editing
│   │   │   └── maps/       # Map-related components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── layouts/        # Layout components
│   │   ├── services/       # API service layer
│   │   ├── utils/          # Frontend utilities
│   │   ├── i18n/           # Internationalization configuration
│   │   └── locales/        # Translation files
│   │       ├── en/         # English translations
│   │       └── th/         # Thai translations
│   └── public/             # Static assets
│
├── config/                # Configuration management
├── controllers/           # Route controllers
│   ├── api/               # API controllers
│   │   ├── campgrounds.js # Enhanced with location validation and campsite population
│   │   ├── safetyAlerts.js # Safety alerts management
│   │   └── ownerCampgrounds.js # Owner-specific with cache invalidation
│   ├── bookings.js        # Booking logic
│   └── users.js           # User management
│
├── middleware/            # Express middleware
│   ├── auth.js           # Authentication middleware
│   ├── error.js          # Error handling
│   └── validation.js     # Request validation
│
├── models/                # Mongoose models
│   ├── Booking.js        # Booking schema
│   ├── Campground.js     # Enhanced with geometry and location fields
│   ├── Review.js         # Review schema
│   ├── SafetyAlert.js    # Safety alerts schema
│   └── User.js           # User schema
│
├── routes/                # Route definitions
│   ├── api/              # API routes
│   │   ├── safetyAlerts.js # Safety alerts routes
│   ├── bookings.js       # Booking routes
│   ├── campgrounds.js    # Campground routes
│   └── users.js          # User routes
│
├── utils/                 # Utility functions
│   ├── logger.js         # Enhanced logging with structured errors
│   ├── errorHandler.js   # Detailed validation error reporting
│   ├── redis.js          # Redis caching utilities
│   └── apiResponse.js    # Standardized API responses
│
└── docs/                  # API documentation (Swagger/OpenAPI)
```

**Note**: The application includes comprehensive internationalization with translation files for English and Thai languages. All user-facing text is managed through the translation system for easy maintenance and consistency.

## 🔌 API Documentation

The application provides a comprehensive RESTful API with full OpenAPI 3.0 documentation.

### API Access

- **Development**: http://localhost:3001/api/docs
- **Production**: https://adventuremate.com/api/docs

### Key Endpoints

#### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/verify-email` - Email verification

#### Campgrounds

- `GET /api/v1/campgrounds` - List campgrounds (with caching)
- `GET /api/v1/campgrounds/:id` - Get campground details
- `POST /api/v1/campgrounds` - Create campground (admin/owner)
- `PUT /api/v1/campgrounds/:id` - Update campground
- `DELETE /api/v1/campgrounds/:id` - Delete campground

#### Owner Campgrounds

- `GET /api/v1/owner/campgrounds` - Owner's campgrounds
- `POST /api/v1/owner/campgrounds` - Create campground (owner)
- `PUT /api/v1/owner/campgrounds/:id` - Update campground (owner)
- `DELETE /api/v1/owner/campgrounds/:id` - Delete campground (owner)

#### Bookings

- `GET /api/v1/bookings` - User's bookings
- `GET /api/v1/bookings/:id` - Booking details
- `POST /api/v1/bookings` - Create booking
- `PUT /api/v1/bookings/:id` - Update booking
- `DELETE /api/v1/bookings/:id` - Cancel booking

#### Reviews

- `GET /api/v1/campgrounds/:id/reviews` - Campground reviews
- `POST /api/v1/campgrounds/:id/reviews` - Create review
- `PUT /api/v1/reviews/:id` - Update review
- `DELETE /api/v1/reviews/:id` - Delete review

#### Weather

- `GET /api/v1/weather?lat={latitude}&lng={longitude}` - Get weather data for location
  - Returns current weather and 3-day forecast
  - Cached for 15 minutes to improve performance
  - Requires valid latitude (-90 to 90) and longitude (-180 to 180)

#### Safety Alerts

- `GET /api/v1/safety-alerts` - List safety alerts (with optional campground filter)
- `GET /api/v1/safety-alerts/:id` - Get safety alert details
- `POST /api/v1/safety-alerts` - Create safety alert (owner/admin only)
- `PUT /api/v1/safety-alerts/:id` - Update safety alert (owner/admin only)
- `DELETE /api/v1/safety-alerts/:id` - Delete safety alert (owner/admin only)
- `POST /api/v1/safety-alerts/:id/acknowledge` - Acknowledge safety alert (user)

#### Admin

- `GET /api/v1/admin/dashboard` - Admin dashboard
- `GET /api/v1/admin/users` - User management
- `GET /api/v1/admin/bookings` - Booking management
- `GET /api/v1/admin/campgrounds` - Campground management

### Authentication

The API uses JWT authentication with the following flow:

1. **Login**: User receives access token (15min) and refresh token (7 days)
2. **Requests**: Include `Authorization: Bearer <token>` header
3. **Refresh**: Use refresh token to get new access token
4. **Security**: Tokens stored in HTTP-only cookies for web routes

## 🔒 Security Features

### Authentication & Authorization

- JWT-based authentication with refresh token rotation
- Two-factor authentication (TOTP) with backup codes
- Role-based access control (User, Owner, Admin)
- Password strength requirements and account lockout
- Email verification for new accounts

### API Security

- Rate limiting to prevent abuse
- Input validation and sanitization
- MongoDB query sanitization
- CORS configuration for cross-origin requests
- Content Security Policy (CSP) headers

### Data Protection

- Password hashing with bcrypt
- Secure HTTP-only cookies
- HTTPS enforcement in production
- XSS and CSRF protection
- SQL injection prevention

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows
- **Security Tests**: Authentication and authorization

## 🚀 Deployment

### Production Build

```bash
# Build the React application
npm run build

# Start production server
npm start
```

### Environment Variables (Production)

Ensure all required environment variables are set:

- Database connection string
- JWT secrets
- Third-party API keys (Mapbox, Cloudinary, Stripe)
- Email configuration
- Security settings
- Redis configuration

### Deployment Options

- **Heroku**: Use the provided Procfile
- **Docker**: Use the included Dockerfile
- **VPS**: Manual deployment with PM2 or similar
- **Cloud Platforms**: AWS, Google Cloud, Azure

## 📊 Monitoring & Logging

### Logging System

- **Winston**: Structured logging with multiple transports
- **Daily Rotation**: Log files rotated daily
- **Log Levels**: Error, Warn, Info, Debug
- **Security Logging**: Authentication and authorization events
- **Validation Error Logging**: Detailed field-level error reporting
- **Safety Alert Logging**: Comprehensive tracking of alert creation, updates, and acknowledgments

### Monitoring

- **Health Checks**: API endpoint monitoring
- **Performance**: Response time tracking
- **Errors**: Error tracking and alerting
- **Usage**: API usage analytics
- **Cache Performance**: Redis cache hit/miss monitoring
- **Safety Alerts**: Monitoring of alert effectiveness and user acknowledgment rates

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper testing
4. Run linting and tests: `npm run lint && npm test`
5. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards

- Follow ESLint configuration
- Use Prettier for code formatting
- Write tests for new features
- Update documentation as needed
- Follow existing code patterns

### Pull Request Requirements

- All tests must pass
- Code must be linted and formatted
- Documentation updated if needed
- No breaking changes without discussion

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [React](https://reactjs.org/) - UI library
- [MongoDB](https://www.mongodb.com/) - Database
- [Mapbox](https://www.mapbox.com/) - Maps, geolocation, and geocoding
- [Cloudinary](https://cloudinary.com/) - Image management
- [Stripe](https://stripe.com/) - Payment processing
- [Vite](https://vitejs.dev/) - Build tool
- [Redis](https://redis.io/) - Caching and session storage
- All contributors who have helped shape this project

## 📞 Support

For support and questions:

- **Email**: support@adventuremate.com
- **Documentation**: [API Docs](http://localhost:3001/api/docs)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Feature Documentation**:
  - [Weather Integration](WEATHER-FEATURE-README.md)
  - [Safety Alerts System](SAFETY-ALERTS-README.md)

---

**AdventureMate** - Connecting campers with amazing outdoor experiences in Thailand 🌲🏕️
