import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

/**
 * NotFoundPage component
 * Displayed when a user navigates to a route that doesn't exist
 */
const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            Go to Homepage
          </Link>
          <Link to="/campgrounds" className="btn btn-secondary">
            Browse Campgrounds
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;