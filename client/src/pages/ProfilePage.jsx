import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import TwoFactorSetup from '../components/TwoFactorSetup';
import PasswordChangeForm from '../components/PasswordChangeForm';
import UserReviewList from '../components/UserReviewList';
import CSSIsolationWrapper from '../components/CSSIsolationWrapper';
import { logError } from '../utils/logger';
import apiClient from '../utils/api';
import './ProfilePage.css';

/**
 * ProfilePage displays user information and allows updating the phone number, display name, and username
 */
const ProfilePage = () => {
  const { t } = useTranslation();
  const { userDetails, loading, error, updateProfile, setUserDetails } = useUser();
  const [activeSection, setActiveSection] = useState('personal');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // New state for editing display name and username
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProfilePicture, setEditProfilePicture] = useState(null);
  const [editProfilePicturePreview, setEditProfilePicturePreview] = useState(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editDisplayNameError, setEditDisplayNameError] = useState('');
  const [editUsernameError, setEditUsernameError] = useState('');
  const [editPhoneError, setEditPhoneError] = useState('');
  const [editProfilePictureError, setEditProfilePictureError] = useState('');
  const [removeProfilePicture, setRemoveProfilePicture] = useState(false);

  // Initialize phone state with user's phone number when userDetails is loaded
  useEffect(() => {
    if (userDetails) {
      // Don't fall back to username - keep display name independent
      setEditDisplayName(userDetails.profile?.name || '');
      setEditUsername(userDetails.username || '');
      setEditPhone(userDetails.phone || '');
      setEditProfilePicturePreview(userDetails.profile?.picture || null);
    }
  }, [userDetails]);

  // Validate phone number format (moved to edit modal validation)

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

  const validatePhone = (phoneNumber) => {
    if (phoneNumber && !/^\+?[0-9]{10,15}$/.test(phoneNumber)) {
      return t('profile.invalidPhoneNumber');
    }
    return '';
  };

  const validateProfilePicture = (file) => {
    if (!file) return '';

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return t('profilePicture.invalidFileType');
    }

    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return t('profilePicture.fileTooLarge');
    }

    return '';
  };

  const handleProfilePictureSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const error = validateProfilePicture(file);
      setEditProfilePictureError(error);

      if (!error) {
        setEditProfilePicture(file);
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setEditProfilePicturePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveProfilePicture = () => {
    setEditProfilePicture(null);
    setEditProfilePicturePreview(null);
    setEditProfilePictureError('');
    setRemoveProfilePicture(true);
    // Clear the file input
    const fileInput = document.getElementById('profile-picture-input-modal');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle edit modal open
  const openEditModal = () => {
    // Don't fall back to username - keep display name independent
    setEditDisplayName(userDetails?.profile?.name || '');
    setEditUsername(userDetails?.username || '');
    setEditPhone(userDetails?.phone || '');
    setEditProfilePicturePreview(userDetails?.profile?.picture || null);
    setEditProfilePicture(null);
    setRemoveProfilePicture(false);
    setEditError('');
    setEditSuccess(false);
    setEditDisplayNameError('');
    setEditUsernameError('');
    setEditPhoneError('');
    setEditProfilePictureError('');
    setEditModalOpen(true);
  };

  // Handle edit modal save
  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditDisplayNameError('');
    setEditUsernameError('');
    setEditPhoneError('');
    setEditProfilePictureError('');
    setEditLoading(true);

    // Frontend validation
    const displayNameErr = validateDisplayName(editDisplayName);
    const usernameErr = validateUsername(editUsername);
    const phoneErr = validatePhone(editPhone);
    const profilePictureErr = validateProfilePicture(editProfilePicture);

    if (displayNameErr || usernameErr || phoneErr || profilePictureErr) {
      setEditDisplayNameError(displayNameErr);
      setEditUsernameError(usernameErr);
      setEditPhoneError(phoneErr);
      setEditProfilePictureError(profilePictureErr);
      setEditLoading(false);
      return;
    }

    try {
      console.log('Starting profile update...');
      console.log('removeProfilePicture flag:', removeProfilePicture);
      console.log('editProfilePicture:', editProfilePicture);

      // Create FormData if we have a profile picture
      let profileData;
      let headers = {};

      if (editProfilePicture) {
        profileData = new FormData();
        profileData.append('username', editUsername);
        profileData.append('profileName', editDisplayName);
        profileData.append('phone', editPhone);
        profileData.append('profilePicture', editProfilePicture);
        headers = { 'Content-Type': 'multipart/form-data' };
        console.log('Sending new profile picture');
      } else if (removeProfilePicture) {
        // Handle profile picture removal
        profileData = {
          username: editUsername,
          profileName: editDisplayName,
          phone: editPhone,
          removeProfilePicture: true,
        };
        console.log('Sending profile picture removal request');
      } else {
        profileData = {
          username: editUsername,
          profileName: editDisplayName,
          phone: editPhone,
        };
        console.log('Sending profile update without picture changes');
      }

      // Use the updateProfile function from UserContext
      const result = await updateProfile(profileData, headers);

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
            if (e.field === 'phone') setEditPhoneError(e.message);
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
          } else if (backendError && backendError.toLowerCase().includes('phone')) {
            setEditPhoneError(backendError);
          } else if (backendError && backendError.toLowerCase().includes('picture')) {
            setEditProfilePictureError(backendError);
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
      'phone:',
      editPhoneError,
      'picture:',
      editProfilePictureError,
      'general:',
      editError
    );

    return (
      <div className="profile-edit-modal-overlay">
        <div className="profile-edit-modal">
          <div className="modal-header">
            <h2>{t('profile.editProfile')}</h2>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setEditModalOpen(false)}
              disabled={editLoading}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleEditSave} className="modal-form">
            {/* Profile Picture Section */}
            <div className="form-section">
              <h3 className="section-title">{t('profilePicture.profilePicture')}</h3>
              <div className="profile-picture-upload-section">
                <div className="profile-picture-preview">
                  {editProfilePicturePreview ? (
                    <img
                      src={editProfilePicturePreview}
                      alt="Profile preview"
                      className="profile-picture-preview-img"
                    />
                  ) : userDetails.profile?.picture && !removeProfilePicture ? (
                    <img
                      src={userDetails.profile.picture}
                      alt="Current profile"
                      className="profile-picture-preview-img"
                    />
                  ) : (
                    <div className="profile-picture-placeholder">
                      {(userDetails.profile?.name || userDetails.username || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="profile-picture-controls">
                  <input
                    type="file"
                    id="profile-picture-input-modal"
                    accept="image/*"
                    onChange={handleProfilePictureSelect}
                    className="profile-picture-input"
                  />
                  <label
                    htmlFor="profile-picture-input-modal"
                    className="profile-picture-choose-btn"
                  >
                    {t('profilePicture.chooseFile')}
                  </label>
                  {(editProfilePicturePreview ||
                    (userDetails.profile?.picture && !removeProfilePicture)) && (
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      className="profile-picture-remove-btn"
                    >
                      {t('profilePicture.remove')}
                    </button>
                  )}
                </div>
              </div>
              {editProfilePictureError && (
                <div className="form-error">{editProfilePictureError}</div>
              )}
            </div>

            {/* Personal Information Section */}
            <div className="form-section">
              <h3 className="section-title">{t('profile.personalInformation')}</h3>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="display-name">{t('profile.displayName')}</label>
                  <input
                    id="display-name"
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => {
                      setEditDisplayName(e.target.value);
                      setEditDisplayNameError(validateDisplayName(e.target.value));
                    }}
                    maxLength={50}
                    placeholder={t('profile.displayNamePlaceholder')}
                  />
                  {editDisplayNameError && <div className="form-error">{editDisplayNameError}</div>}
                </div>

                <div className="form-field">
                  <label htmlFor="username">{t('profile.username')}</label>
                  <div className="input-with-hint">
                    <input
                      id="username"
                      type="text"
                      value={editUsername}
                      onChange={(e) => {
                        setEditUsername(e.target.value);
                        setEditUsernameError(validateUsername(e.target.value));
                      }}
                      maxLength={30}
                      placeholder={t('profile.usernamePlaceholder')}
                      required
                    />
                    <span className="input-hint">@{editUsername}</span>
                  </div>
                  {editUsernameError && <div className="form-error">{editUsernameError}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="phone">{t('profile.phoneNumber')}</label>
                  <input
                    id="phone"
                    type="text"
                    value={editPhone}
                    onChange={(e) => {
                      setEditPhone(e.target.value);
                      setEditPhoneError(validatePhone(e.target.value));
                    }}
                    placeholder={t('profile.enterPhoneNumber')}
                  />
                  {editPhoneError && <div className="form-error">{editPhoneError}</div>}
                </div>

                <div className="form-field">
                  <label htmlFor="email">{t('profile.email')}</label>
                  <input
                    id="email"
                    type="email"
                    value={userDetails.email}
                    disabled
                    className="form-field-disabled"
                  />
                  <span className="field-note">{t('profile.emailNote')}</span>
                </div>
              </div>
            </div>

            {editError && <div className="form-error global-error">{editError}</div>}

            <div className="modal-actions">
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
    <>
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
              {userDetails.profile?.name || t('profile.noDisplayName')}
            </h1>
            <div className="profile-username-handle">@{userDetails.username}</div>
          </div>
          <button className="edit-button" onClick={openEditModal}>
            {t('profile.editProfile')}
          </button>
        </div>
        {editSuccess && <div className="profile-update-success">{t('profile.updateSuccess')}</div>}
        <CSSIsolationWrapper>
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
                        <span>{userDetails.profile?.name || t('profile.noDisplayName')}</span>
                      </div>
                      <div className="profile-field">
                        <label>{t('profile.username')}</label>
                        <span>@{userDetails.username}</span>
                      </div>
                      <div className="profile-field">
                        <label>{t('profile.email')}</label>
                        <span>{userDetails.email}</span>
                      </div>
                      <div className="profile-field">
                        <label>{t('profile.phone')}</label>
                        <span>{userDetails.phone || t('profile.notProvided')}</span>
                      </div>
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
                      {/* Only show Change Password link for non-Google OAuth users */}
                      {!userDetails?.googleId && (
                        <Link to="/password-change" className="security-link">
                          <span className="security-icon">🔑</span>
                          <span>{t('profile.changePassword')}</span>
                        </Link>
                      )}
                      {/* Show Google account notice for Google OAuth users */}
                      {userDetails?.googleId && (
                        <div className="google-account-notice">
                          <span className="security-icon">🔐</span>
                          <div className="notice-content">
                            <span className="notice-title">
                              {t('profile.googleAccount') || 'Google Account'}
                            </span>
                            <span className="notice-description">
                              {t('profile.googleAccountDescription') ||
                                'Password managed through Google'}
                            </span>
                          </div>
                          <a
                            href="https://myaccount.google.com/security"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="google-settings-link-small"
                          >
                            {t('profile.openGoogleSettings') || 'Settings'}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'reviews' && (
                <div className="profile-section">
                  <h2 className="section-title">{t('profile.myReviews')}</h2>
                  <div className="profile-card">
                    <UserReviewList />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CSSIsolationWrapper>
      </div>

      {/* Render modal outside of CSSIsolationWrapper using portal */}
      {editModalOpen && createPortal(renderEditModal(), document.body)}
    </>
  );
};

export default ProfilePage;
