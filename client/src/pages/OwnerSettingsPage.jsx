import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import useOwners from '../hooks/useOwners';
import PasswordChangeForm from '../components/PasswordChangeForm';
import { logError } from '../utils/logger';
import './OwnerSettingsPage.css';
import { Link } from 'react-router-dom';

/**
 * Owner Settings Page
 * Modern settings dashboard for campground owners
 */
const OwnerSettingsPage = () => {
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
    businessName: '',
    businessType: 'individual',
    businessPhone: '',
    businessEmail: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Myanmar',
    },
    settings: {
      autoApproveBookings: false,
      allowInstantBooking: true,
      cancellationPolicy: 'moderate',
      minimumStay: 1,
      maximumStay: 30,
      checkInTime: '15:00',
      checkOutTime: '11:00',
    },
  });

  useEffect(() => {
    if (ownerProfile) {
      setFormData({
        businessName: ownerProfile.businessName || '',
        businessType: ownerProfile.businessType || 'individual',
        businessPhone: ownerProfile.businessPhone || '',
        businessEmail: ownerProfile.businessEmail || currentUser?.email || '',
        businessAddress: {
          street: ownerProfile.businessAddress?.street || '',
          city: ownerProfile.businessAddress?.city || '',
          state: ownerProfile.businessAddress?.state || '',
          zipCode: ownerProfile.businessAddress?.zipCode || '',
          country: ownerProfile.businessAddress?.country || 'Myanmar',
        },
        settings: {
          autoApproveBookings: ownerProfile.settings?.autoApproveBookings || false,
          allowInstantBooking: ownerProfile.settings?.allowInstantBooking || true,
          cancellationPolicy: ownerProfile.settings?.cancellationPolicy || 'moderate',
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
      setError('Failed to load profile data. Please try again later.');
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
      showMessage('Profile updated successfully!', 'success');

      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      logError('Error updating profile', err);
      setUpdateError('Failed to update profile. Please try again.');
      showMessage('Failed to update profile. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="owner-loading">
        <div className="owner-loading-spinner"></div>
        <p>Loading your settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-error">
        <h4>Error Loading Settings</h4>
        <p>{error}</p>
        <button onClick={() => refetch()} className="owner-btn owner-btn-primary">
          Retry
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
              <h1>Owner Settings</h1>
              <p className="header-subtitle">
                Manage your business profile, preferences, and account settings
              </p>
            </div>
            <div className="header-stats">
              <div className="header-stat">
                <span className="stat-label">Status</span>
                <span className="stat-value">Active</span>
              </div>
              <div className="header-stat">
                <span className="stat-label">Member Since</span>
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
                  Save Changes
                </button>
              ) : (
                <button onClick={() => setIsEditing(true)} className="owner-btn owner-btn-outline">
                  Edit Profile
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
              <span className="nav-label">Business Profile</span>
            </button>
            <button
              className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Business Settings</span>
            </button>
            <button
              className={`nav-item ${activeSection === 'security' ? 'active' : ''}`}
              onClick={() => setActiveSection('security')}
            >
              <span className="nav-icon">🔒</span>
              <span className="nav-label">Security</span>
            </button>
            <button
              className={`nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveSection('notifications')}
            >
              <span className="nav-icon">🔔</span>
              <span className="nav-label">Notifications</span>
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
              <p>Settings updated successfully!</p>
            </div>
          )}

          {/* Business Profile Section */}
          {activeSection === 'profile' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Business Profile</h2>
                <p className="section-subtitle">
                  Manage your business information and contact details
                </p>
              </div>

              <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                  <label htmlFor="businessName">Business Name *</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter your business name"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="businessType">Business Type</label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                      <option value="organization">Organization</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="businessPhone">Business Phone</label>
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
                  <label htmlFor="businessEmail">Business Email</label>
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
                  <h3>Business Address</h3>
                  <div className="form-group">
                    <label htmlFor="businessAddress.street">Street Address</label>
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
                      <label htmlFor="businessAddress.city">City</label>
                      <input
                        type="text"
                        id="businessAddress.city"
                        name="businessAddress.city"
                        value={formData.businessAddress.city}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Yangon"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="businessAddress.state">State/Region</label>
                      <input
                        type="text"
                        id="businessAddress.state"
                        name="businessAddress.state"
                        value={formData.businessAddress.state}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Yangon Region"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="businessAddress.zipCode">ZIP Code</label>
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
                      <label htmlFor="businessAddress.country">Country</label>
                      <input
                        type="text"
                        id="businessAddress.country"
                        name="businessAddress.country"
                        value={formData.businessAddress.country}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Myanmar"
                      />
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
                <h2>Business Settings</h2>
                <p className="section-subtitle">Configure your default business preferences</p>
              </div>

              <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="settings.checkInTime">Check-in Time</label>
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
                    <label htmlFor="settings.checkOutTime">Check-out Time</label>
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

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="settings.minimumStay">Minimum Stay (nights)</label>
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
                    <label htmlFor="settings.maximumStay">Maximum Stay (nights)</label>
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

                <div className="form-group">
                  <label htmlFor="settings.cancellationPolicy">Cancellation Policy</label>
                  <select
                    id="settings.cancellationPolicy"
                    name="settings.cancellationPolicy"
                    value={formData.settings.cancellationPolicy}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  >
                    <option value="flexible">
                      Flexible - Full refund 24 hours before check-in
                    </option>
                    <option value="moderate">Moderate - Full refund 5 days before check-in</option>
                    <option value="strict">Strict - 50% refund up to 1 week before check-in</option>
                  </select>
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="settings.autoApproveBookings"
                      checked={formData.settings.autoApproveBookings}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                    Auto-approve bookings
                    <small>Automatically approve new booking requests</small>
                  </label>
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="settings.allowInstantBooking"
                      checked={formData.settings.allowInstantBooking}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                    Allow instant booking
                    <small>Allow guests to book immediately without approval</small>
                  </label>
                </div>
              </form>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Security</h2>
                <p className="section-subtitle">Manage your account security and privacy</p>
              </div>

              <PasswordChangeForm />

              <div className="security-options">
                <div className="security-option">
                  <div className="option-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button className="owner-btn owner-btn-outline">Setup 2FA</button>
                </div>

                <div className="security-option">
                  <div className="option-info">
                    <h4>Password Change</h4>
                    <p>Update your password to keep your account secure</p>
                  </div>
                  <Link to="/password-change" className="owner-btn owner-btn-outline">
                    Change Password
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Notification Preferences</h2>
                <p className="section-subtitle">Manage how you receive notifications</p>
              </div>

              <div className="notification-options">
                <div className="notification-item">
                  <div className="notification-info">
                    <h3>New Bookings</h3>
                    <p>Get notified when you receive new booking requests</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Booking Updates</h3>
                    <p>Receive updates when booking status changes</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>New Reviews</h3>
                    <p>Get notified when guests leave reviews</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>System Updates</h3>
                    <p>Receive important system and maintenance updates</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerSettingsPage;
