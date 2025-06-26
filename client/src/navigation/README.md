# Navigation System

This directory contains documentation for the navigation system in the MyanCamp application.

## Overview

The navigation system includes:

1. **Client-side Navigation**: Using React Router for fast, seamless page transitions
2. **Breadcrumbs**: For complex navigation paths
3. **Route Transitions/Animations**: Smooth animations between page changes

## Components

### Header

The `Header` component (`/components/Header.jsx`) provides the main navigation bar with:

- Active link indicators
- Conditional rendering based on authentication status
- Links to key sections of the application

```jsx
// Example usage of NavLink for active link indicators
<NavLink 
  to="/campgrounds" 
  className={({ isActive }) => 
    isActive ? "nav-link active" : "nav-link"
  }
>
  Campgrounds
</NavLink>
```

### Breadcrumbs

The `Breadcrumbs` component (`/components/Breadcrumbs.jsx`) automatically generates breadcrumb navigation based on the current route:

- Shows the navigation path from home to the current page
- Automatically formats route segments for display
- Handles special cases like IDs, "edit", and "new"

```jsx
// Example breadcrumb trail for /campgrounds/123/edit
Home > Campgrounds > Details > Edit
```

### PageTransition

The `PageTransition` component (`/components/PageTransition.jsx`) adds smooth animations between route changes:

- Different animations for different routes
- Fade and slide effects
- Customizable timing and easing

## Usage

### Basic Navigation

Use `Link` or `NavLink` from React Router for client-side navigation:

```jsx
import { Link, NavLink } from 'react-router-dom';

// Simple link
<Link to="/campgrounds">Campgrounds</Link>

// Link with active state
<NavLink 
  to="/campgrounds"
  className={({ isActive }) => isActive ? "active" : ""}
>
  Campgrounds
</NavLink>
```

### Programmatic Navigation

Use the `useNavigate` hook for programmatic navigation:

```jsx
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();
  
  const handleSubmit = async (data) => {
    // Save data
    await saveData(data);
    
    // Navigate to another page
    navigate('/success');
  };
  
  return (
    <button onClick={() => navigate(-1)}>Go Back</button>
  );
};
```

### Accessing Route Parameters

Use the `useParams` hook to access route parameters:

```jsx
import { useParams } from 'react-router-dom';

const CampgroundDetail = () => {
  const { id } = useParams();
  
  // Use the ID to fetch data
  const { data } = useCampground(id);
  
  return <div>{data.name}</div>;
};
```

## Customization

### Adding New Routes

1. Create the component for the new route
2. Add the route to the route configuration in `/routes/index.jsx`
3. For protected routes, place them inside a route with a `ProtectedRoute` element

### Customizing Transitions

To customize transitions for specific routes, modify the `PageTransition.css` file:

```css
/* Example: Custom animation for a specific route */
[data-route-pattern="/bookings"] .page-enter {
  transform: translateY(50px);
}

[data-route-pattern="/bookings"] .page-enter-active {
  transform: translateY(0);
}
```

## Best Practices

1. **Use NavLink for navigation items**: This provides automatic active state styling
2. **Keep breadcrumbs consistent**: Always include breadcrumbs for nested routes
3. **Use descriptive route names**: Make URLs descriptive and user-friendly
4. **Handle loading states**: Show loading indicators during navigation
5. **Preserve scroll position**: Reset scroll to top on navigation when appropriate