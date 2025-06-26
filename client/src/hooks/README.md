# Data Fetching Hooks

This directory contains custom hooks for API calls using React Query for data fetching, caching, and synchronization.

## Overview

These hooks provide a clean and consistent way to interact with the API, handling loading and error states, and providing caching and synchronization features.

## Hooks

### `useCampgrounds`

Provides functions for fetching, creating, updating, and deleting campgrounds.

```jsx
import useCampgrounds from '../hooks/useCampgrounds';

// In your component
const { useAllCampgrounds, useCampground, useCreateCampground, useUpdateCampground, useDeleteCampground } = useCampgrounds();

// Get all campgrounds
const { data, isLoading, isError, error, refetch } = useAllCampgrounds();

// Get a single campground
const { data: campground } = useCampground(campgroundId);

// Create a campground
const { mutate: createCampground, isLoading: isCreating } = useCreateCampground();
createCampground(newCampgroundData);

// Update a campground
const { mutate: updateCampground } = useUpdateCampground();
updateCampground({ id: campgroundId, campground: updatedData });

// Delete a campground
const { mutate: deleteCampground } = useDeleteCampground();
deleteCampground(campgroundId);
```

### `useReviews`

Provides functions for fetching, creating, updating, and deleting reviews.

```jsx
import useReviews from '../hooks/useReviews';

// In your component
const { useCampgroundReviews, useReview, useCreateReview, useUpdateReview, useDeleteReview } = useReviews();

// Get reviews for a campground
const { data: reviews } = useCampgroundReviews(campgroundId);

// Create a review
const { mutate: createReview } = useCreateReview();
createReview({ campgroundId, review: newReviewData });
```

### `useBookings`

Provides functions for fetching, creating, updating, and deleting bookings.

```jsx
import useBookings from '../hooks/useBookings';

// In your component
const { useUserBookings, useCampgroundBookings, useBooking, useCreateBooking, useUpdateBooking, useCancelBooking, useDeleteBooking } = useBookings();

// Get user bookings
const { data: userBookings } = useUserBookings();

// Create a booking
const { mutate: createBooking } = useCreateBooking();
createBooking({ campgroundId, booking: newBookingData });
```

### `useUsers`

Provides functions for fetching, creating, updating, and managing users.

```jsx
import useUsers from '../hooks/useUsers';

// In your component
const { useCurrentUser, useUser, useAllUsers, useUpdateProfile, useUpdateUser, useDeleteUser, useRegister, useLogin, useLogout } = useUsers();

// Get current user
const { data: currentUser } = useCurrentUser();

// Login
const { mutate: login } = useLogin();
login({ email, password });
```

### `useApi`

A lower-level hook that provides explicit control over loading and error states.

```jsx
import useApi from '../hooks/useApi';

// In your component
const { data, loading, error, fetchData, postData } = useApi();

// Fetch data
const handleFetch = async () => {
  const result = await fetchData('/api/endpoint');
  if (result) {
    // Handle success
  }
};

// Or use the useFetch utility for automatic fetching
import { useFetch } from '../hooks/useApi';

const { data, loading, error } = useFetch('/api/endpoint');
```

## Loading and Error States

All hooks provide loading and error states that can be used to show loading indicators and error messages:

```jsx
// Example usage in a component
if (isLoading) {
  return <div>Loading...</div>;
}

if (isError) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={refetch}>Try Again</button>
    </div>
  );
}

// Now you can render your data
return <div>{data.map(item => <Item key={item.id} item={item} />)}</div>;
```

## Benefits of React Query

- **Caching**: Data is cached to avoid unnecessary network requests
- **Background Refetching**: Data can be refreshed in the background
- **Pagination and Infinite Scroll**: Built-in support for pagination
- **Prefetching**: Data can be prefetched for a smoother user experience
- **Optimistic Updates**: UI can be updated before the server responds
- **Retry Logic**: Failed requests can be retried automatically
- **Devtools**: Powerful devtools for debugging