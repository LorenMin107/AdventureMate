# Bookings Route JWT Authentication Fix

## Issue
The application was crashing with the following error:
```
Error: Route.get() requires a callback function but got a [object Undefined]
    at Route.<computed> [as get] (/Users/liammin/Library/CloudStorage/OneDrive-Personal/Documents/Codes/MyanCamp/node_modules/express/lib/router/route.js:216:15)
    at proto.<computed> [as get] (/Users/liammin/Library/CloudStorage/OneDrive-Personal/Documents/Codes/MyanCamp/node_modules/express/lib/router/index.js:521:19)
    at Object.<anonymous> (/Users/liammin/Library/CloudStorage/OneDrive-Personal/Documents/Codes/MyanCamp/routes/bookings.js:7:8)
```

This error occurred because the `routes/bookings.js` file was using an `isLoggedIn` middleware function that no longer exists in the codebase. This middleware was likely removed or renamed during the migration from session-based authentication to JWT-based authentication.

## Root Cause
During the migration from session-based authentication to JWT-based authentication, the `isLoggedIn` middleware was replaced with a combination of `authenticateJWT` and `requireAuth` middleware functions. However, the `routes/bookings.js` file was not updated to use these new middleware functions, causing the error.

## Solution
The solution was to update the `routes/bookings.js` file to use the JWT-based authentication middleware instead of the session-based middleware:

1. Updated the imports to include the JWT authentication middleware:
   ```javascript
   const { authenticateJWT, requireAuth } = require("../middleware/jwtAuth");
   ```

2. Replaced all instances of `isLoggedIn` with `authenticateJWT` and `requireAuth`:
   ```javascript
   // Before
   router.get("/view", isLoggedIn, addBookingCountToUser, async (req, res) => {
     // ...
   });

   // After
   router.get("/view", authenticateJWT, requireAuth, addBookingCountToUser, async (req, res) => {
     // ...
   });
   ```

## Why This Fix Works
The fix works because:

1. It replaces the undefined `isLoggedIn` middleware with properly defined middleware functions (`authenticateJWT` and `requireAuth`).
2. It aligns the authentication approach in `routes/bookings.js` with the JWT-based authentication approach used in other routes (like `routes/campgrounds.js`).
3. It ensures that all routes are properly protected with authentication middleware.

## Authentication Flow
With this change, the authentication flow for booking routes is now:

1. `authenticateJWT` middleware extracts and verifies the JWT token from the Authorization header.
2. If the token is valid, it sets `req.user` and `req.isAuthenticated()`.
3. `requireAuth` middleware checks if `req.user` exists and returns a 401 error if not.
4. If authentication is successful, the route handler is executed.

## Additional Notes
This issue is a common one during the migration from session-based to JWT-based authentication. It's important to ensure that all routes are updated to use the new authentication approach. Here are some things to check when encountering similar issues:

1. Whether route handlers are properly defined and exported
2. Whether routes are properly imported and registered with the Express app
3. Whether there are any circular dependencies that might be causing issues
4. The order of imports and middleware registration, which can sometimes affect how routes are processed
5. Whether all middleware functions used in routes are properly defined and exported