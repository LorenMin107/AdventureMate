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
        await apiClient.delete(`/campgrounds/${id}`);
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