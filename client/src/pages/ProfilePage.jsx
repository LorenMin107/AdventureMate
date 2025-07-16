import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import TwoFactorSetup from '../components/TwoFactorSetup';
import PasswordChangeForm from '../components/PasswordChangeForm';
import BookingList from '../components/BookingList';
import UserReviewList from '../components/UserReviewList';
import { logError } from '../utils/logger';
import './ProfilePage.css';

/**
 * ProfilePage displays user information and allows updating the phone number
 */
const ProfilePage = () => {
  const { t } = useTranslation();
  const { userDetails, loading, error, updateProfile } = useUser();
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [activeSection, setActiveSection] = useState('personal');

  // Initialize phone state with user's phone number when userDetails is loaded
  useEffect(() => {
    if (userDetails?.phone) {
      setPhone(userDetails.phone);
    }
  }, [userDetails]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phone number
    if (phone && !validatePhone(phone)) {
      setPhoneError(t('profile.invalidPhoneNumber'));
      return;
    }

    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      await updateProfile({ phone });
      setIsEditing(false);
      setUpdateSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      logError('Error updating profile', err);
      setUpdateError(t('profile.updateError'));
    }
  };

  // Validate phone number format
  const validatePhone = (phoneNumber) => {
    // Simple validation for demonstration purposes
    // This can be enhanced with more specific validation based on requirements
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phoneNumber);
  };

  // Handle phone input change
  const handlePhoneChange = (e) => {
    setPhone(e.target.value);
    setPhoneError('');
  };

  if (loading) {
    return <div className="profile-page-loading">{t('profile.loading')}</div>;
  }

  if (error) {
    return <div className="profile-page-error">{error}</div>;
  }

  if (!userDetails) {
    return <div className="profile-page-error">{t('profile.unableToLoad')}</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {userDetails.username ? userDetails.username.charAt(0).toUpperCase() : 'U'}
        </div>
        <h1 className="profile-page-title">
          {t('profile.userProfile', { username: userDetails.username })}
        </h1>
      </div>

      <div className="profile-container">
        <div className="profile-sidebar">
          <nav className="profile-nav">
            <ul className="profile-nav-list">
              <li
                className={`profile-nav-item ${activeSection === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveSection('personal')}
              >
                <span className="profile-nav-icon">👤</span>
                <span>{t('profile.personalInfo')}</span>
              </li>
              <li
                className={`profile-nav-item ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSection('security')}
              >
                <span className="profile-nav-icon">🔒</span>
                <span>{t('profile.security')}</span>
              </li>
              <li
                className={`profile-nav-item ${activeSection === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveSection('bookings')}
              >
                <span className="profile-nav-icon">🏕️</span>
                <span>{t('profile.bookings')}</span>
              </li>

              <li
                className={`profile-nav-item ${activeSection === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveSection('reviews')}
              >
                <span className="profile-nav-icon">⭐</span>
                <span>{t('profile.reviews')}</span>
              </li>
            </ul>
          </nav>
        </div>

        <div className="profile-content">
          {updateError && <div className="profile-update-error">{updateError}</div>}

          {updateSuccess && (
            <div className="profile-update-success">{t('profile.updateSuccess')}</div>
          )}

          {activeSection === 'personal' && (
            <div className="profile-section">
              <h2 className="section-title">{t('profile.personalInformation')}</h2>
              <div className="profile-card">
                <div className="profile-info">
                  <div className="profile-field">
                    <label>{t('profile.username')}</label>
                    <span>{userDetails.username}</span>
                  </div>

                  <div className="profile-field">
                    <label>{t('profile.email')}</label>
                    <span>{userDetails.email}</span>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="profile-form">
                      <div className="profile-field">
                        <label htmlFor="phone">{t('profile.phoneNumber')}</label>
                        <input
                          type="text"
                          id="phone"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder={t('profile.enterPhoneNumber')}
                          className={phoneError ? 'input-error' : ''}
                        />
                        {phoneError && <div className="error-message">{phoneError}</div>}
                      </div>

                      <div className="profile-actions">
                        <button type="submit" className="save-button">
                          {t('profile.save')}
                        </button>
                        <button
                          type="button"
                          className="cancel-button"
                          onClick={() => {
                            setIsEditing(false);
                            setPhone(userDetails.phone || '');
                            setPhoneError('');
                          }}
                        >
                          {t('profile.cancel')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="profile-field">
                        <label>{t('profile.phone')}</label>
                        <span>{userDetails.phone || t('profile.notProvided')}</span>
                      </div>

                      <div className="profile-actions">
                        <button
                          className="common-btn common-btn-secondary"
                          onClick={() => setIsEditing(true)}
                        >
                          {userDetails.phone
                            ? t('profile.updatePhoneNumber')
                            : t('profile.addPhoneNumber')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="profile-section">
              <h2 className="section-title">{t('profile.securitySettings')}</h2>
              <div className="profile-card">
                <TwoFactorSetup />
                <div className="security-actions">
                  <Link to="/password-change" className="security-link">
                    <span className="security-icon">🔑</span>
                    <span>{t('profile.changePassword')}</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'bookings' && (
            <div className="profile-section">
              <h2 className="section-title">{t('profile.myBookings')}</h2>
              <div className="profile-card">
                <BookingList initialBookings={userDetails?.bookings || []} />
              </div>
            </div>
          )}

          {activeSection === 'reviews' && (
            <div className="profile-section">
              <h2 className="section-title">{t('profile.myReviews')}</h2>
              <div className="profile-card">
                <UserReviewList initialReviews={userDetails?.reviews || []} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
