import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
            <h1>{t('ownerVerification.verifyingAccount')}</h1>
            <p>{t('ownerVerification.pleaseWait')}</p>
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
          <h1>{t('ownerVerification.title')}</h1>
          <p>{t('ownerVerification.subtitle')}</p>
        </div>

        <div className={`verification-status ${status}`}>
          {status === 'pending' && (
            <>
              <div className="status-icon pending"></div>
              <h2>{t('ownerVerification.applicationUnderReview')}</h2>
              <p>{t('ownerVerification.applicationUnderReviewDescription')}</p>
              <div className="next-steps">
                <h3>{t('ownerVerification.whatsNext')}</h3>
                <ul>
                  <li>{t('ownerVerification.nextSteps.reviewBusinessInfo')}</li>
                  <li>{t('ownerVerification.nextSteps.contactForInfo')}</li>
                  <li>{t('ownerVerification.nextSteps.listCampgrounds')}</li>
                </ul>
              </div>
            </>
          )}

          {status === 'under_review' && (
            <>
              <div className="status-icon under-review"></div>
              <h2>{t('ownerVerification.verificationInProgress')}</h2>
              <p>{t('ownerVerification.verificationInProgressDescription')}</p>
              <div className="next-steps">
                <h3>{t('ownerVerification.whatsNext')}</h3>
                <ul>
                  <li>{t('ownerVerification.nextSteps.reviewDocumentation')}</li>
                  <li>{t('ownerVerification.nextSteps.contactForInfo')}</li>
                  <li>{t('ownerVerification.nextSteps.verifiedListCampgrounds')}</li>
                </ul>
              </div>
            </>
          )}

          {status === 'verified' && (
            <>
              <div className="status-icon verified"></div>
              <h2>{t('ownerVerification.verificationComplete')}</h2>
              <p>{t('ownerVerification.verificationCompleteDescription')}</p>
              <div className="verification-actions">
                <Link to="/owner/dashboard" className="btn btn-primary">
                  {t('ownerVerification.goToOwnerDashboard')}
                </Link>
                <Link to="/owner/campgrounds/new" className="btn btn-secondary">
                  {t('ownerVerification.listFirstCampground')}
                </Link>
              </div>
            </>
          )}

          {status === 'rejected' && (
            <>
              <div className="status-icon rejected"></div>
              <h2>{t('ownerVerification.verificationUnsuccessful')}</h2>
              <p>{t('ownerVerification.verificationUnsuccessfulDescription')}</p>
              {ownerData?.rejectionReason && (
                <div className="rejection-reason">
                  <h3>{t('ownerVerification.reason')}</h3>
                  <p>{ownerData.rejectionReason}</p>
                </div>
              )}
              <div className="verification-actions">
                <Link to="/owner/register" className="btn btn-primary">
                  {t('ownerVerification.updateApplication')}
                </Link>
                <a href="mailto:support@adventuremate.com" className="btn btn-secondary">
                  {t('ownerVerification.contactSupport')}
                </a>
              </div>
            </>
          )}

          {status === 'not_found' && (
            <>
              <div className="status-icon not-found"></div>
              <h2>{t('ownerVerification.noApplicationFound')}</h2>
              <p>{t('ownerVerification.noApplicationFoundDescription')}</p>
              <div className="verification-actions">
                <Link to="/owner/register" className="btn btn-primary">
                  {t('ownerVerification.applyAsOwner')}
                </Link>
                <a href="mailto:support@adventuremate.com" className="btn btn-secondary">
                  {t('ownerVerification.contactSupport')}
                </a>
              </div>
            </>
          )}
        </div>

        <div className="verification-footer">
          <p>
            {t('ownerVerification.haveQuestions')}{' '}
            <a href="mailto:support@adventuremate.com">
              {t('ownerVerification.contactSupportTeam')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerVerificationPage;
