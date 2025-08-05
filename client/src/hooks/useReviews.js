import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/api';

/**
 * Custom hook for review-related API calls
 * Provides functions for fetching, creating, updating, and deleting reviews
 */
const useReviews = () => {
  const queryClient = useQueryClient();

  // Get reviews for a specific campground
  const useCampgroundReviews = (campgroundId, options = {}) => {
    return useQuery({
      queryKey: ['reviews', 'campground', campgroundId],
      queryFn: async () => {
        const { data } = await apiClient.get(`/campgrounds/${campgroundId}/reviews`);
        return data;
      },
      enabled: !!campgroundId, // Only run the query if a campground ID is provided
      ...options,
    });
  };

  // Get a single review by ID
  const useReview = (campgroundId, reviewId, options = {}) => {
    return useQuery({
      queryKey: ['reviews', campgroundId, reviewId],
      queryFn: async () => {
        const { data } = await apiClient.get(`/campgrounds/${campgroundId}/reviews/${reviewId}`);
        return data;
      },
      enabled: !!campgroundId && !!reviewId, // Only run the query if both IDs are provided
      ...options,
    });
  };

  // Create a new review for a campground
  const useCreateReview = () => {
    return useMutation({
      mutationFn: async ({ campgroundId, review }) => {
        const { data } = await apiClient.post(`/campgrounds/${campgroundId}/reviews`, review);
        return data;
      },
      onSuccess: (_, variables) => {
        // Invalidate the reviews query for this campground to refetch the list
        queryClient.invalidateQueries({
          queryKey: ['reviews', 'campground', variables.campgroundId],
        });
        // Also invalidate the campground query as it might display review stats
        queryClient.invalidateQueries({
          queryKey: ['campgrounds', variables.campgroundId],
        });
      },
    });
  };

  // Update an existing review
  const useUpdateReview = () => {
    return useMutation({
      mutationFn: async ({ campgroundId, reviewId, review }) => {
        const { data } = await apiClient.put(
          `/campgrounds/${campgroundId}/reviews/${reviewId}`,
          review
        );
        return data;
      },
      onSuccess: (_, variables) => {
        // Invalidate both the reviews list and the specific review
        queryClient.invalidateQueries({
          queryKey: ['reviews', 'campground', variables.campgroundId],
        });
        queryClient.invalidateQueries({
          queryKey: ['reviews', variables.campgroundId, variables.reviewId],
        });
        // Also invalidate the campground query as it might display review stats
        queryClient.invalidateQueries({
          queryKey: ['campgrounds', variables.campgroundId],
        });
      },
    });
  };

  // Delete a review
  const useDeleteReview = () => {
    return useMutation({
      mutationFn: async ({ campgroundId, reviewId }) => {
        await apiClient.delete(`/campgrounds/${campgroundId}/reviews/${reviewId}`);
        return { campgroundId, reviewId };
      },
      onSuccess: (_, variables) => {
        // Invalidate the reviews query for this campground to refetch the list
        queryClient.invalidateQueries({
          queryKey: ['reviews', 'campground', variables.campgroundId],
        });
        // Also invalidate the campground query as it might display review stats
        queryClient.invalidateQueries({
          queryKey: ['campgrounds', variables.campgroundId],
        });
      },
    });
  };

  return {
    useCampgroundReviews,
    useReview,
    useCreateReview,
    useUpdateReview,
    useDeleteReview,
  };
};

export default useReviews;
