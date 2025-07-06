# MyanCamp - Campground Booking Platform

MyanCamp is a comprehensive full-stack web application for discovering, booking, and reviewing campgrounds in Myanmar. Built with modern technologies including Node.js, Express, MongoDB, and React, the platform provides a seamless experience for campers, campground owners, and administrators.

## 🚀 Features

### For Campers

- **User Authentication & Security**

  - Email/password registration with email verification
  - Two-factor authentication (2FA) with QR code setup
  - JWT-based authentication with secure token management
  - Password reset functionality with email verification
  - Account security with login attempt limiting

- **Campground Discovery**

  - Browse campgrounds with advanced filtering and search
  - Interactive maps with Mapbox integration
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
  - Comprehensive profile management
  - Booking history and preferences
  - Review history and contributions
  - Account settings and security preferences

### For Campground Owners

- **Owner Dashboard**

  - Real-time analytics and performance metrics
  - Revenue tracking and booking statistics
  - Customer insights and feedback analysis

- **Campground Management**

  - Create and manage multiple campgrounds
  - Add/edit campsites with detailed information
  - Set pricing, availability, and restrictions
  - Photo gallery management with Cloudinary

- **Booking Management**

  - View and manage all bookings
  - Accept, reject, or modify reservations
  - Customer communication tools
  - Calendar view for availability

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

- **Platform Management**
  - System configuration and settings
  - API monitoring and rate limiting
  - Security audit logs
  - Backup and maintenance tools

## 🛠 Technology Stack

### Backend

- **Runtime**: Node.js (v20.x)
- **Framework**: Express.js (v4.21.x)
- **Database**: MongoDB (v8.16.x) with Mongoose ODM
- **Authentication**: JWT with refresh token rotation
- **File Storage**: Cloudinary for image management
- **Payment Processing**: Stripe integration
- **Email Service**: Nodemailer with SMTP
- **Maps**: Mapbox GL API
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston with daily rotation
- **Testing**: Jest with supertest

### Frontend

- **Framework**: React (v18.2.x) with Vite
- **Routing**: React Router (v6.22.x)
- **State Management**: React Query (v5.28.x) for server state
- **Forms**: React Hook Form (v7.51.x) with Yup validation
- **HTTP Client**: Axios with interceptors
- **Maps**: React Map GL with Mapbox
- **UI Components**: Custom components with CSS modules
- **Date Handling**: React Datepicker
- **Testing**: Jest with React Testing Library

### Development Tools

- **Build Tool**: Vite for fast development and building
- **Code Quality**: ESLint with Prettier
- **Version Control**: Git with conventional commits
- **API Documentation**: Swagger UI Express
- **Environment Management**: dotenv with validation

## 📦 Installation & Setup

### Prerequisites

- Node.js (v20.x or later)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd MyanCamp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```env
   # Database
   DB_URL=mongodb://localhost:27017/myan-camp

   # JWT Secrets
   JWT_ACCESS_TOKEN_SECRET=your_access_token_secret
   JWT_REFRESH_TOKEN_SECRET=your_refresh_token_secret

   # Cloudinary (Image Storage)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_KEY=your_api_key
   CLOUDINARY_SECRET=your_api_secret

   # Mapbox (Maps)
   MAPBOX_TOKEN=your_mapbox_token

   # Stripe (Payments)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLIC_KEY=your_stripe_public_key

   # Email Configuration
   EMAIL_HOST=your_smtp_host
   EMAIL_PORT=587
   EMAIL_USER=your_email_user
   EMAIL_PASSWORD=your_email_password
   EMAIL_FROM=noreply@myancamp.com

   # Server Configuration
   PORT=3001
   NODE_ENV=development
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
   npm run dev:server  # Backend on port 3001
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
MyanCamp/
├── app.js                 # Main Express application
├── config/                # Configuration management
├── models/                # Mongoose models
├── controllers/           # Business logic
│   └── api/              # API controllers
├── routes/                # Route definitions
│   └── api/v1/           # Versioned API routes
├── middleware/            # Custom middleware
├── utils/                 # Utility functions
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Frontend utilities
│   └── public/            # Static assets
├── views/                 # EJS templates (legacy)
├── public/                # Static files
├── docs/                  # Documentation
└── scripts/               # Utility scripts
```

## 🔌 API Documentation

The application provides a comprehensive RESTful API with full OpenAPI 3.0 documentation.

### API Access

- **Development**: http://localhost:3001/api/docs
- **Production**: https://myancamp.com/api/docs

### Key Endpoints

#### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/verify-email` - Email verification

#### Campgrounds

- `GET /api/v1/campgrounds` - List campgrounds
- `GET /api/v1/campgrounds/:id` - Get campground details
- `POST /api/v1/campgrounds` - Create campground (admin/owner)
- `PUT /api/v1/campgrounds/:id` - Update campground
- `DELETE /api/v1/campgrounds/:id` - Delete campground

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
- Third-party API keys
- Email configuration
- Security settings

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

### Monitoring

- **Health Checks**: API endpoint monitoring
- **Performance**: Response time tracking
- **Errors**: Error tracking and alerting
- **Usage**: API usage analytics

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
- [Mapbox](https://www.mapbox.com/) - Maps and geolocation
- [Cloudinary](https://cloudinary.com/) - Image management
- [Stripe](https://stripe.com/) - Payment processing
- [Vite](https://vitejs.dev/) - Build tool
- All contributors who have helped shape this project

## 📞 Support

For support and questions:

- **Email**: support@myancamp.com
- **Documentation**: [API Docs](http://localhost:3001/api/docs)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

**MyanCamp** - Connecting campers with amazing outdoor experiences in Myanmar 🌲🏕️
