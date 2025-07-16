import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './NotFoundPage.css';

/**
 * NotFoundPage component
 * Displayed when a user navigates to a route that doesn't exist
 */
const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>{t('notFound.title')}</h1>
        <h2>{t('notFound.subtitle')}</h2>
        <p>{t('notFound.message')}</p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            {t('notFound.goToHomepage')}
          </Link>
          <Link to="/campgrounds" className="btn btn-secondary">
            {t('notFound.browseCampgrounds')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
