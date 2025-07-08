import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import TwoFactorSetup from '../components/TwoFactorSetup';
import BookingList from '../components/BookingList';
import UserReviewList from '../components/UserReviewList';
import { logError } from '../utils/logger';
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
      logError('Error updating profile', err);
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
      <div className="profile-header">
        <div className="profile-avatar">
          {userDetails.username ? userDetails.username.charAt(0).toUpperCase() : 'U'}
        </div>
        <h1 className="profile-page-title">{userDetails.username}'s Profile</h1>
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
                <span>Personal Info</span>
              </li>
              <li
                className={`profile-nav-item ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSection('security')}
              >
                <span className="profile-nav-icon">🔒</span>
                <span>Security</span>
              </li>
              <li
                className={`profile-nav-item ${activeSection === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveSection('bookings')}
              >
                <span className="profile-nav-icon">🏕️</span>
                <span>Bookings</span>
              </li>
              <li
                className={`profile-nav-item ${activeSection === 'trips' ? 'active' : ''}`}
                onClick={() => setActiveSection('trips')}
              >
                <span className="profile-nav-icon">🗺️</span>
                <span>Trip Planner</span>
              </li>
              <li
                className={`profile-nav-item ${activeSection === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveSection('reviews')}
              >
                <span className="profile-nav-icon">⭐</span>
                <span>Reviews</span>
              </li>
            </ul>
          </nav>
        </div>

        <div className="profile-content">
          {updateError && <div className="profile-update-error">{updateError}</div>}

          {updateSuccess && (
            <div className="profile-update-success">Profile updated successfully!</div>
          )}

          {activeSection === 'personal' && (
            <div className="profile-section">
              <h2 className="section-title">Personal Information</h2>
              <div className="profile-card">
                <div className="profile-info">
                  <div className="profile-field">
                    <label>Username</label>
                    <span>{userDetails.username}</span>
                  </div>

                  <div className="profile-field">
                    <label>Email</label>
                    <span>{userDetails.email}</span>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="profile-form">
                      <div className="profile-field">
                        <label htmlFor="phone">Phone Number</label>
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
                        <button type="submit" className="save-button">
                          Save
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
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="profile-field">
                        <label>Phone</label>
                        <span>{userDetails.phone || 'Not provided'}</span>
                      </div>

                      <div className="profile-actions">
                        <button className="edit-button" onClick={() => setIsEditing(true)}>
                          {userDetails.phone ? 'Update Phone Number' : 'Add Phone Number'}
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
              <h2 className="section-title">Security Settings</h2>
              <div className="profile-card">
                <TwoFactorSetup />
              </div>
            </div>
          )}

          {activeSection === 'bookings' && (
            <div className="profile-section">
              <h2 className="section-title">My Bookings</h2>
              <div className="profile-card">
                <BookingList initialBookings={userDetails?.bookings || []} />
              </div>
            </div>
          )}

          {activeSection === 'trips' && (
            <div className="profile-section">
              <h2 className="section-title">Trip Planner</h2>
              <div className="profile-card">
                <div className="trip-planner-intro">
                  <h3>Plan Your Adventures</h3>
                  <p>
                    Create and manage your camping trip itineraries with our comprehensive trip
                    planner.
                  </p>
                  <div className="trip-planner-features">
                    <div className="feature-item">
                      <span className="feature-icon">🗺️</span>
                      <span>Create detailed itineraries</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">👥</span>
                      <span>Share trips with friends</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">📅</span>
                      <span>Calendar integration</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">📄</span>
                      <span>Export and print plans</span>
                    </div>
                  </div>
                  <Link to="/trips" className="trip-planner-link">
                    Open Trip Planner
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'reviews' && (
            <div className="profile-section">
              <h2 className="section-title">My Reviews</h2>
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
