import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import useOwners from '../hooks/useOwners';
import { logError } from '../utils/logger';
import './OwnerSettingsPage.css';
import { Link } from 'react-router-dom';

/**
 * Owner Settings Page
 * Modern settings dashboard for campground owners
 */
const OwnerSettingsPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { showMessage } = useFlashMessage();
  const { theme } = useTheme();
  const { useOwnerProfile } = useOwners();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Fetch owner's profile data
  const { data: ownerProfile, isLoading, error: fetchError, refetch } = useOwnerProfile();

  const [formData, setFormData] = useState({
    businessName: ownerProfile.businessName || '',
    businessType: ownerProfile.businessType || 'individual',
    businessRegistrationNumber: ownerProfile.businessRegistrationNumber || '',
    taxId: ownerProfile.taxId || '',
    businessAddress: {
      street: ownerProfile.businessAddress?.street || '',
      city: ownerProfile.businessAddress?.city || '',
      state: ownerProfile.businessAddress?.state || '',
      zipCode: ownerProfile.businessAddress?.zipCode || '',
      country: 'Thailand',
    },
    businessPhone: ownerProfile.businessPhone || '',
    businessEmail: ownerProfile.businessEmail || currentUser?.email || '',
    bankingInfo: {
      accountHolderName: ownerProfile.bankingInfo?.accountHolderName || '',
      bankName: ownerProfile.bankingInfo?.bankName || '',
      accountNumber: ownerProfile.bankingInfo?.accountNumber || '',
      routingNumber: ownerProfile.bankingInfo?.routingNumber || '',
      swiftCode: ownerProfile.bankingInfo?.swiftCode || '',
    },
    settings: {
      minimumStay: ownerProfile.settings?.minimumStay || 1,
      maximumStay: ownerProfile.settings?.maximumStay || 30,
      checkInTime: ownerProfile.settings?.checkInTime || '15:00',
      checkOutTime: ownerProfile.settings?.checkOutTime || '11:00',
    },
  });

  useEffect(() => {
    if (ownerProfile) {
      setFormData({
        businessName: ownerProfile.businessName || '',
        businessType: ownerProfile.businessType || 'individual',
        businessRegistrationNumber: ownerProfile.businessRegistrationNumber || '',
        taxId: ownerProfile.taxId || '',
        businessAddress: {
          street: ownerProfile.businessAddress?.street || '',
          city: ownerProfile.businessAddress?.city || '',
          state: ownerProfile.businessAddress?.state || '',
          zipCode: ownerProfile.businessAddress?.zipCode || '',
          country: 'Thailand',
        },
        businessPhone: ownerProfile.businessPhone || '',
        businessEmail: ownerProfile.businessEmail || currentUser?.email || '',
        bankingInfo: {
          accountHolderName: ownerProfile.bankingInfo?.accountHolderName || '',
          bankName: ownerProfile.bankingInfo?.bankName || '',
          accountNumber: ownerProfile.bankingInfo?.accountNumber || '',
          routingNumber: ownerProfile.bankingInfo?.routingNumber || '',
          swiftCode: ownerProfile.bankingInfo?.swiftCode || '',
        },
        settings: {
          minimumStay: ownerProfile.settings?.minimumStay || 1,
          maximumStay: ownerProfile.settings?.maximumStay || 30,
          checkInTime: ownerProfile.settings?.checkInTime || '15:00',
          checkOutTime: ownerProfile.settings?.checkOutTime || '11:00',
        },
      });
      setLoading(false);
      setError(null);
    }
  }, [ownerProfile, currentUser]);

  useEffect(() => {
    if (fetchError) {
      setError(t('commonErrors.failedToLoad', { item: 'profile data' }));
      setLoading(false);
    }
  }, [fetchError]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      // Here you would call the API to update the owner profile
      // await updateOwnerProfile(formData);

      setIsEditing(false);
      setUpdateSuccess(true);
      showMessage(t('ownerSettings.changesSaved'), 'success');

      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      logError('Error updating profile', err);
      setUpdateError(t('ownerSettings.saveError'));
      showMessage(t('ownerSettings.saveError'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="owner-loading">
        <div className="owner-loading-spinner"></div>
        <p>{t('ownerSettings.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-error">
        <h4>{t('ownerSettings.errorTitle')}</h4>
        <p>{error}</p>
        <button onClick={() => refetch()} className="owner-btn owner-btn-primary">
          {t('ownerSettings.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className={`owner-settings ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Enhanced Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div className="header-main">
            <div className="greeting-section">
              <h1>{t('ownerSettings.title')}</h1>
              <p className="header-subtitle">{t('ownerSettings.subtitle')}</p>
            </div>
            <div className="header-stats">
              <div className="header-stat">
                <span className="stat-label">{t('ownerSettings.status')}</span>
                <span className="stat-value">{t('ownerSettings.active')}</span>
              </div>
              <div className="header-stat">
                <span className="stat-label">{t('ownerSettings.memberSince')}</span>
                <span className="stat-value">
                  {new Date(ownerProfile?.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <div className="action-controls">
              {isEditing ? (
                <button onClick={handleSubmit} className="owner-btn owner-btn-primary">
                  {t('ownerSettings.saveChanges')}
                </button>
              ) : (
                <button onClick={() => setIsEditing(true)} className="owner-btn owner-btn-outline">
                  {t('ownerSettings.editProfile')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="settings-content">
        {/* Settings Navigation */}
        <div className="owner-card navigation-card">
          <div className="settings-nav">
            <button
              className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-label">{t('ownerSettings.businessProfile')}</span>
            </button>
            <button
              className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">{t('ownerSettings.businessSettings')}</span>
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="owner-card content-card">
          {updateError && (
            <div className="settings-error">
              <p>{updateError}</p>
            </div>
          )}

          {updateSuccess && (
            <div className="settings-success">
              <p>{t('ownerSettings.changesSaved')}</p>
            </div>
          )}

          {/* Business Profile Section */}
          {activeSection === 'profile' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>{t('ownerSettings.businessProfile')}</h2>
                <p className="section-subtitle">{t('ownerSettings.businessProfileSubtitle')}</p>
              </div>

              <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                  <label htmlFor="businessName">{t('ownerSettings.businessNameRequired')}</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder={t('ownerSettings.businessNamePlaceholder')}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="businessType">{t('ownerSettings.businessType')}</label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    >
                      <option value="individual">
                        {t('ownerSettings.businessTypeIndividual')}
                      </option>
                      <option value="company">{t('ownerSettings.businessTypeCompany')}</option>
                      <option value="organization">
                        {t('ownerSettings.businessTypeOrganization')}
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="businessPhone">{t('ownerSettings.businessPhone')}</label>
                    <input
                      type="tel"
                      id="businessPhone"
                      name="businessPhone"
                      value={formData.businessPhone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="+95 xxx xxx xxxx"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="businessEmail">{t('ownerSettings.businessEmail')}</label>
                  <input
                    type="email"
                    id="businessEmail"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="business@example.com"
                  />
                </div>

                <div className="address-section">
                  <h3>{t('ownerSettings.businessAddress')}</h3>
                  <div className="form-group">
                    <label htmlFor="businessAddress.street">{t('ownerSettings.street')}</label>
                    <input
                      type="text"
                      id="businessAddress.street"
                      name="businessAddress.street"
                      value={formData.businessAddress.street}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="businessAddress.city">{t('ownerSettings.city')}</label>
                      <input
                        type="text"
                        id="businessAddress.city"
                        name="businessAddress.city"
                        value={formData.businessAddress.city}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={t('ownerSettings.cityPlaceholder')}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="businessAddress.state">{t('ownerSettings.state')}</label>
                      <input
                        type="text"
                        id="businessAddress.state"
                        name="businessAddress.state"
                        value={formData.businessAddress.state}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder={t('ownerSettings.statePlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="businessAddress.zipCode">{t('ownerSettings.zipCode')}</label>
                      <input
                        type="text"
                        id="businessAddress.zipCode"
                        name="businessAddress.zipCode"
                        value={formData.businessAddress.zipCode}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="11011"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="businessAddress.country">{t('ownerSettings.country')}</label>
                      <input
                        type="hidden"
                        id="businessAddress.country"
                        name="businessAddress.country"
                        value="Thailand"
                      />
                      <input type="text" value="Thailand" disabled className="disabled-input" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Business Settings Section */}
          {activeSection === 'settings' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>{t('ownerSettings.businessSettings')}</h2>
                <p className="section-subtitle">{t('ownerSettings.businessSettingsSubtitle')}</p>
              </div>

              <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="settings.minimumStay">{t('ownerSettings.minimumStay')}</label>
                    <input
                      type="number"
                      id="settings.minimumStay"
                      name="settings.minimumStay"
                      value={formData.settings.minimumStay}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      min="1"
                      max="30"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="settings.maximumStay">{t('ownerSettings.maximumStay')}</label>
                    <input
                      type="number"
                      id="settings.maximumStay"
                      name="settings.maximumStay"
                      value={formData.settings.maximumStay}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      min="1"
                      max="365"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="settings.checkInTime">{t('ownerSettings.checkInTime')}</label>
                    <input
                      type="time"
                      id="settings.checkInTime"
                      name="settings.checkInTime"
                      value={formData.settings.checkInTime}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="settings.checkOutTime">{t('ownerSettings.checkOutTime')}</label>
                    <input
                      type="time"
                      id="settings.checkOutTime"
                      name="settings.checkOutTime"
                      value={formData.settings.checkOutTime}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerSettingsPage;
