# API Routes

This directory contains the API routes for the AdventureMate application.

## Directory Structure

- `routes/api/v1/`: Contains the current stable version (v1) of the API routes.
- `routes/api/`: Previously contained the legacy (unversioned) API routes, which have been removed as part of the JWT migration cleanup.

## Versioning Strategy

AdventureMate uses URL path versioning for its API. This means that the version is specified in the URL path, e.g., `/api/v1/campgrounds`.

For more information about the API versioning strategy, see [docs/api-versioning.md](../../docs/api-versioning.md).

## Adding New Routes

When adding new routes to the API:

1. Always add them to the latest version directory (currently `routes/api/v1/`).
2. Update the appropriate index.js file to include the new routes.
3. Update the API documentation to reflect the new routes.

## Deprecating Routes

As part of the JWT migration cleanup, all legacy API routes have been removed. When deprecating routes in the future:

1. Add a deprecation notice using the `deprecateEndpoint` middleware from `middleware/apiVersioning.js`.
2. Update the API documentation to indicate that the route is deprecated.
3. Provide information about the alternative route to use.
4. Plan for the eventual removal of the deprecated route.

## Example

Here's an example of how to add a new route to the v1 API:

```javascript
// routes/api/v1/example.js
const express = require('express');
const router = express.Router();
const examples = require('../../../controllers/api/examples');
const catchAsync = require('../../../utils/catchAsync');
const { isLoggedInApi } = require('../../../middleware');

// Get all examples
router.get('/', catchAsync(examples.index));

// Get a specific example
router.get('/:id', catchAsync(examples.showExample));

module.exports = router;
```

Then, in `routes/api/v1/index.js`:

```javascript
// Import the new route file
const exampleRoutes = require('./example');

// Mount the new routes
router.use('/examples', exampleRoutes);
```

## Testing

When testing API routes, make sure to test the current stable version (v1) of the API.

## Documentation

API documentation is available at `/api/docs`. This documentation is generated from the Swagger configuration in `docs/swagger.json`.
