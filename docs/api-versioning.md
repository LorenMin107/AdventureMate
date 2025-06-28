# API Versioning Strategy

This document outlines the API versioning strategy for the MyanCamp application.

## Overview

MyanCamp uses URL path versioning for its API. This means that the version is specified in the URL path, e.g., `/api/v1/campgrounds`. This approach was chosen for its simplicity, visibility, and compatibility with browser caching.

## Current Versions

The API currently has two versions:

1. **Legacy API** (unversioned): `/api/campgrounds`, `/api/users`, etc.
   - These endpoints are deprecated and will be removed in a future version.
   - They return deprecation notices in the response headers.

2. **v1 API**: `/api/v1/campgrounds`, `/api/v1/users`, etc.
   - This is the current stable version of the API.
   - It includes all the functionality of the legacy API, plus new features like campsites.

## Versioning Headers

All API responses include the following headers:

- `X-API-Version`: The version of the API that processed the request.

For deprecated endpoints, the following additional headers are included:

- `X-API-Deprecated`: Set to `true` for deprecated endpoints.
- `X-API-Deprecation-Message`: A message explaining that the endpoint is deprecated.
- `X-API-Deprecation-Version`: The version when the endpoint will be removed.
- `X-API-Alternative-URL`: The URL of the alternative endpoint to use.

## Migrating from Legacy API to v1

To migrate from the legacy API to v1, simply update your API calls to use the v1 URL path. For example:

- Legacy: `GET /api/campgrounds`
- v1: `GET /api/v1/campgrounds`

The response format and parameters remain the same, so no other changes are needed.

## New Features in v1

The v1 API includes the following new features not available in the legacy API:

- **Campsites**: The v1 API includes endpoints for managing campsites within campgrounds.
  - `GET /api/v1/campgrounds/:campgroundId/campsites`: Get all campsites for a campground.
  - `POST /api/v1/campgrounds/:campgroundId/campsites`: Create a new campsite for a campground.
  - `GET /api/v1/campsites/:id`: Get a specific campsite.
  - `PUT /api/v1/campsites/:id`: Update a campsite.
  - `DELETE /api/v1/campsites/:id`: Delete a campsite.

## Future Versioning

When a new version of the API is needed (e.g., v2), the following steps will be taken:

1. Create a new directory structure for the new version (e.g., `routes/api/v2`).
2. Implement the new version's routes and controllers.
3. Mount the new version's routes in app.js (e.g., `app.use("/api/v2", apiV2Routes)`).
4. Update the documentation to reflect the new version.
5. Add deprecation notices to the previous version's endpoints when appropriate.

## Breaking Changes

Breaking changes should only be introduced in new API versions. Examples of breaking changes include:

- Removing endpoints
- Changing the response format
- Changing required parameters
- Changing the behavior of existing endpoints

Non-breaking changes (e.g., adding new optional parameters, adding new endpoints) can be made to the current version without incrementing the version number.

## Deprecation Policy

When an endpoint is deprecated:

1. A deprecation notice is added to the response headers.
2. The endpoint continues to function as before.
3. The endpoint is removed in the next major version of the API.

Deprecated endpoints will be supported for at least 6 months after deprecation to give clients time to migrate.

## Testing Versioned APIs

When testing the API, make sure to test all supported versions. The test suite should include tests for:

- The current stable version (v1)
- Any deprecated endpoints that are still supported
- Any new versions in development (e.g., v2)

## Documentation

API documentation should clearly indicate the version of each endpoint. The Swagger documentation at `/api/docs` includes information about all supported versions.