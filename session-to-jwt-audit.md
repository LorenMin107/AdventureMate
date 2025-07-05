# Session to JWT Migration Audit

## Current State Analysis

### Authentication Middleware
1. **Session-based Authentication**
   - Located in `middleware.js`
   - Key middleware functions:
     - `isLoggedIn`: Redirects to login page if not authenticated
     - `isLoggedInApi`: JSON response version of isLoggedIn, supports both session and JWT
     - `storeReturnTo`: Stores return path in session for redirecting after login

2. **JWT-based Authentication**
   - Located in `middleware/jwtAuth.js`
   - Key middleware functions:
     - `authenticateJWT`: Extracts and verifies JWT from Authorization header
     - `requireAuth`: Ensures a user is authenticated
     - `requireAdmin`: Checks if user is an admin
     - `requireOwner`: Checks if user is an owner
     - `requireEmailVerified`: Ensures user's email is verified

3. **Session Security**
   - Located in `middleware/sessionSecurity.js`
   - Key middleware functions:
     - `validateSession`: Validates session based on IP and user agent
     - `rotateSession`: Rotates session ID periodically for security

4. **Deprecation and Conversion**
   - Located in `middleware/deprecation.js`
   - Key middleware functions:
     - `deprecateEndpoint`: Adds deprecation notices to legacy endpoints
     - `convertSessionToJWT`: Converts session-based auth to JWT tokens

### API Routes

1. **Legacy API Routes (Unversioned)**
   - All marked with deprecation notices pointing to v1 equivalents
   - Use `isLoggedInApi` middleware which supports both session and JWT auth
   - Routes:
     - `/api/users`: Authentication endpoints (login, register, logout)
     - `/api/reviews`: Review management
     - `/api/admin`: Admin operations
     - `/api/campgrounds`: Campground management
     - `/api/bookings`: Booking management
     - `/api/2fa`: Two-factor authentication

2. **Versioned API Routes (v1)**
   - Use JWT-based authentication exclusively
   - Routes:
     - `/api/v1/auth`: Authentication endpoints (login, register, logout, token refresh)
     - `/api/v1/users`: User management
     - `/api/v1/reviews`: Review management
     - `/api/v1/admin`: Admin operations
     - `/api/v1/campgrounds`: Campground management
     - `/api/v1/bookings`: Booking management
     - `/api/v1/2fa`: Two-factor authentication

### Web Routes
- Use traditional session-based authentication with Passport
- Routes:
  - `/campgrounds`: Campground management
  - `/campgrounds/:id/reviews`: Review management
  - `/admin`: Admin operations
  - `/`: User routes (login, register, logout)

### Frontend Authentication

1. **Authentication Context**
   - Located in `client/src/context/AuthContext.jsx`
   - Manages authentication state and provides auth functions to components
   - Supports JWT token management (storage, refresh)

2. **Authentication Service**
   - Located in `client/src/services/AuthService.js`
   - Handles API communication for authentication
   - Manages JWT tokens (storage, refresh, validation)

3. **API Client**
   - Located in `client/src/utils/api.js`
   - Configured to use versioned API by default (`baseURL: '/api/v1'`)
   - Includes both JWT token and session cookie support:
     - Adds JWT token to Authorization header if available
     - Includes cookies in requests (`withCredentials: true`)
   - Handles token refresh when 401 errors are received

## Session-Dependent Routes

### Legacy API Routes
1. **Authentication Routes**
   - `/api/users/register`: Register a new user
   - `/api/users/login`: Login a user (uses Passport)
   - `/api/users/logout`: Logout a user
   - `/api/users/status`: Check authentication status

2. **Protected Routes Using `isLoggedInApi`**
   - `/api/users/profile`: Get/update user profile
   - `/api/users/contact`: Submit contact form
   - `/api/users/reviews`: Get user reviews
   - `/api/reviews`: Create/delete reviews
   - `/api/admin/*`: All admin routes
   - `/api/campgrounds`: Create/update/delete campgrounds
   - `/api/bookings/*`: All booking routes

### Web Routes
1. **Authentication Routes**
   - `/register`: Register a new user
   - `/login`: Login a user (uses Passport)
   - `/logout`: Logout a user

2. **Protected Routes Using `isLoggedIn`**
   - `/campgrounds/new`: Create new campground
   - `/campgrounds/:id/edit`: Edit campground
   - `/campgrounds/:id`: Update/delete campground
   - `/admin/*`: All admin routes

## Migration Strategy Recommendations

### Phase 1: Complete the Audit (Current Phase)
- ✅ Identify all session-dependent routes
- ✅ Document authentication flows
- ✅ Map which routes use `isLoggedInApi` vs `authenticateJWT`

### Phase 2: Frontend Migration
1. Update frontend components to use JWT exclusively:
   - Ensure all API requests include JWT tokens
   - Remove any direct dependencies on session cookies
   - Test all authentication flows with JWT only

### Phase 3: API Endpoint Consolidation
1. Redirect all legacy API endpoints to v1 equivalents:
   - Update remaining clients to use v1 API
   - Monitor usage of deprecated endpoints
   - Set a timeline for removing legacy endpoints

### Phase 4: Session Removal
1. Remove session-based authentication:
   - Remove Passport session configuration
   - Remove session middleware
   - Update web routes to use JWT authentication
   - Implement proper redirects for web authentication

### Phase 5: Cleanup
1. Remove deprecated code:
   - Remove `convertSessionToJWT` middleware
   - Remove legacy API routes
   - Remove session-related configuration
   - Update documentation

## Conclusion
The application is currently in a transitional state between session-based and JWT-based authentication. The infrastructure for JWT authentication is well-established, with versioned API routes already using JWT exclusively. The main work remaining is to complete the migration of frontend components and web routes to use JWT authentication, and then to remove the session-based authentication infrastructure.