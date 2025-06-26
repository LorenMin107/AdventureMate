import axios from 'axios';

// Create a base API instance with common configuration
const api = axios.create({
  baseURL: '/api', // Assuming the API is served from the same domain under /api
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests for authentication
});

// Request interceptor for adding auth token if needed
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if using JWT
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    const { response } = error;
    
    if (response && response.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      console.error('Unauthorized access. Please log in.');
      // You might want to redirect to login page or dispatch an action
    }
    
    if (response && response.status === 404) {
      console.error('Resource not found.');
    }
    
    if (response && response.status >= 500) {
      console.error('Server error. Please try again later.');
    }
    
    if (!response) {
      console.error('Network error. Please check your connection.');
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
  }
};

export default apiClient;