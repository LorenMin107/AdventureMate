import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import TwoFactorSetup from '../components/TwoFactorSetup';
import PasswordChangeForm from '../components/PasswordChangeForm';
import BookingList from '../components/BookingList';
import UserReviewList from '../components/UserReviewList';
import { logError } from '../utils/logger';
import apiClient from '../utils/api';
import './ProfilePage.css';

/**
 * ProfilePage displays user information and allows updating the phone number, display name, and username
 */
const ProfilePage = () => {
  const { t } = useTranslation();
  const { userDetails, loading, error, updateProfile, setUserDetails } = useUser();
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [activeSection, setActiveSection] = useState('personal');

  // New state for editing display name and username
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editDisplayNameError, setEditDisplayNameError] = useState('');
  const [editUsernameError, setEditUsernameError] = useState('');

  // Initialize phone state with user's phone number when userDetails is loaded
  useEffect(() => {
    if (userDetails?.phone) {
      setPhone(userDetails.phone);
    }
    if (userDetails) {
      setEditDisplayName(userDetails.profile?.name || userDetails.username || '');
      setEditUsername(userDetails.username || '');
    }
  }, [userDetails]);

  // Handle form submission for phone
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      logError('Error updating profile', err);
      setUpdateError(t('profile.updateError'));
    }
  };

  // Validate phone number format
  const validatePhone = (phoneNumber) => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phoneNumber);
  };

  const validateDisplayName = (name) => {
    if (!name || name.trim().length < 2) {
      return t('profile.displayNameTooShort');
    }
    if (name.length > 50) {
      return t('profile.displayNameTooLong');
    }
    return '';
  };

  const validateUsername = (username) => {
    if (!username || username.trim().length < 3) {
      return t('profile.usernameTooShort');
    }
    if (username.length > 30) {
      return t('profile.usernameTooLong');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return t('profile.usernameInvalidChars');
    }
    return '';
  };

  // Handle phone input change
  const handlePhoneChange = (e) => {
    setPhone(e.target.value);
    setPhoneError('');
  };

  // Handle edit modal open
  const openEditModal = () => {
    setEditDisplayName(userDetails?.profile?.name || userDetails?.username || '');
    setEditUsername(userDetails?.username || '');
    setEditError('');
    setEditSuccess(false);
    setEditDisplayNameError('');
    setEditUsernameError('');
    setEditModalOpen(true);
  };

  // Handle edit modal save
  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditDisplayNameError('');
    setEditUsernameError('');
    setEditLoading(true);

    // Frontend validation
    const displayNameErr = validateDisplayName(editDisplayName);
    const usernameErr = validateUsername(editUsername);
    if (displayNameErr || usernameErr) {
      setEditDisplayNameError(displayNameErr);
      setEditUsernameError(usernameErr);
      setEditLoading(false);
      return;
    }
    try {
      console.log('Starting profile update...');
      // Use the updateProfile function from UserContext
      const result = await updateProfile({
        username: editUsername,
        profileName: editDisplayName,
      });

      console.log('Profile update result:', result);

      if (result.success) {
        console.log('Profile update successful');
        setEditLoading(false);
        setEditSuccess(true);
        setEditModalOpen(false); // Only close on success!

        // Clear success message after 3 seconds
        setTimeout(() => {
          setEditSuccess(false);
        }, 3000);
      } else {
        console.log('Profile update failed:', result);
        setEditLoading(false);
        // Backend error handling
        const responseData = result.error;
        console.log('Response data:', responseData);

        // Handle express-validator error format
        if (responseData && responseData.data && responseData.data.errors) {
          const validationErrors = responseData.data.errors;
          console.log('Validation errors:', validationErrors);
          validationErrors.forEach((e) => {
            if (e.field === 'username') setEditUsernameError(e.message);
            if (e.field === 'profileName') setEditDisplayNameError(e.message);
            // Add more fields as needed
          });
          // If no field-specific error, show general error
          if (!validationErrors.length)
            setEditError(responseData.message || t('profile.updateError'));
        } else {
          // Fallback for direct error
          const backendError = responseData?.error || responseData?.message;
          console.log('Backend error:', backendError);
          if (backendError && backendError.toLowerCase().includes('username')) {
            setEditUsernameError(backendError);
          } else if (backendError && backendError.toLowerCase().includes('name')) {
            setEditDisplayNameError(backendError);
          } else {
            setEditError(backendError || t('profile.updateError'));
          }
        }
        // Do NOT close the modal on error!
      }
    } catch (err) {
      console.log('Caught error in handleEditSave:', err);
      setEditLoading(false);
      setEditError(t('profile.updateError'));
      // Do NOT close the modal on error!
    }
  };

  if (loading) {
    return <div className="profile-page-loading">{t('profile.loading')}</div>;
  }
  // Only show a full error page for fatal errors (not 400 validation errors)
  if (error && !error.toLowerCase().includes('username') && !error.toLowerCase().includes('name')) {
    return <div className="profile-page-error">{error}</div>;
  }
  if (!userDetails) {
    return <div className="profile-page-error">{t('profile.unableToLoad')}</div>;
  }

  // Render edit modal
  const renderEditModal = () => {
    console.log('Rendering edit modal, editModalOpen:', editModalOpen);
    console.log(
      'Edit errors - username:',
      editUsernameError,
      'displayName:',
      editDisplayNameError,
      'general:',
      editError
    );

    return (
      <div className="profile-edit-modal-overlay">
        <div className="profile-edit-modal">
          <h2>{t('profile.editProfile')}</h2>
          <form onSubmit={handleEditSave}>
            <div className="profile-field">
              <label>{t('profile.displayName')}</label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => {
                  setEditDisplayName(e.target.value);
                  setEditDisplayNameError(validateDisplayName(e.target.value));
                }}
                maxLength={50}
                required
              />
              {editDisplayNameError && (
                <div className="profile-update-error">{editDisplayNameError}</div>
              )}
            </div>
            <div className="profile-field">
              <label>{t('profile.username')}</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => {
                  setEditUsername(e.target.value);
                  setEditUsernameError(validateUsername(e.target.value));
                }}
                maxLength={30}
                required
              />
              <span className="profile-username-hint">@{editUsername}</span>
              {editUsernameError && <div className="profile-update-error">{editUsernameError}</div>}
            </div>
            {editError && <div className="profile-update-error">{editError}</div>}
            <div className="profile-actions">
              <button type="submit" className="save-button" disabled={editLoading}>
                {editLoading ? t('profile.saving') : t('profile.save')}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setEditModalOpen(false)}
                disabled={editLoading}
              >
                {t('profile.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {userDetails.profile?.picture ? (
            <img
              src={userDetails.profile.picture}
              alt="avatar"
              style={{ width: '100%', height: '100%', borderRadius: '50%' }}
            />
          ) : (
            (userDetails.profile?.name || userDetails.username || 'U').charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="profile-page-title">
            {userDetails.profile?.name || userDetails.username}
          </h1>
          <div className="profile-username-handle">@{userDetails.username}</div>
        </div>
        <button className="edit-button" onClick={openEditModal}>
          {t('profile.editProfile')}
        </button>
      </div>
      {editModalOpen && renderEditModal()}
      {console.log('Modal should be open:', editModalOpen)}
      {editSuccess && <div className="profile-update-success">{t('profile.updateSuccess')}</div>}
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
                    <label>{t('profile.displayName')}</label>
                    <span>{userDetails.profile?.name || userDetails.username}</span>
                  </div>
                  <div className="profile-field">
                    <label>{t('profile.username')}</label>
                    <span>@{userDetails.username}</span>
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
