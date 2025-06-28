# MyanCamp

MyanCamp is a web application for discovering, booking, and reviewing campgrounds in Myanmar. This project uses Node.js, Express, MongoDB with React for the frontend. The application is in the process of migrating from server-rendered EJS templates to a modern React-based architecture.

## Features
- **User Authentication** (Login/Register)
- **Campground Management** (CRUD operations)
- **Booking System**
- **Review System**
- **Admin Dashboard**
- **Map Integration** with Mapbox
- **Security** with Helmet, Mongo Sanitize, and Content Security Policy
- **RESTful API** for React frontend integration

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

### Project Structure
- **app.js**: Main Express application file.
- **models/**: Mongoose models for User, Campground, Review, and Booking.
- **controllers/**: Route handlers for campgrounds, reviews, bookings, and users.
  - **api/**: API controllers that return JSON responses.
- **routes/**: Express routes for different parts of the application.
  - **api/**: API routes that return JSON responses.
- **views/**: EJS templates for server-side rendering (legacy).
- **public/**: Static files (CSS, JS, images).
  - **dist/**: Built React application (production).
- **client/**: React frontend application.
  - **public/**: Static assets for the React application.
    - **images/**: Image files.
    - **fonts/**: Font files.
    - **icons/**: Icon files.
  - **src/**: React source code.
    - **assets/**: Assets imported directly in the code.
      - **images/**: Image files.
      - **styles/**: Global style files.
      - **icons/**: Icon files.
    - **components/**: Reusable React components.
    - **context/**: React context providers.
    - **hooks/**: Custom React hooks.
    - **layouts/**: Layout components.
    - **pages/**: Page components for different routes.
    - **utils/**: Utility functions.
    - **__tests__/**: Test files for React components and hooks.
  - **index.html**: HTML entry point for the React application.

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
