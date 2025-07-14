import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/api';

// Get all bookings for the current user
export const useUserBookings = (options = {}) => {
  return useQuery({
    queryKey: ['bookings', 'user'],
    queryFn: async () => {
      const { data } = await apiClient.get('/bookings');
      return data;
    },
    ...options,
  });
};

// Get bookings for a specific campground
export const useCampgroundBookings = (campgroundId, options = {}) => {
  return useQuery({
    queryKey: ['bookings', 'campground', campgroundId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/campgrounds/${campgroundId}/bookings`);
      return data;
    },
    enabled: !!campgroundId, // Only run the query if a campground ID is provided
    ...options,
  });
};

// Get a single booking by ID
export const useBooking = (bookingId, options = {}) => {
  return useQuery({
    queryKey: ['bookings', bookingId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/bookings/${bookingId}`);
      return data;
    },
    enabled: !!bookingId, // Only run the query if a booking ID is provided
    ...options,
  });
};

// Create a new booking
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campgroundId, booking }) => {
      const { data } = await apiClient.post(`/campgrounds/${campgroundId}/bookings`, booking);
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate user bookings to refetch the list
      queryClient.invalidateQueries({ queryKey: ['bookings', 'user'] });
      // Invalidate campground bookings to refetch the list
      queryClient.invalidateQueries({
        queryKey: ['bookings', 'campground', variables.campgroundId],
      });
      // Also invalidate the campground query as availability might have changed
      queryClient.invalidateQueries({
        queryKey: ['campgrounds', variables.campgroundId],
      });
    },
  });
};

// Update an existing booking
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, booking }) => {
      const { data } = await apiClient.put(`/bookings/${bookingId}`, booking);
      return data;
    },
    onSuccess: (data) => {
      // Invalidate user bookings to refetch the list
      queryClient.invalidateQueries({ queryKey: ['bookings', 'user'] });
      // Invalidate the specific booking
      queryClient.invalidateQueries({ queryKey: ['bookings', data.id] });
      // Invalidate campground bookings to refetch the list
      if (data.campgroundId) {
        queryClient.invalidateQueries({
          queryKey: ['bookings', 'campground', data.campgroundId],
        });
        // Also invalidate the campground query as availability might have changed
        queryClient.invalidateQueries({
          queryKey: ['campgrounds', data.campgroundId],
        });
      }
    },
  });
};

// Cancel a booking
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId) => {
      const { data } = await apiClient.patch(`/bookings/${bookingId}/cancel`);
      return data;
    },
    onSuccess: (data) => {
      // Invalidate user bookings to refetch the list
      queryClient.invalidateQueries({ queryKey: ['bookings', 'user'] });
      // Invalidate the specific booking
      queryClient.invalidateQueries({ queryKey: ['bookings', data.id] });
      // Invalidate campground bookings to refetch the list
      if (data.campgroundId) {
        queryClient.invalidateQueries({
          queryKey: ['bookings', 'campground', data.campgroundId],
        });
        // Also invalidate the campground query as availability might have changed
        queryClient.invalidateQueries({
          queryKey: ['campgrounds', data.campgroundId],
        });
      }
    },
  });
};

// Delete a booking (admin only)
export const useDeleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId) => {
      // First get the booking to know its campgroundId
      const { data: booking } = await apiClient.get(`/bookings/${bookingId}`);
      await apiClient.delete(`/bookings/${bookingId}`);
      return booking;
    },
    onSuccess: (booking) => {
      // Invalidate user bookings to refetch the list
      queryClient.invalidateQueries({ queryKey: ['bookings', 'user'] });
      // Invalidate campground bookings to refetch the list
      if (booking.campgroundId) {
        queryClient.invalidateQueries({
          queryKey: ['bookings', 'campground', booking.campgroundId],
        });
        // Also invalidate the campground query as availability might have changed
        queryClient.invalidateQueries({
          queryKey: ['campgrounds', booking.campgroundId],
        });
      }
    },
  });
};

// Default export for backward compatibility
const useBookings = () => {
  return {
    useUserBookings,
    useCampgroundBookings,
    useBooking,
    useCreateBooking,
    useUpdateBooking,
    useCancelBooking,
    useDeleteBooking,
  };
};

export default useBookings;
