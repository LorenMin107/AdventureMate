import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/api';

/**
 * Custom hook for campground-related API calls
 * Provides functions for fetching, creating, updating, and deleting campgrounds
 */
const useCampgrounds = () => {
  const queryClient = useQueryClient();

  // Get all campgrounds
  const useAllCampgrounds = (options = {}) => {
    return useQuery({
      queryKey: ['campgrounds'],
      queryFn: async () => {
        const { data } = await apiClient.get('/campgrounds');
        // Check if the response is in the new standardized format
        if (data.status && data.data) {
          console.log('Received standardized API response:', data);
          return data.data; // Extract the actual data from the standardized response
        }
        return data;
      },
      ...options,
    });
  };

  // Get a single campground by ID
  const useCampground = (id, options = {}) => {
    return useQuery({
      queryKey: ['campgrounds', id],
      queryFn: async () => {
        const { data } = await apiClient.get(`/campgrounds/${id}`);
        // Check if the response is in the new standardized format
        if (data.status && data.data) {
          console.log(`Received standardized API response for campground ${id}:`, data);
          return data.data; // Extract the actual data from the standardized response
        }
        return data;
      },
      enabled: !!id, // Only run the query if an ID is provided
      ...options,
    });
  };

  // Create a new campground
  const useCreateCampground = () => {
    return useMutation({
      mutationFn: async (newCampground) => {
        const { data } = await apiClient.post('/campgrounds', newCampground);
        // Check if the response is in the new standardized format
        if (data.status && data.data) {
          console.log('Received standardized API response for create campground:', data);
          return data.data; // Extract the actual data from the standardized response
        }
        return data;
      },
      onSuccess: () => {
        // Invalidate the campgrounds query to refetch the list
        queryClient.invalidateQueries({ queryKey: ['campgrounds'] });
      },
    });
  };

  // Update an existing campground
  const useUpdateCampground = () => {
    return useMutation({
      mutationFn: async ({ id, campground }) => {
        const { data } = await apiClient.put(`/campgrounds/${id}`, campground);
        // Check if the response is in the new standardized format
        if (data.status && data.data) {
          console.log(`Received standardized API response for update campground ${id}:`, data);
          return data.data; // Extract the actual data from the standardized response
        }
        return data;
      },
      onSuccess: (_, variables) => {
        // Invalidate both the list and the specific campground
        queryClient.invalidateQueries({ queryKey: ['campgrounds'] });
        queryClient.invalidateQueries({ queryKey: ['campgrounds', variables.id] });
      },
    });
  };

  // Delete a campground
  const useDeleteCampground = () => {
    return useMutation({
      mutationFn: async (id) => {
        const { data } = await apiClient.delete(`/campgrounds/${id}`);
        // For delete operations, we just need to return the ID regardless of response format
        console.log(`Deleted campground ${id}, response:`, data);
        return id;
      },
      onSuccess: () => {
        // Invalidate the campgrounds query to refetch the list
        queryClient.invalidateQueries({ queryKey: ['campgrounds'] });
      },
    });
  };

  return {
    useAllCampgrounds,
    useCampground,
    useCreateCampground,
    useUpdateCampground,
    useDeleteCampground,
  };
};

export default useCampgrounds;
