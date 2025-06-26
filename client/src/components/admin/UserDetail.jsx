import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './UserDetail.css';

/**
 * UserDetail component displays detailed information about a user for administrators
 * 
 * @returns {JSX.Element} User detail component
 */
const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/users/${id}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user details: ${response.status}`);
        }

        const data = await response.json();
        setUser(data.user);
        setError(null);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.isAdmin && id) {
      fetchUserDetails();
    }
  }, [id, currentUser]);

  const handleToggleAdmin = async () => {
    if (!window.confirm(`Are you sure you want to ${user.isAdmin ? 'remove' : 'grant'} admin privileges for ${user.username}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${id}/toggle-admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.status}`);
      }
      
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user. Please try again later.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to cancel booking: ${response.status}`);
      }
      
      // Update user state by removing the canceled booking
      setUser({
        ...user,
        bookings: user.bookings.filter(booking => booking._id !== bookingId)
      });
    } catch (err) {
      console.error('Error canceling booking:', err);
      alert('Failed to cancel booking. Please try again later.');
    }
  };

  if (!currentUser?.isAdmin) {
    return <div className="user-detail-unauthorized">You do not have permission to access this page.</div>;
  }

  if (loading) {
    return <div className="user-detail-loading">Loading user details...</div>;
  }

  if (error) {
    return <div className="user-detail-error">{error}</div>;
  }

  if (!user) {
    return <div className="user-detail-not-found">User not found</div>;
  }

  return (
    <div className="user-detail">
      <div className="user-detail-header">
        <h1>{user.username}'s Profile</h1>
        <Link to="/admin/users" className="user-detail-back-button">
          Back to Users
        </Link>
      </div>
      
      <div className="user-detail-card">
        <div className="user-detail-info">
          <div className="user-detail-info-item">
            <span className="user-detail-label">Username:</span>
            <span className="user-detail-value">{user.username}</span>
          </div>
          
          <div className="user-detail-info-item">
            <span className="user-detail-label">Email:</span>
            <span className="user-detail-value">{user.email}</span>
          </div>
          
          <div className="user-detail-info-item">
            <span className="user-detail-label">Phone:</span>
            <span className="user-detail-value">{user.phone || 'Not provided'}</span>
          </div>
          
          <div className="user-detail-info-item">
            <span className="user-detail-label">Role:</span>
            <span className={`user-role ${user.isAdmin ? 'admin' : 'user'}`}>
              {user.isAdmin ? 'Admin' : 'User'}
            </span>
          </div>
          
          <div className="user-detail-info-item">
            <span className="user-detail-label">Joined:</span>
            <span className="user-detail-value">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="user-detail-info-item">
            <span className="user-detail-label">Bookings:</span>
            <span className="user-detail-value">{user.bookings?.length || 0}</span>
          </div>
          
          <div className="user-detail-info-item">
            <span className="user-detail-label">Reviews:</span>
            <span className="user-detail-value">{user.reviews?.length || 0}</span>
          </div>
        </div>
        
        <div className="user-detail-actions">
          <button 
            onClick={handleToggleAdmin} 
            className={`user-detail-admin-button ${user.isAdmin ? 'remove' : 'grant'}`}
          >
            {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
          </button>
        </div>
      </div>
      
      <div className="user-detail-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings ({user.bookings?.length || 0})
        </button>
        <button 
          className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({user.reviews?.length || 0})
        </button>
      </div>
      
      <div className="user-detail-tab-content">
        {activeTab === 'profile' && (
          <div className="user-profile-tab">
            <h2>User Profile</h2>
            <p>Manage user details and permissions.</p>
          </div>
        )}
        
        {activeTab === 'bookings' && (
          <div className="user-bookings-tab">
            <h2>User Bookings</h2>
            {user.bookings && user.bookings.length > 0 ? (
              <div className="user-bookings-list">
                {user.bookings.map(booking => (
                  <div key={booking._id} className="user-booking-item">
                    <div className="user-booking-header">
                      <span className="user-booking-title">
                        {booking.campground.title}
                      </span>
                      <span className="user-booking-dates">
                        {new Date(booking.startDate).toLocaleDateString()} - 
                        {new Date(booking.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="user-booking-details">
                      <span>Days: {booking.totalDays}</span>
                      <span className="user-booking-price">
                        ${booking.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="user-booking-actions">
                      <Link 
                        to={`/admin/bookings/${booking._id}`} 
                        className="user-booking-view-button"
                      >
                        View
                      </Link>
                      <button 
                        onClick={() => handleCancelBooking(booking._id)}
                        className="user-booking-cancel-button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="user-no-data">No bookings found for this user.</p>
            )}
          </div>
        )}
        
        {activeTab === 'reviews' && (
          <div className="user-reviews-tab">
            <h2>User Reviews</h2>
            {user.reviews && user.reviews.length > 0 ? (
              <div className="user-reviews-list">
                {user.reviews.map(review => (
                  <div key={review._id} className="user-review-item">
                    <div className="user-review-header">
                      <span className="user-review-campground">
                        {review.campground?.title || 'Unknown Campground'}
                      </span>
                      <div className="user-review-rating">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span 
                            key={i} 
                            className={`star ${i < review.rating ? 'filled' : ''}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="user-review-body">{review.body}</p>
                    <div className="user-review-actions">
                      <Link 
                        to={`/campgrounds/${review.campground?._id}`} 
                        className="user-review-view-button"
                      >
                        View Campground
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="user-no-data">No reviews found for this user.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetail;