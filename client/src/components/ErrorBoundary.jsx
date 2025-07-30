import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import './ErrorBoundary.css';

/**
 * ErrorBoundary component
 * Catches errors in the component tree and displays a fallback UI
 */
const ErrorBoundary = () => {
  const { t } = useTranslation();
  const error = useRouteError();

  // Determine if it's a route error or a general error
  const isRouteError = isRouteErrorResponse(error);

  // Get appropriate error message
  let errorMessage = 'An unexpected error occurred';
  let statusCode = 500;

  if (isRouteError) {
    statusCode = error.status;
    errorMessage = error.data?.message || error.statusText || 'Something went wrong';
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Function to clear all caches and reload
  const handleRefreshWithCacheClear = () => {
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

  return (
    <div className="error-boundary">
      <div className="error-content">
        <h1>{statusCode}</h1>
        <h2>Oops! Something went wrong</h2>
        <p className="error-message">{errorMessage}</p>

        <div className="error-details">
          {process.env.NODE_ENV === 'development' && error instanceof Error && (
            <details>
              <summary>Error Details</summary>
              <pre>{error.stack}</pre>
            </details>
          )}
        </div>

        <div className="error-actions">
          <button onClick={handleRefreshWithCacheClear} className="btn btn-primary">
            Clear Cache & Reload
          </button>
          <Link to="/" className="btn btn-secondary">
            {t('notFound.goToHomepage')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
