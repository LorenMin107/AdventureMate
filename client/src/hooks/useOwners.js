import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/api';

/**
 * Custom hook for owner-related API calls
 * Provides functions for owner registration, profile management, and dashboard data
 */
const useOwners = () => {
  const queryClient = useQueryClient();

  // Apply to become an owner
  const useApplyToBeOwner = () => {
    return useMutation({
      mutationFn: async (applicationData) => {
        const { data } = await apiClient.post('/owners/apply', applicationData);
        return data;
      },
      onSuccess: () => {
        // Invalidate auth queries to refresh user data
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
      },
    });
  };

  // Register as an owner (for admin use)
  const useRegisterOwner = () => {
    return useMutation({
      mutationFn: async (ownerData) => {
        const { data } = await apiClient.post('/owners/register', ownerData);
        return data;
      },
      onSuccess: () => {
        // Invalidate auth queries to refresh user data
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
      },
    });
  };

  // Get owner profile
  const useOwnerProfile = (options = {}) => {
    return useQuery({
      queryKey: ['owner', 'profile'],
      queryFn: async () => {
        const { data } = await apiClient.get('/owners/profile');
        return data.owner;
      },
      ...options,
    });
  };

  // Update owner profile
  const useUpdateOwnerProfile = () => {
    return useMutation({
      mutationFn: async (profileData) => {
        const { data } = await apiClient.put('/owners/profile', profileData);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['owner', 'profile'] });
      },
    });
  };

  // Upload verification documents
  const useUploadVerificationDocuments = () => {
    return useMutation({
      mutationFn: async ({ files, type, description }) => {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('documents', file);
        });
        formData.append('type', type);
        if (description) {
          formData.append('description', description);
        }

        const { data } = await apiClient.post('/owners/verification/documents', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['owner', 'profile'] });
      },
    });
  };

  // Get owner dashboard data
  const useOwnerDashboard = (options = {}) => {
    return useQuery({
      queryKey: ['owner', 'dashboard'],
      queryFn: async () => {
        const { data } = await apiClient.get('/owners/dashboard');
        return data;
      },
      ...options,
    });
  };

  // Get owner analytics
  const useOwnerAnalytics = (params = {}, options = {}) => {
    const { period = '30d', campground } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('period', period);
    if (campground) {
      queryParams.append('campgroundId', campground);
    }

    return useQuery({
      queryKey: ['owner', 'analytics', period, campground],
      queryFn: async () => {
        const { data } = await apiClient.get(`/owners/analytics?${queryParams}`);
        return data;
      },
      ...options,
    });
  };

  // Get owner bookings
  const useOwnerBookings = (filters = {}, options = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    return useQuery({
      queryKey: ['owner', 'bookings', filters],
      queryFn: async () => {
        const { data } = await apiClient.get(`/owners/bookings?${queryParams}`);
        return data;
      },
      ...options,
    });
  };

  // Get owner campgrounds
  const useOwnerCampgrounds = (filters = {}, options = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    return useQuery({
      queryKey: ['owner', 'campgrounds', filters],
      queryFn: async () => {
        const { data } = await apiClient.get(`/owners/campgrounds?${queryParams}`);
        return data;
      },
      ...options,
    });
  };

  // Create campground
  const useCreateCampground = () => {
    return useMutation({
      mutationFn: async (campgroundData) => {
        const formData = new FormData();

        // Add text fields
        Object.entries(campgroundData).forEach(([key, value]) => {
          if (key !== 'images') {
            formData.append(key, value);
          }
        });

        // Add images
        if (campgroundData.images) {
          campgroundData.images.forEach((image) => {
            formData.append('images', image);
          });
        }

        const { data } = await apiClient.post('/owners/campgrounds', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['owner', 'campgrounds'] });
        queryClient.invalidateQueries({ queryKey: ['owner', 'dashboard'] });
      },
    });
  };

  // Update campground
  const useUpdateCampground = () => {
    return useMutation({
      mutationFn: async ({ id, campgroundData }) => {
        const formData = new FormData();

        // Add text fields
        Object.entries(campgroundData).forEach(([key, value]) => {
          if (key !== 'images' && key !== 'deleteImages') {
            formData.append(key, value);
          }
        });

        // Add new images
        if (campgroundData.images) {
          campgroundData.images.forEach((image) => {
            formData.append('images', image);
          });
        }

        // Add images to delete
        if (campgroundData.deleteImages) {
          campgroundData.deleteImages.forEach((filename) => {
            formData.append('deleteImages', filename);
          });
        }

        const { data } = await apiClient.put(`/owners/campgrounds/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['owner', 'campgrounds'] });
        queryClient.invalidateQueries({ queryKey: ['owner', 'campground', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['owner', 'dashboard'] });
      },
    });
  };

  // Delete campground
  const useDeleteCampground = () => {
    return useMutation({
      mutationFn: async (id) => {
        const { data } = await apiClient.delete(`/owners/campgrounds/${id}`);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['owner', 'campgrounds'] });
        queryClient.invalidateQueries({ queryKey: ['owner', 'dashboard'] });
      },
    });
  };

  // Get specific campground
  const useOwnerCampground = (id, options = {}) => {
    return useQuery({
      queryKey: ['owner', 'campground', id],
      queryFn: async () => {
        const { data } = await apiClient.get(`/owners/campgrounds/${id}`);
        return data;
      },
      enabled: !!id,
      ...options,
    });
  };

  // Get campground bookings
  const useCampgroundBookings = (campgroundId, filters = {}, options = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    return useQuery({
      queryKey: ['owner', 'campground', campgroundId, 'bookings', filters],
      queryFn: async () => {
        const { data } = await apiClient.get(
          `/owners/campgrounds/${campgroundId}/bookings?${queryParams}`
        );
        return data;
      },
      enabled: !!campgroundId,
      ...options,
    });
  };

  // Update booking status
  const useUpdateBookingStatus = () => {
    return useMutation({
      mutationFn: async ({ campgroundId, bookingId, status }) => {
        const { data } = await apiClient.patch(
          `/owners/campgrounds/${campgroundId}/bookings/${bookingId}`,
          { status }
        );
        return data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['owner', 'bookings'] });
        queryClient.invalidateQueries({
          queryKey: ['owner', 'campground', variables.campgroundId, 'bookings'],
        });
        queryClient.invalidateQueries({ queryKey: ['owner', 'dashboard'] });
      },
    });
  };

  return {
    useApplyToBeOwner,
    useRegisterOwner,
    useOwnerProfile,
    useUpdateOwnerProfile,
    useUploadVerificationDocuments,
    useOwnerDashboard,
    useOwnerAnalytics,
    useOwnerBookings,
    useOwnerCampgrounds,
    useCreateCampground,
    useUpdateCampground,
    useDeleteCampground,
    useOwnerCampground,
    useCampgroundBookings,
    useUpdateBookingStatus,
  };
};

export default useOwners;
