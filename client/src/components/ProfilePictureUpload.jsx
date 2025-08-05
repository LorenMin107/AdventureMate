import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import './ProfilePictureUpload.css';

/**
 * ProfilePictureUpload component allows users to upload and edit their profile picture
 */
const ProfilePictureUpload = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { userDetails, setUserDetails } = useUser();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('profilePicture.invalidFileType'));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('profilePicture.fileTooLarge'));
      return;
    }

    setError('');

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files[0]) {
      setError(t('profilePicture.noFileSelected'));
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('profilePicture', fileInputRef.current.files[0]);

      const response = await apiClient.post('/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update user details in context
      if (response.data.user) {
        setUserDetails(response.data.user);

        // Update AuthContext currentUser if it exists
        if (currentUser) {
          const updatedCurrentUser = {
            ...currentUser,
            profile: response.data.user.profile,
          };

          console.log(
            'ProfilePictureUpload (upload): Dispatching userProfileUpdated event with:',
            updatedCurrentUser
          );

          // Dispatch event to notify AuthContext to update
          const event = new CustomEvent('userProfileUpdated', {
            detail: { updatedUser: updatedCurrentUser },
          });
          window.dispatchEvent(event);
        }
      }

      // Reset form
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Show a success message
      setError('');
    } catch (err) {
      logError('Error uploading profile picture', err);
      const errorMessage =
        err.response?.data?.error || err.message || t('profilePicture.uploadError');
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!userDetails.profile?.picture) return;

    setUploading(true);
    setError('');

    try {
      const response = await apiClient.delete('/users/profile-picture');

      // Update user details in context
      if (response.data.user) {
        setUserDetails(response.data.user);

        // Update AuthContext currentUser if it exists
        if (currentUser) {
          const updatedCurrentUser = {
            ...currentUser,
            profile: response.data.user.profile,
          };

          console.log(
            'ProfilePictureUpload (remove): Dispatching userProfileUpdated event with:',
            updatedCurrentUser
          );

          // Dispatch event to notify AuthContext to update
          const event = new CustomEvent('userProfileUpdated', {
            detail: { updatedUser: updatedCurrentUser },
          });
          window.dispatchEvent(event);
        }
      }

      setError('');
    } catch (err) {
      logError('Error removing profile picture', err);
      const errorMessage =
        err.response?.data?.error || err.message || t('profilePicture.removeError');
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    const name = userDetails?.profile?.name || userDetails?.username || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="profile-picture-upload">
      <h3>{t('profilePicture.title')}</h3>

      <div className="profile-picture-container">
        <div className="profile-picture-display">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="profile-picture-preview" />
          ) : userDetails?.profile?.picture ? (
            <img
              src={userDetails.profile.picture}
              alt="Profile"
              className="profile-picture-current"
            />
          ) : (
            <div className="profile-picture-initials">{getInitials()}</div>
          )}
        </div>

        <div className="profile-picture-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="profile-picture-input"
            id="profile-picture-input"
          />

          <label htmlFor="profile-picture-input" className="profile-picture-upload-btn">
            {t('profilePicture.chooseFile')}
          </label>

          {previewUrl && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="profile-picture-save-btn"
            >
              {uploading ? t('profilePicture.uploading') : t('profilePicture.upload')}
            </button>
          )}

          {userDetails?.profile?.picture && !previewUrl && (
            <button
              onClick={handleRemovePicture}
              disabled={uploading}
              className="profile-picture-remove-btn"
            >
              {uploading ? t('profilePicture.removing') : t('profilePicture.remove')}
            </button>
          )}
        </div>

        {error && <div className="profile-picture-error">{error}</div>}

        <div className="profile-picture-help">
          <p>{t('profilePicture.helpText')}</p>
          <ul>
            <li>{t('profilePicture.maxSize')}</li>
            <li>{t('profilePicture.supportedFormats')}</li>
            <li>{t('profilePicture.autoCrop')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
