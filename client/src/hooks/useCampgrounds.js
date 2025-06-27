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
        try {
          const { data } = await apiClient.get('/campgrounds');
          // Check if the response is in the new standardized format
          if (data.status && data.data) {
            console.log('Received standardized API response:', data);
            return data.data; // Extract the actual data from the standardized response
          }
          return data;
        } catch (error) {
          console.error('Error fetching campgrounds from /campgrounds:', error);
          // Fallback to versioned API endpoint
          try {
            const { data } = await apiClient.get('/v1/campgrounds');
            // Check if the response is in the new standardized format
            if (data.status && data.data) {
              console.log('Received standardized API response from v1:', data);
              return data.data; // Extract the actual data from the standardized response
            }
            return data;
          } catch (fallbackError) {
            console.error('Error fetching campgrounds from /v1/campgrounds:', fallbackError);
            throw fallbackError;
          }
        }
      },
      ...options,
    });
  };

  // Get a single campground by ID
  const useCampground = (id, options = {}) => {
    return useQuery({
      queryKey: ['campgrounds', id],
      queryFn: async () => {
        try {
          const { data } = await apiClient.get(`/campgrounds/${id}`);
          // Check if the response is in the new standardized format
          if (data.status && data.data) {
            console.log(`Received standardized API response for campground ${id}:`, data);
            return data.data; // Extract the actual data from the standardized response
          }
          return data;
        } catch (error) {
          console.error(`Error fetching campground from /campgrounds/${id}:`, error);
          // Fallback to versioned API endpoint
          try {
            const { data } = await apiClient.get(`/v1/campgrounds/${id}`);
            // Check if the response is in the new standardized format
            if (data.status && data.data) {
              console.log(`Received standardized API response for campground ${id} from v1:`, data);
              return data.data; // Extract the actual data from the standardized response
            }
            return data;
          } catch (fallbackError) {
            console.error(`Error fetching campground from /v1/campgrounds/${id}:`, fallbackError);
            throw fallbackError;
          }
        }
      },
      enabled: !!id, // Only run the query if an ID is provided
      ...options,
    });
  };

  // Create a new campground
  const useCreateCampground = () => {
    return useMutation({
      mutationFn: async (newCampground) => {
        try {
          const { data } = await apiClient.post('/campgrounds', newCampground);
          // Check if the response is in the new standardized format
          if (data.status && data.data) {
            console.log('Received standardized API response for create campground:', data);
            return data.data; // Extract the actual data from the standardized response
          }
          return data;
        } catch (error) {
          console.error('Error creating campground at /campgrounds:', error);
          // Fallback to versioned API endpoint
          try {
            const { data } = await apiClient.post('/v1/campgrounds', newCampground);
            // Check if the response is in the new standardized format
            if (data.status && data.data) {
              console.log('Received standardized API response for create campground from v1:', data);
              return data.data; // Extract the actual data from the standardized response
            }
            return data;
          } catch (fallbackError) {
            console.error('Error creating campground at /v1/campgrounds:', fallbackError);
            throw fallbackError;
          }
        }
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
        try {
          const { data } = await apiClient.put(`/campgrounds/${id}`, campground);
          // Check if the response is in the new standardized format
          if (data.status && data.data) {
            console.log(`Received standardized API response for update campground ${id}:`, data);
            return data.data; // Extract the actual data from the standardized response
          }
          return data;
        } catch (error) {
          console.error(`Error updating campground at /campgrounds/${id}:`, error);
          // Fallback to versioned API endpoint
          try {
            const { data } = await apiClient.put(`/v1/campgrounds/${id}`, campground);
            // Check if the response is in the new standardized format
            if (data.status && data.data) {
              console.log(`Received standardized API response for update campground ${id} from v1:`, data);
              return data.data; // Extract the actual data from the standardized response
            }
            return data;
          } catch (fallbackError) {
            console.error(`Error updating campground at /v1/campgrounds/${id}:`, fallbackError);
            throw fallbackError;
          }
        }
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
        try {
          const { data } = await apiClient.delete(`/campgrounds/${id}`);
          // For delete operations, we just need to return the ID regardless of response format
          console.log(`Deleted campground ${id}, response:`, data);
          return id;
        } catch (error) {
          console.error(`Error deleting campground at /campgrounds/${id}:`, error);
          // Fallback to versioned API endpoint
          try {
            const { data } = await apiClient.delete(`/v1/campgrounds/${id}`);
            console.log(`Deleted campground ${id} from v1, response:`, data);
            return id;
          } catch (fallbackError) {
            console.error(`Error deleting campground at /v1/campgrounds/${id}:`, fallbackError);
            throw fallbackError;
          }
        }
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
