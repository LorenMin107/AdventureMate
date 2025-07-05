# API Endpoint Consolidation

## Overview

This document provides information about the consolidation of legacy API endpoints to their v1 equivalents as part of Phase 3 of the Session to JWT Migration Plan.

## Changes Made

All legacy API endpoints have been updated to redirect to their v1 equivalents with a 308 Permanent Redirect status code. The redirects include helpful messages and the redirectTo URL in the response.

### Updated Files:
- `routes/api/users.js` - Redirects to `/api/v1/auth` and `/api/v1/users` endpoints
- `routes/api/reviews.js` - Redirects to `/api/v1/campgrounds/:id/reviews` endpoints
- `routes/api/admin.js` - Redirects to `/api/v1/admin` endpoints
- `routes/api/campgrounds.js` - Redirects to `/api/v1/campgrounds` endpoints
- `routes/api/bookings.js` - Redirects to `/api/v1/bookings` endpoints
- `routes/api/twoFactorAuth.js` - Redirects to `/api/v1/2fa` endpoints

### Example Redirect:
```javascript
router.get("/profile", (req, res) => {
  return res.status(308).json({ 
    message: "This endpoint is deprecated. Please use /api/v1/users/profile instead.",
    redirectTo: "/api/v1/users/profile"
  });
});
```

## Monitoring Usage

The usage of deprecated endpoints is being monitored through the `DeprecationLog` model, which logs information about each request to a deprecated endpoint. This monitoring will help identify which clients are still using the deprecated endpoints and target them for migration assistance.

## Deprecation Timeline

A detailed deprecation schedule has been created in the `API-DEPRECATION-SCHEDULE.md` file. The schedule outlines a three-phase approach to deprecating the legacy API endpoints:

1. **Phase 1: Redirection (Current Phase)** - 3 months
2. **Phase 2: Warning Period** - 3 months
3. **Phase 3: Removal** - after 6 months

## Testing the Redirects

To verify that the redirects are working correctly, you can use the following methods:

### Using cURL:
```bash
curl -i -X GET http://localhost:3000/api/users/profile
```

Expected response:
```
HTTP/1.1 308 Permanent Redirect
Content-Type: application/json; charset=utf-8
{
  "message": "This endpoint is deprecated. Please use /api/v1/users/profile instead.",
  "redirectTo": "/api/v1/users/profile"
}
```

### Using Postman:
1. Send a request to a legacy API endpoint (e.g., `GET /api/users/profile`)
2. Verify that the response has a 308 status code
3. Verify that the response body includes a message and redirectTo URL
4. Send a request to the redirectTo URL and verify that it works correctly

### Using the Browser:
1. Open the browser's developer tools
2. Navigate to the Network tab
3. Send a request to a legacy API endpoint
4. Verify that the response has a 308 status code
5. Verify that the response body includes a message and redirectTo URL

## Next Steps

1. **Monitor Usage**: Regularly review the `DeprecationLog` data to identify clients still using deprecated endpoints
2. **Update Documentation**: Update API documentation to clearly mark deprecated endpoints and provide migration guides
3. **Client Notifications**: Notify clients about the deprecation and provide assistance for migration
4. **Prepare for Removal**: After the deprecation period, prepare for the removal of legacy endpoints

## Conclusion

The consolidation of legacy API endpoints to their v1 equivalents is a critical step in the migration from session-based authentication to JWT-based authentication. By redirecting requests to the v1 endpoints, we ensure a smooth transition for clients while maintaining backward compatibility during the deprecation period.