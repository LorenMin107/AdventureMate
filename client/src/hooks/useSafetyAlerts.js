import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/api';

/**
 * Custom hook for safety alert-related API calls
 * Provides functions for fetching, creating, updating, and deleting safety alerts
 */
const useSafetyAlerts = () => {
  const queryClient = useQueryClient();

  // Get all safety alerts for a specific campground
  const useCampgroundSafetyAlerts = (campgroundId, options = {}) => {
    return useQuery({
      queryKey: ['safetyAlerts', 'campground', campgroundId],
      queryFn: async () => {
        const { data } = await apiClient.get(`/campgrounds/${campgroundId}/safety-alerts`);
        return data;
      },
      enabled: !!campgroundId, // Only run the query if a campground ID is provided
      ...options,
    });
  };

  // Get active safety alerts for a specific campground
  const useActiveSafetyAlerts = (campgroundId, options = {}) => {
    return useQuery({
      queryKey: ['safetyAlerts', 'campground', campgroundId, 'active'],
      queryFn: async () => {
        const { data } = await apiClient.get(`/campgrounds/${campgroundId}/safety-alerts/active`);
        return data;
      },
      enabled: !!campgroundId, // Only run the query if a campground ID is provided
      ...options,
    });
  };

  // Get a single safety alert by ID
  const useSafetyAlert = (campgroundId, alertId, options = {}) => {
    return useQuery({
      queryKey: ['safetyAlerts', campgroundId, alertId],
      queryFn: async () => {
        const { data } = await apiClient.get(
          `/campgrounds/${campgroundId}/safety-alerts/${alertId}`
        );
        return data;
      },
      enabled: !!campgroundId && !!alertId, // Only run the query if both IDs are provided
      ...options,
    });
  };

  // Create a new safety alert for a campground
  const useCreateSafetyAlert = () => {
    return useMutation({
      mutationFn: async ({ campgroundId, alert }) => {
        const { data } = await apiClient.post(`/campgrounds/${campgroundId}/safety-alerts`, alert);
        return data;
      },
      onSuccess: (_, variables) => {
        // Invalidate the safety alerts queries for this campground to refetch the list
        queryClient.invalidateQueries({
          queryKey: ['safetyAlerts', 'campground', variables.campgroundId],
        });
        queryClient.invalidateQueries({
          queryKey: ['safetyAlerts', 'campground', variables.campgroundId, 'active'],
        });
        // Also invalidate the campground query as it might display alert stats
        queryClient.invalidateQueries({
          queryKey: ['campgrounds', variables.campgroundId],
        });
      },
    });
  };

  // Update an existing safety alert
  const useUpdateSafetyAlert = () => {
    return useMutation({
      mutationFn: async ({ campgroundId, alertId, alert }) => {
        const { data } = await apiClient.put(
          `/campgrounds/${campgroundId}/safety-alerts/${alertId}`,
          alert
        );
        return data;
      },
      onSuccess: (_, variables) => {
        // Invalidate both the safety alerts list and the specific alert
        queryClient.invalidateQueries({
          queryKey: ['safetyAlerts', 'campground', variables.campgroundId],
        });
        queryClient.invalidateQueries({
          queryKey: ['safetyAlerts', 'campground', variables.campgroundId, 'active'],
        });
        queryClient.invalidateQueries({
          queryKey: ['safetyAlerts', variables.campgroundId, variables.alertId],
        });
        // Also invalidate the campground query as it might display alert stats
        queryClient.invalidateQueries({
          queryKey: ['campgrounds', variables.campgroundId],
        });
      },
    });
  };

  // Delete a safety alert
  const useDeleteSafetyAlert = () => {
    return useMutation({
      mutationFn: async ({ campgroundId, alertId }) => {
        await apiClient.delete(`/campgrounds/${campgroundId}/safety-alerts/${alertId}`);
        return { campgroundId, alertId };
      },
      onSuccess: (_, variables) => {
        // Invalidate the safety alerts queries for this campground to refetch the list
        queryClient.invalidateQueries({
          queryKey: ['safetyAlerts', 'campground', variables.campgroundId],
        });
        queryClient.invalidateQueries({
          queryKey: ['safetyAlerts', 'campground', variables.campgroundId, 'active'],
        });
        // Also invalidate the campground query as it might display alert stats
        queryClient.invalidateQueries({
          queryKey: ['campgrounds', variables.campgroundId],
        });
      },
    });
  };

  // Acknowledge a safety alert
  const useAcknowledgeSafetyAlert = () => {
    return useMutation({
      mutationFn: async ({ campgroundId, alertId }) => {
        const { data } = await apiClient.post(
          `/campgrounds/${campgroundId}/safety-alerts/${alertId}/acknowledge`
        );
        return data;
      },
      onSuccess: (_, variables) => {
        // Invalidate the safety alerts queries for this campground to refetch the list
        queryClient.invalidateQueries({
          queryKey: ['safetyAlerts', 'campground', variables.campgroundId],
        });
        queryClient.invalidateQueries({
          queryKey: ['safetyAlerts', 'campground', variables.campgroundId, 'active'],
        });
        // Also invalidate the specific alert
        queryClient.invalidateQueries({
          queryKey: ['safetyAlerts', variables.campgroundId, variables.alertId],
        });
      },
    });
  };

  return {
    useCampgroundSafetyAlerts,
    useActiveSafetyAlerts,
    useSafetyAlert,
    useCreateSafetyAlert,
    useUpdateSafetyAlert,
    useDeleteSafetyAlert,
    useAcknowledgeSafetyAlert,
  };
};

export default useSafetyAlerts;
