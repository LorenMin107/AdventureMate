import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import './AdminBookingDetail.css';

/**
 * AdminBookingDetail component displays detailed information about a booking for admin users
 * 
 * @param {Object} props - Component props
 * @param {Object} props.initialBooking - Initial booking data (optional)
 * @returns {JSX.Element} Admin booking detail component
 */
const AdminBookingDetail = ({ initialBooking = null }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [booking, setBooking] = useState(initialBooking);
  const [loading, setLoading] = useState(!initialBooking);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we have initial booking data, no need to fetch
    if (initialBooking) {
      setBooking(initialBooking);
      setLoading(false);
      return;
    }

    // Only fetch if user is admin and we have an ID
    if (!currentUser?.isAdmin || !id) {
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bookings/${id}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch booking: ${response.status}`);
        }

        const data = await response.json();
        setBooking(data.booking);
        setError(null);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, initialBooking, currentUser]);

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-booking-detail-unauthorized">
        You do not have permission to view this page.
      </div>
    );
  }

  if (loading) {
    return <div className="admin-booking-detail-loading">Loading booking details...</div>;
  }

  if (error) {
    return <div className="admin-booking-detail-error">{error}</div>;
  }

  if (!booking) {
    return <div className="admin-booking-detail-not-found">Booking not found</div>;
  }

  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString();
  };

  const { campground, campsite, user, startDate, endDate, totalDays, totalPrice, sessionId, createdAt, status, paid } = booking;

  return (
    <div className="admin-booking-detail">
      <h2 className="admin-booking-detail-title">Booking Details</h2>

      <div className="admin-booking-detail-card">
        {/* Left Column - Trip Summary */}
        <div className="admin-booking-detail-header">
          <div className="admin-booking-detail-image">
            {campground.images && campground.images.length > 0 ? (
              <img 
                src={campground.images[0].url} 
                alt={campground.title} 
              />
            ) : (
              <div className="admin-booking-detail-no-image">
                No image available
              </div>
            )}
          </div>

          <div className="admin-booking-detail-campground-info">
            <h3>{campground.title}</h3>
            <p className="admin-booking-detail-location">{campground.location}</p>

            {campsite && (
              <div className="admin-booking-detail-campsite-info">
                <h4>Campsite: {campsite.name}</h4>
                {campsite.price && (
                  <p className="admin-booking-detail-campsite-price">
                    ${campsite.price} per night
                  </p>
                )}
                {campsite.capacity && (
                  <p className="admin-booking-detail-campsite-capacity">
                    Capacity: {campsite.capacity} {campsite.capacity === 1 ? 'person' : 'people'}
                  </p>
                )}
                {campsite.features && campsite.features.length > 0 && (
                  <div className="admin-booking-detail-campsite-features">
                    <p>Features:</p>
                    <div className="admin-booking-detail-feature-tags">
                      {campsite.features.map((feature, index) => (
                        <span key={index} className="admin-booking-detail-feature-tag">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="admin-booking-detail-trip-dates">
            <h4>Trip Information</h4>
            <div className="admin-booking-detail-dates-container">
              <div className="admin-booking-detail-date-box">
                <div className="admin-booking-detail-date-label">Check-in</div>
                <div className="admin-booking-detail-date-value">{formatDate(startDate)}</div>
              </div>

              <div className="admin-booking-detail-dates-divider">→</div>

              <div className="admin-booking-detail-date-box">
                <div className="admin-booking-detail-date-label">Checkout</div>
                <div className="admin-booking-detail-date-value">{formatDate(endDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Booking Details */}
        <div className="admin-booking-detail-info">
          {/* User Information Section */}
          <div className="admin-booking-detail-section">
            <div className="admin-booking-detail-section-header">
              <h4 className="admin-booking-detail-section-title">User Information</h4>
            </div>
            <div className="admin-booking-detail-section-content">
              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">Username</span>
                <span className="admin-booking-detail-value">{user.username}</span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">Email</span>
                <span className="admin-booking-detail-value">{user.email}</span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">User ID</span>
                <span className="admin-booking-detail-value">{user._id}</span>
              </div>
            </div>
          </div>

          {/* Reservation Details Section */}
          <div className="admin-booking-detail-section">
            <div className="admin-booking-detail-section-header">
              <h4 className="admin-booking-detail-section-title">Reservation details</h4>
            </div>
            <div className="admin-booking-detail-section-content">
              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">Booking ID</span>
                <span className="admin-booking-detail-value">{booking._id}</span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">Booking Date</span>
                <span className="admin-booking-detail-value">{formatDate(createdAt)}</span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">Total nights</span>
                <span className="admin-booking-detail-value">{totalDays}</span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">Status</span>
                <span className={`admin-booking-detail-value admin-booking-detail-status admin-booking-detail-status-${status}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>

              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">Payment Status</span>
                <span className={`admin-booking-detail-value admin-booking-detail-payment-status ${paid ? 'paid' : 'unpaid'}`}>
                  {paid ? 'Paid' : 'Unpaid'}
                </span>
              </div>

              {sessionId && (
                <div className="admin-booking-detail-info-item transaction-id-item">
                  <span className="admin-booking-detail-label">Transaction ID</span>
                  <span className="admin-booking-detail-value transaction-id-value" title={sessionId}>
                    {sessionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Price Details Section */}
          <div className="admin-booking-detail-section">
            <div className="admin-booking-detail-section-header">
              <h4 className="admin-booking-detail-section-title">Price details</h4>
            </div>
            <div className="admin-booking-detail-section-content">
              <div className="admin-booking-detail-info-item">
                <span className="admin-booking-detail-label">${(totalPrice / totalDays).toFixed(2)} × {totalDays} nights</span>
                <span className="admin-booking-detail-value">${totalPrice.toFixed(2)}</span>
              </div>

              <div className="admin-booking-detail-price-breakdown">
                <div className="admin-booking-detail-info-item">
                  <span className="admin-booking-detail-label">Total (USD)</span>
                  <span className="admin-booking-detail-value admin-booking-detail-price">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="admin-booking-detail-footer">
            <Link to="/admin/bookings" className="admin-booking-detail-back-button">
              Back to Bookings
            </Link>

            <Link 
              to={`/admin/users/${user._id}`} 
              className="admin-booking-detail-user-button"
            >
              View User
            </Link>

            <Link 
              to={`/admin/campgrounds`} 
              className="admin-booking-detail-campground-button"
            >
              View Campgrounds
            </Link>

            <Link 
              to={`/admin/campsites`} 
              className="admin-booking-detail-campsite-button"
            >
              Manage Campsites
            </Link>

            {campsite && (
              <Link 
                to={`/campsites/${campsite._id}`} 
                className="admin-booking-detail-campsite-button"
              >
                View Campsite
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

AdminBookingDetail.propTypes = {
  initialBooking: PropTypes.object
};

export default AdminBookingDetail;
