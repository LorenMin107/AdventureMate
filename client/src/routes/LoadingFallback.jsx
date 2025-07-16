import React from 'react';
import { useTranslation } from 'react-i18next';
import './LoadingFallback.css';

/**
 * LoadingFallback component
 * Used as a fallback while lazy-loaded components are being loaded
 */
const LoadingFallback = () => {
  const { t } = useTranslation();

  return (
    <div className="loading-fallback">
      <div className="spinner"></div>
      <p>{t('loadingFallback.loading')}</p>
    </div>
  );
};

export default LoadingFallback;
