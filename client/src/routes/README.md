# React Router Setup

This directory contains the routing configuration for the AdventureMate application.

## Overview

The routing system is built using React Router v6 and includes:

- Declarative route configuration
- Nested routes for better organization
- Protected routes for authenticated users
- Admin-only routes
- Error boundaries for graceful error handling
- 404 page for non-existent routes
- Code splitting with lazy loading for better performance

## Route Structure

The application has the following route structure:

```
/ (MainLayout)
├── / (HomePage)
├── /login (LoginForm)
├── /register (RegisterForm)
├── /campgrounds (Protected)
│   ├── / (CampgroundsPage)
│   ├── /new (CampgroundNewPage)
│   ├── /:id (CampgroundDetailPage)
│   └── /:id/edit (CampgroundEditPage)
├── /profile (Protected - User Profile)
├── /bookings (Protected - User Bookings)
├── /admin (Protected, Admin only)
│   ├── / (AdminDashboard)
│   ├── /users (UserList)
│   │   └── /:id (UserDetail)
│   ├── /campgrounds (CampgroundList)
│   └── /bookings (Admin Bookings)
└── * (NotFoundPage - 404)
```

## Key Components

### MainLayout

The `MainLayout` component serves as the root layout for all pages, providing consistent header and footer across the application.

### ProtectedRoute

The `ProtectedRoute` component ensures that certain routes are only accessible to authenticated users. It can also restrict access to admin users only.

### ErrorBoundary

The `ErrorBoundary` component catches errors during rendering and displays a user-friendly error page instead of crashing the application.

### NotFoundPage

The `NotFoundPage` component is displayed when a user navigates to a route that doesn't exist.

### LoadingFallback

The `LoadingFallback` component is displayed while lazy-loaded components are being loaded.

## Code Splitting

The application uses React's `lazy` and `Suspense` to implement code splitting, which improves performance by only loading the code needed for the current route.

## Usage

The routing configuration is defined in `index.js` and used in the main `App` component with the `useRoutes` hook:

```jsx
// In App.jsx
import { useRoutes } from 'react-router-dom';
import routes from './routes';

function App() {
  const routeElement = useRoutes(routes);

  return <div className="App">{routeElement}</div>;
}
```

## Adding New Routes

To add a new route:

1. Create the component for the route
2. Import it in the routes configuration (or use lazy loading)
3. Add it to the appropriate place in the route hierarchy

For protected routes, place them inside a route with a `ProtectedRoute` element.

## Error Handling

Errors in the routing system are caught by the `ErrorBoundary` component, which displays a user-friendly error page with information about the error.
