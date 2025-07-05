import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/api';

/**
 * Custom hook for user-related API calls
 * Provides functions for fetching, creating, updating, and managing users
 */
const useUsers = () => {
  const queryClient = useQueryClient();

  // Get the current user's profile
  const useCurrentUser = (options = {}) => {
    return useQuery({
      queryKey: ['users', 'current'],
      queryFn: async () => {
        const { data } = await apiClient.get('/users/profile');
        return data;
      },
      ...options,
    });
  };

  // Get a user by ID (admin only)
  const useUser = (userId, options = {}) => {
    return useQuery({
      queryKey: ['users', userId],
      queryFn: async () => {
        const { data } = await apiClient.get(`/users/${userId}`);
        return data;
      },
      enabled: !!userId, // Only run the query if a user ID is provided
      ...options,
    });
  };

  // Get all users (admin only)
  const useAllUsers = (options = {}) => {
    return useQuery({
      queryKey: ['users'],
      queryFn: async () => {
        const { data } = await apiClient.get('/admin/users');
        return data;
      },
      ...options,
    });
  };

  // Update the current user's profile
  const useUpdateProfile = () => {
    return useMutation({
      mutationFn: async (userData) => {
        const { data } = await apiClient.put('/users/profile', userData);
        return data;
      },
      onSuccess: () => {
        // Invalidate the current user query to refetch the profile
        queryClient.invalidateQueries({ queryKey: ['users', 'current'] });
      },
    });
  };

  // Update a user (admin only)
  const useUpdateUser = () => {
    return useMutation({
      mutationFn: async ({ userId, userData }) => {
        const { data } = await apiClient.put(`/users/${userId}`, userData);
        return data;
      },
      onSuccess: (_, variables) => {
        // Invalidate both the users list and the specific user
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
      },
    });
  };

  // Delete a user (admin only)
  const useDeleteUser = () => {
    return useMutation({
      mutationFn: async (userId) => {
        await apiClient.delete(`/users/${userId}`);
        return userId;
      },
      onSuccess: () => {
        // Invalidate the users list to refetch
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
    });
  };

  // Register a new user
  const useRegister = () => {
    return useMutation({
      mutationFn: async (userData) => {
        const { data } = await apiClient.post('/users/register', userData);
        return data;
      },
    });
  };

  // Login a user
  const useLogin = () => {
    return useMutation({
      mutationFn: async (credentials) => {
        const { data } = await apiClient.post('/users/login', credentials);
        return data;
      },
      onSuccess: () => {
        // Invalidate the current user query to fetch the new user profile
        queryClient.invalidateQueries({ queryKey: ['users', 'current'] });
      },
    });
  };

  // Logout the current user
  const useLogout = () => {
    return useMutation({
      mutationFn: async () => {
        const { data } = await apiClient.post('/users/logout');
        return data;
      },
      onSuccess: () => {
        // Invalidate the current user query
        queryClient.invalidateQueries({ queryKey: ['users', 'current'] });
        // Optionally, invalidate all queries to clear the cache
        // queryClient.clear();
      },
    });
  };

  return {
    useCurrentUser,
    useUser,
    useAllUsers,
    useUpdateProfile,
    useUpdateUser,
    useDeleteUser,
    useRegister,
    useLogin,
    useLogout,
  };
};

export default useUsers;
