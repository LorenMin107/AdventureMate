# API Documentation

## Overview

MyanCamp API provides a comprehensive RESTful interface for campground management, booking, and user interactions.

## Base URL

```
https://your-domain.com/api/v1
```

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response

```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "message": "Optional success message",
  "timestamp": "2025-07-17T21:30:00.000Z"
}
```

### Error Response

```json
{
  "status": "error",
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-07-17T21:30:00.000Z"
}
```

## Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/status` - Check authentication status
- `POST /auth/refresh` - Refresh access token

### Campgrounds

- `GET /campgrounds` - Get all campgrounds
- `GET /campgrounds/:id` - Get specific campground
- `POST /campgrounds` - Create new campground (Admin/Owner)
- `PUT /campgrounds/:id` - Update campground (Author/Admin)
- `DELETE /campgrounds/:id` - Delete campground (Author/Admin)

### Bookings

- `GET /bookings` - Get user bookings
- `GET /bookings/:id` - Get specific booking
- `POST /bookings` - Create new booking
- `DELETE /bookings/:id` - Cancel booking

### Reviews

- `GET /campgrounds/:id/reviews` - Get campground reviews
- `POST /campgrounds/:id/reviews` - Create review
- `DELETE /reviews/:id` - Delete review (Author/Admin)

### Admin

- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/users` - Get all users
- `GET /admin/bookings` - Get all bookings
- `GET /admin/campgrounds` - Get all campgrounds

### Weather

- `GET /weather` - Get weather data for coordinates

### Safety Alerts

- `GET /campgrounds/:id/safety-alerts` - Get campground safety alerts
- `POST /campgrounds/:id/safety-alerts` - Create safety alert (Admin/Owner)

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 1000 requests per minute
- **Admin endpoints**: 5000 requests per minute

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Support

For API support and questions, please contact the development team.
