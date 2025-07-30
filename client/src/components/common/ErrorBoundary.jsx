import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  // Function to clear all caches and reload
  handleRefreshWithCacheClear = () => {
    try {
      // Clear localStorage cache
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes('cache') ||
            key.includes('campground') ||
            key.includes('reviews') ||
            key.includes('auth') ||
            key.includes('user') ||
            key.includes('booking') ||
            key.includes('trip'))
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        console.log('Cleared cache key:', key);
      });

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear browser cache for this page
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName);
            console.log('Cleared cache:', cacheName);
          });
        });
      }

      console.log('All caches cleared, reloading page...');

      // Force reload with cache bypass
      window.location.reload(true);
    } catch (error) {
      console.error('Error clearing cache:', error);
      // Fallback to regular reload
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>Please refresh the page or try again later.</p>
          <button
            onClick={this.handleRefreshWithCacheClear}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Clear Cache & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
