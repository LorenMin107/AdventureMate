import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import './ProfilePage.css';

/**
 * ProfilePage displays user information and allows updating the phone number
 */
const ProfilePage = () => {
  const { userDetails, loading, error, updateProfile } = useUser();
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState('');

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
      setPhoneError('Please enter a valid phone number');
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
      console.error('Error updating profile:', err);
      setUpdateError('Failed to update profile. Please try again.');
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
    return <div className="profile-page-loading">Loading your profile...</div>;
  }

  if (error) {
    return <div className="profile-page-error">{error}</div>;
  }

  if (!userDetails) {
    return <div className="profile-page-error">Unable to load profile information.</div>;
  }

  return (
    <div className="profile-page">
      <h1 className="profile-page-title">My Profile</h1>
      
      <div className="profile-card">
        <div className="profile-info">
          <div className="profile-field">
            <label>Username:</label>
            <span>{userDetails.username}</span>
          </div>
          
          <div className="profile-field">
            <label>Email:</label>
            <span>{userDetails.email}</span>
          </div>
          
          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="profile-field">
                <label htmlFor="phone">Phone Number:</label>
                <input
                  type="text"
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter your phone number"
                  className={phoneError ? 'input-error' : ''}
                />
                {phoneError && <div className="error-message">{phoneError}</div>}
              </div>
              
              <div className="profile-actions">
                <button type="submit" className="save-button">Save</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                    setPhone(userDetails.phone || '');
                    setPhoneError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-field">
                <label>Phone:</label>
                <span>{userDetails.phone || 'Not provided'}</span>
              </div>
              
              <div className="profile-actions">
                <button 
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  {userDetails.phone ? 'Update Phone Number' : 'Add Phone Number'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {updateError && (
        <div className="profile-update-error">{updateError}</div>
      )}
      
      {updateSuccess && (
        <div className="profile-update-success">Profile updated successfully!</div>
      )}
    </div>
  );
};

export default ProfilePage;