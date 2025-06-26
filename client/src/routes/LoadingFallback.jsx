import React from 'react';
import './LoadingFallback.css';

/**
 * LoadingFallback component
 * Used as a fallback while lazy-loaded components are being loaded
 */
const LoadingFallback = () => {
  return (
    <div className="loading-fallback">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
};

export default LoadingFallback;