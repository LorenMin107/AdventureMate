import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/api';

/**
 * Custom hook for search suggestions and autocomplete
 * @param {string} query - Search query
 * @param {Object} options - Query options
 * @returns {Object} - Query result with suggestions data
 */
const useSearchSuggestions = (query, options = {}) => {
  return useQuery({
    queryKey: ['searchSuggestions', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return { suggestions: [], popularTerms: [] };
      }

      try {
        const { data } = await apiClient.get('/campgrounds/suggestions', {
          params: { q: query.trim(), limit: 10 },
        });

        // Handle both ApiResponse format and direct data
        const result = data.status && data.data ? data.data : data;

        // Ensure we always return the expected structure
        return {
          suggestions: result.suggestions || [],
          popularTerms: result.popularTerms || [],
          searchTerm: result.searchTerm || query,
        };
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        // Return empty results on error instead of throwing
        return { suggestions: [], popularTerms: [], searchTerm: query };
      }
    },
    enabled: !!query && query.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once on failure
    ...options,
  });
};

export default useSearchSuggestions;
