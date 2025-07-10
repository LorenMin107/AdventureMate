import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/api';

/**
 * Custom hook for fetching weather data
 * @param {Object} coordinates - Object containing lat and lng
 * @param {number} coordinates.lat - Latitude
 * @param {number} coordinates.lng - Longitude
 * @param {boolean} enabled - Whether the query should be enabled
 * @returns {Object} React Query result object
 */
export const useWeather = (coordinates, enabled = true) => {
  return useQuery({
    queryKey: ['weather', coordinates?.lat, coordinates?.lng],
    queryFn: async () => {
      if (!coordinates?.lat || !coordinates?.lng) {
        throw new Error('Latitude and longitude are required');
      }

      // FIX: Use relative path, since baseURL is already /api/v1
      const response = await apiClient.get('/weather', {
        params: {
          lat: coordinates.lat,
          lng: coordinates.lng,
        },
      });

      return response.data.data;
    },
    enabled: enabled && !!coordinates?.lat && !!coordinates?.lng,
    staleTime: 15 * 60 * 1000, // 15 minutes - matches backend cache
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
