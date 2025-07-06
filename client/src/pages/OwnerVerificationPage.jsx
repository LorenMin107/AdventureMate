import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useOwners from '../hooks/useOwners';
import './OwnerVerificationPage.css';

/**
 * Owner Verification Page
 * Shows the status of the owner verification process
 * and provides guidance on next steps
 */
const OwnerVerificationPage = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { useOwnerProfile } = useOwners();
  const [status, setStatus] = useState('loading');
  const [ownerData, setOwnerData] = useState(null);

  const { data, isLoading, isError } = useOwnerProfile({
    onSuccess: (data) => {
      setOwnerData(data);
      setStatus(data.verificationStatus || 'pending');
    },
    onError: () => {
      setStatus('not_found');
    },
  });

  if (isLoading) {
    return (
      <div className={`owner-verification-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <div className="verification-container">
          <div className="verification-header">
            <h1>Verifying Your Account</h1>
            <p>Please wait while we check your account status...</p>
          </div>
          <div className="verification-loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`owner-verification-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="verification-container">
        <div className="verification-header">
          <h1>Owner Account Verification</h1>
          <p>Thank you for applying to become a campground owner on MyanCamp.</p>
        </div>

        <div className={`verification-status ${status}`}>
          {status === 'pending' && (
            <>
              <div className="status-icon pending"></div>
              <h2>Application Under Review</h2>
              <p>
                Your application is currently being reviewed by our team. This process typically
                takes 1-3 business days. We'll notify you by email once the review is complete.
              </p>
              <div className="next-steps">
                <h3>What's Next?</h3>
                <ul>
                  <li>Our team will review your business information</li>
                  <li>You may be contacted for additional information if needed</li>
                  <li>Once approved, you'll be able to list your campgrounds</li>
                </ul>
              </div>
            </>
          )}

          {status === 'under_review' && (
            <>
              <div className="status-icon under-review"></div>
              <h2>Verification In Progress</h2>
              <p>
                We're currently verifying your business information. This process typically takes
                1-3 business days. We'll notify you by email once the verification is complete.
              </p>
              <div className="next-steps">
                <h3>What's Next?</h3>
                <ul>
                  <li>Our team is reviewing your documentation</li>
                  <li>You may be contacted for additional information if needed</li>
                  <li>Once verified, you'll be able to list your campgrounds</li>
                </ul>
              </div>
            </>
          )}

          {status === 'verified' && (
            <>
              <div className="status-icon verified"></div>
              <h2>Verification Complete!</h2>
              <p>
                Congratulations! Your account has been verified as a campground owner. You can now
                list your properties and start accepting bookings.
              </p>
              <div className="verification-actions">
                <Link to="/owner/dashboard" className="btn btn-primary">
                  Go to Owner Dashboard
                </Link>
                <Link to="/owner/campgrounds/new" className="btn btn-secondary">
                  List Your First Campground
                </Link>
              </div>
            </>
          )}

          {status === 'rejected' && (
            <>
              <div className="status-icon rejected"></div>
              <h2>Verification Unsuccessful</h2>
              <p>
                Unfortunately, we were unable to verify your business information. Please review the
                feedback below and reapply with the requested information.
              </p>
              {ownerData?.rejectionReason && (
                <div className="rejection-reason">
                  <h3>Reason:</h3>
                  <p>{ownerData.rejectionReason}</p>
                </div>
              )}
              <div className="verification-actions">
                <Link to="/owner/register" className="btn btn-primary">
                  Update Application
                </Link>
                <a href="mailto:support@myancamp.com" className="btn btn-secondary">
                  Contact Support
                </a>
              </div>
            </>
          )}

          {status === 'not_found' && (
            <>
              <div className="status-icon not-found"></div>
              <h2>No Application Found</h2>
              <p>
                We couldn't find an owner application for your account. If you believe this is an
                error, please contact our support team.
              </p>
              <div className="verification-actions">
                <Link to="/owner/register" className="btn btn-primary">
                  Apply as Owner
                </Link>
                <a href="mailto:support@myancamp.com" className="btn btn-secondary">
                  Contact Support
                </a>
              </div>
            </>
          )}
        </div>

        <div className="verification-footer">
          <p>
            Have questions? <a href="mailto:support@myancamp.com">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerVerificationPage;
