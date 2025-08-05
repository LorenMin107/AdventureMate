# Database Setup Instructions

This document provides instructions for setting up the database for the AdventureMate application.

## Issue Resolution

The error "POST http://localhost:5173/api/users/register 400 (Bad Request)" during user registration was caused by:

1. Missing admin user in the new MongoDB Atlas database
2. Outdated seed files that were using local MongoDB connection strings

## Setup Steps

Follow these steps to set up the database:

1. **Create Admin User**

   Run the following command to create an admin user in the MongoDB Atlas database:

   ```bash
   node seedDB.js
   ```

   This will create an admin user with:
   - Username: "admin"
   - Password: "asdf!"
   - Email: "lorenmin69@gmail.com"

2. **Seed Campgrounds (Optional)**

   If you want to populate the database with sample campgrounds, run:

   ```bash
   node seeds/index.js
   ```

   This will create 10 sample campgrounds with the admin user as the author.

3. **Start the Application**

   Start the backend server:

   ```bash
   npm run dev:server
   ```

   Start the frontend development server:

   ```bash
   npm run dev:client
   ```

4. **Register New Users**

   Now you should be able to register new users through the application.

## Troubleshooting

If you encounter any issues:

1. Check that MongoDB Atlas is accessible
2. Verify that the environment variables in `.env` are correct
3. Check the server logs for any connection errors
4. Make sure both the backend and frontend servers are running

## Notes

- The seed scripts have been updated to use the MongoDB Atlas connection string from the config module
- The scripts now check if users/campgrounds already exist before creating new ones
- The admin user is required for proper application functionality
