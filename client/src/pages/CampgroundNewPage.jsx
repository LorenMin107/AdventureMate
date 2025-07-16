import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import CampgroundForm from '../components/CampgroundForm';
import './CampgroundNewPage.css';

/**
 * CampgroundNewPage component for creating a new campground
 * Only accessible to admin users
 */
const CampgroundNewPage = () => {
  const { t } = useTranslation();
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading) setInitialLoad(false);
  }, [loading]);

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!loading && currentUser && !currentUser.isAdmin) {
      navigate('/campgrounds');
    }
  }, [currentUser, loading, navigate]);

  if (initialLoad) {
    return <div className="loading-container">{t('campgroundNew.loading')}</div>;
  }

  if (!currentUser) {
    return <div className="unauthorized-container">{t('campgroundNew.loginRequired')}</div>;
  }

  if (!currentUser.isAdmin) {
    return <div className="unauthorized-container">{t('campgroundNew.noPermission')}</div>;
  }

  return (
    <div className="campground-new-page">
      <div className="page-header">
        <h1>{t('campgroundNew.title')}</h1>
        <p>{t('campgroundNew.subtitle')}</p>
      </div>

      <CampgroundForm isEditing={false} />
    </div>
  );
};

export default CampgroundNewPage;
