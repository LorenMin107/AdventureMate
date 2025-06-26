import { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/api';

/**
 * Custom hook for making API calls with explicit loading and error states
 * This hook can be used as an alternative to React Query for simpler cases
 * or as a complement to demonstrate explicit state handling
 */
const useApi = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset states
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  // Generic fetch function
  const fetchData = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(url, options);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError({
        message: err.message || 'An error occurred',
        status: err.response?.status,
        details: err.response?.data
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generic post function
  const postData = useCallback(async (url, payload, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(url, payload, options);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError({
        message: err.message || 'An error occurred',
        status: err.response?.status,
        details: err.response?.data
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generic put function
  const putData = useCallback(async (url, payload, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.put(url, payload, options);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError({
        message: err.message || 'An error occurred',
        status: err.response?.status,
        details: err.response?.data
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generic patch function
  const patchData = useCallback(async (url, payload, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.patch(url, payload, options);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError({
        message: err.message || 'An error occurred',
        status: err.response?.status,
        details: err.response?.data
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generic delete function
  const deleteData = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.delete(url, options);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError({
        message: err.message || 'An error occurred',
        status: err.response?.status,
        details: err.response?.data
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    reset,
    fetchData,
    postData,
    putData,
    patchData,
    deleteData
  };
};

// Example usage with automatic data fetching
export const useFetch = (url, options = {}) => {
  const { fetchData, data, loading, error } = useApi();
  
  useEffect(() => {
    if (url) {
      fetchData(url, options);
    }
  }, [url, fetchData, options]);
  
  return { data, loading, error };
};

export default useApi;