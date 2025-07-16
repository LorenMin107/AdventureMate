import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CampgroundForm from '../components/CampgroundForm';
import './CampgroundNewPage.css';

/**
 * OwnerCampgroundNewPage component for owners to create a new campground
 * Only accessible to owner users (not admins or regular users)
 */
const OwnerCampgroundNewPage = () => {
  const { t } = useTranslation();
  const { currentUser, loading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading) setInitialLoad(false);
  }, [loading]);

  // Check if user is owner, redirect if not
  useEffect(() => {
    if (!loading && currentUser && (!currentUser.isOwner || currentUser.isAdmin)) {
      navigate('/owner/campgrounds');
    }
  }, [currentUser, loading, navigate]);

  if (initialLoad) {
    return <div className="loading-container">{t('ownerCampgroundNewPage.loading')}</div>;
  }

  if (!currentUser) {
    return (
      <div className="unauthorized-container">{t('ownerCampgroundNewPage.loginRequired')}</div>
    );
  }

  if (!currentUser.isOwner || currentUser.isAdmin) {
    return <div className="unauthorized-container">{t('ownerCampgroundNewPage.noPermission')}</div>;
  }

  return (
    <div className={`campground-new-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="page-header">
        <h1>{t('ownerCampgroundNewPage.title')}</h1>
        <p>{t('ownerCampgroundNewPage.subtitle')}</p>
      </div>
      <CampgroundForm isEditing={false} apiPath="/owners/campgrounds" />
    </div>
  );
};

export default OwnerCampgroundNewPage;
