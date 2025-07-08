import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  FiX,
  FiUser,
  FiUserPlus,
  FiMail,
  FiTrash2,
  FiClock,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi';
import apiClient from '../utils/api';
import Avatar from './common/Avatar';
import './ShareTripDialog.css';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const ShareTripDialog = ({ trip, onClose, onUpdate }) => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('collaborators');
  const [pendingInvites, setPendingInvites] = useState([]);

  useEffect(() => {
    if (trip) {
      fetchCollaborators();
      fetchPendingInvites();
    }
  }, [trip]);

  const fetchCollaborators = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/trips/${trip._id}/collaborators`);
      setCollaborators(response.data.collaborators || []);
    } catch (err) {
      setError('Failed to load collaborators');
      console.error('Error fetching collaborators:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      const response = await apiClient.get(`/trips/${trip._id}/invites`);
      setPendingInvites(response.data.invites || []);
    } catch (err) {
      setPendingInvites([]);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setInviteLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.post(`/trips/${trip._id}/invite`, { email });
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      setTimeout(() => {
        fetchCollaborators();
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invitation. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.delete(`/trips/${trip._id}/collaborators/${userId}`);
      setSuccess('Collaborator removed successfully');
      fetchCollaborators();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove collaborator');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvite = async (inviteEmail) => {
    if (!window.confirm(`Cancel invite for ${inviteEmail}?`)) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.delete(`/trips/${trip._id}/invites/${encodeURIComponent(inviteEmail)}`);
      setSuccess('Invite cancelled');
      fetchPendingInvites();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel invite');
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return null;

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Helper to get owner display info (handles both string and object)
  const getOwnerDisplay = () => {
    if (!trip.user) return { name: 'Owner', email: '' };
    if (typeof trip.user === 'string') return { name: 'Owner', email: '' };
    return {
      name: trip.user.username || 'Owner',
      email: trip.user.email || '',
    };
  };
  const ownerDisplay = getOwnerDisplay();

  // Helper to check if current user is the owner
  const isOwner =
    currentUser && trip.user && typeof trip.user !== 'string' && currentUser._id === trip.user._id;

  // Theme-based class for dialog
  const themeClass = theme === 'dark' ? 'dark-theme' : '';

  // Auto-dismiss success/error messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div
      className={`share-dialog-overlay ${themeClass}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`share-dialog ${themeClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
      >
        <div className="share-dialog-header">
          <div className="header-content">
            <h2 id="share-dialog-title">Share "{trip.title}"</h2>
            <p className="dialog-subtitle">Invite collaborators to view and edit this trip</p>
          </div>
          <button onClick={onClose} className="close-button" aria-label="Close dialog">
            <FiX size={24} />
          </button>
        </div>

        <div className="share-dialog-content">
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === 'collaborators' ? 'active' : ''}`}
              onClick={() => setActiveTab('collaborators')}
              type="button"
              aria-selected={activeTab === 'collaborators'}
            >
              <FiUser className="tab-icon" /> Collaborators
            </button>
            {isOwner && (
              <button
                className={`tab-button ${activeTab === 'invite' ? 'active' : ''}`}
                onClick={() => setActiveTab('invite')}
                type="button"
                aria-selected={activeTab === 'invite'}
              >
                <FiUserPlus className="tab-icon" /> Invite People
              </button>
            )}
          </div>

          {activeTab === 'invite' && isOwner && (
            <div className="invite-section">
              <form onSubmit={handleInvite} className="invite-form" autoComplete="off">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <FiMail className="input-icon" /> Email address
                  </label>
                  <p className="input-hint">
                    Enter the email address of the person you want to invite
                  </p>
                  <div className="invite-input-group">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="email-input"
                      required
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={inviteLoading || !email.includes('@')}
                      className="invite-button"
                    >
                      {inviteLoading ? (
                        <span className="button-loading">Sending...</span>
                      ) : (
                        <>
                          <FiUserPlus className="button-icon" />
                          <span>Send Invite</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {error && (
                <div className="status-message error" role="alert">
                  <FiAlertCircle className="status-icon" />
                  {error}
                </div>
              )}
              {success && (
                <div className="status-message success" role="status">
                  <FiCheck className="status-icon" />
                  {success}
                </div>
              )}

              <div className="invite-tips">
                <h4>Sharing tips</h4>
                <ul>
                  <li>Invite people by their email address</li>
                  <li>Collaborators can view and edit this trip</li>
                  <li>You can remove collaborators at any time</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'collaborators' && (
            <div className="collaborators-section">
              <div className="section-header">
                <h3>People with access</h3>
                <span className="badge">{collaborators.length + 1 + pendingInvites.length}</span>
              </div>

              <div className="collaborators-list">
                <div className="owner-section-card">
                  <div className="owner-section-content">
                    <div className="owner-avatar-block">
                      <Avatar
                        name={
                          currentUser &&
                          trip.user &&
                          typeof trip.user !== 'string' &&
                          currentUser._id === trip.user._id
                            ? currentUser.username || 'You'
                            : ownerDisplay.name
                        }
                        size="medium"
                        showFullFirstName={true}
                      />
                    </div>
                    <div className="owner-details-vertical">
                      <span className="owner-name">
                        {currentUser &&
                        trip.user &&
                        typeof trip.user !== 'string' &&
                        currentUser._id === trip.user._id
                          ? 'You'
                          : ownerDisplay.name}
                      </span>
                      <span className="owner-email">
                        {currentUser &&
                        trip.user &&
                        typeof trip.user !== 'string' &&
                        currentUser._id === trip.user._id
                          ? currentUser.email
                          : ownerDisplay.email}
                      </span>
                      <span className="owner-role-badge">
                        <FiUser className="role-icon" /> Owner
                      </span>
                    </div>
                  </div>
                </div>
                {pendingInvites.map((invite) => (
                  <div key={invite.email} className="collaborator-item">
                    <div className="user-info">
                      <Avatar name={invite.email} email={invite.email} size="medium" />
                      <div className="user-details">
                        <span className="user-name">{invite.email}</span>
                        <span className="user-email">(Pending)</span>
                      </div>
                    </div>
                    <span className="collaborator-role">
                      <FiClock className="role-icon" /> Pending
                    </span>
                    {isOwner && (
                      <button
                        className="remove-button"
                        onClick={() => handleCancelInvite(invite.email)}
                        aria-label={`Cancel invite for ${invite.email}`}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
                {loading ? (
                  <div className="collaborator-item loading">Loading collaborators...</div>
                ) : collaborators.length === 0 && pendingInvites.length === 0 ? (
                  <div className="no-collaborators">No collaborators yet.</div>
                ) : (
                  collaborators.map((collaborator) => (
                    <div key={collaborator._id} className="owner-section-card collaborator-card">
                      <div className="owner-section-content">
                        <div className="owner-avatar-block">
                          <Avatar
                            name={collaborator.username || collaborator.email}
                            email={collaborator.email}
                            size="medium"
                            showFullFirstName={true}
                          />
                        </div>
                        <div className="owner-details-vertical">
                          <span className="owner-name">
                            {/* Show first name only, like owner */}
                            {(collaborator.username || collaborator.email).split(/\s|@/)[0]}
                          </span>
                          <span className="owner-email">{collaborator.email}</span>
                          <span className="owner-role-badge">
                            <FiUser className="role-icon" /> Collaborator
                          </span>
                        </div>
                        {isOwner && (
                          <button
                            className="remove-button"
                            onClick={() => handleRemoveCollaborator(collaborator._id)}
                            aria-label={`Remove ${collaborator.username || collaborator.email}`}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ShareTripDialog.propTypes = {
  trip: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    user: PropTypes.shape({
      _id: PropTypes.string,
      username: PropTypes.string,
      email: PropTypes.string,
    }),
  }),
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func,
};

export default ShareTripDialog;
