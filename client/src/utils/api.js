import axios from 'axios';
import { logInfo, logError } from './logger';

// Create a base API instance with common configuration
const api = axios.create({
  baseURL: '/api/v1', // API is served from the same domain under /api/v1
  // Removed default Content-Type header to allow axios to set it automatically for FormData
  // Removed withCredentials setting as we're using JWT exclusively now
});

// Request interceptor for adding auth token if needed and setting appropriate Content-Type
api.interceptors.request.use(
  (config) => {
    // Add JWT token to Authorization header if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set Content-Type to application/json only if the data is not FormData
    // This allows axios to automatically set the correct Content-Type for FormData
    if (config.data && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle common errors
    const { response, config } = error;
    const originalRequest = config;

    // Handle rate limiting with exponential backoff
    if (response && response.status === 429 && !originalRequest._rateLimit) {
      // Get retry count or initialize it
      originalRequest._retryCount = originalRequest._retryCount || 0;

      // Only retry up to 3 times
      if (originalRequest._retryCount < 3) {
        originalRequest._rateLimit = true;
        originalRequest._retryCount += 1;

        // Calculate exponential backoff delay: 2^retry * 1000ms + random jitter
        const delay = Math.pow(2, originalRequest._retryCount) * 1000 + Math.random() * 1000;
        logInfo(`Rate limit exceeded. Retrying after ${Math.round(delay / 1000)} seconds...`);

        // Wait for the calculated delay
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry the request
        return axios(originalRequest);
      } else {
        logError('Rate limit exceeded. Maximum retries reached.');
        // Store the current URL to redirect back after login
        if (window.location.pathname !== '/login') {
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        }
      }
    }

    // Handle token expiration and refresh
    if (response && response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshResponse = await axios.post('/api/v1/auth/refresh-token', {
            token: refreshToken,
          });

          if (refreshResponse.data && refreshResponse.data.accessToken) {
            // Store the new access token
            localStorage.setItem('accessToken', refreshResponse.data.accessToken);

            // Update the Authorization header with the new token
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;

            // Retry the original request with the new token
            return axios(originalRequest);
          }
        }

        // If refresh token is missing or refresh fails, redirect to login
        logError('Authentication expired. Please log in again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Store the current URL to redirect back after login
        if (window.location.pathname !== '/login') {
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        }
        window.location.href = '/login';
      } catch (refreshError) {
        logError('Failed to refresh authentication token', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Store the current URL to redirect back after login
        if (window.location.pathname !== '/login') {
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        }
        window.location.href = '/login';
      }
    }

    if (response && response.status === 404) {
      logError('Resource not found.');
    }

    if (response && response.status >= 500) {
      logError('Server error. Please try again later.');
    }

    if (!response) {
      logError('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Helper methods for common API operations
const apiClient = {
  // GET request
  get: async (url, config = {}) => {
    return api.get(url, config);
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    return api.post(url, data, config);
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    return api.put(url, data, config);
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    return api.patch(url, data, config);
  },

  // DELETE request
  delete: async (url, config = {}) => {
    return api.delete(url, config);
  },
};

export default apiClient;
