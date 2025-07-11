import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import './ErrorBoundary.css';

/**
 * ErrorBoundary component
 * Catches errors in the component tree and displays a fallback UI
 */
const ErrorBoundary = () => {
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
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Reload Page
          </button>
          <Link to="/" className="btn btn-secondary">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
