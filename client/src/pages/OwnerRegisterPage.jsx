import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import useOwners from '../hooks/useOwners';
import { logError } from '../utils/logger';
import './OwnerRegisterPage.css';

/**
 * Owner Registration Page
 * Allows users to register as campground owners
 * If user is not authenticated, they will be prompted to create an account first
 */
const OwnerRegisterPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { useApplyToBeOwner, useOwnerApplication } = useOwners();
  const applyToBeOwnerMutation = useApplyToBeOwner();

  // Check for existing application
  const { data: existingApplication, isLoading: isLoadingApplication } = useOwnerApplication({
    enabled: isAuthenticated,
    retry: false,
    onError: () => {
      // Application not found, user can apply
    },
  });

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'individual',
    businessRegistrationNumber: '',
    taxId: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Thailand',
    },
    businessPhone: '',
    businessEmail: currentUser?.email || '',
    bankingInfo: {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      swiftCode: '',
    },
    settings: {
      minimumStay: 1,
      maximumStay: 30,
      checkInTime: '15:00',
      checkOutTime: '11:00',
    },
    applicationReason: '', // Added for application reason
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const totalSteps = 4;

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

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Business Information
        if (!formData.businessName.trim()) {
          newErrors.businessName = t('ownerRegister.validation.businessNameRequired');
        }
        if (!formData.businessType) {
          newErrors.businessType = t('ownerRegister.validation.businessTypeRequired');
        }
        if (!formData.businessPhone.trim()) {
          newErrors.businessPhone = t('ownerRegister.validation.businessPhoneRequired');
        }
        if (!formData.businessEmail.trim()) {
          newErrors.businessEmail = t('ownerRegister.validation.businessEmailRequired');
        }
        break;

      case 2: // Business Address
        if (!formData.businessAddress.street.trim()) {
          newErrors['businessAddress.street'] = t('ownerRegister.validation.streetRequired');
        }
        if (!formData.businessAddress.city.trim()) {
          newErrors['businessAddress.city'] = t('ownerRegister.validation.cityRequired');
        }
        if (!formData.businessAddress.state.trim()) {
          newErrors['businessAddress.state'] = t('ownerRegister.validation.stateRequired');
        }
        if (!formData.businessAddress.zipCode.trim()) {
          newErrors['businessAddress.zipCode'] = t('ownerRegister.validation.zipCodeRequired');
        }
        break;

      case 3: // Banking Information (optional but validate if provided)
        if (formData.bankingInfo.accountNumber && !formData.bankingInfo.accountHolderName.trim()) {
          newErrors['bankingInfo.accountHolderName'] = t(
            'ownerRegister.validation.accountHolderNameRequired'
          );
        }
        if (formData.bankingInfo.accountNumber && !formData.bankingInfo.bankName.trim()) {
          newErrors['bankingInfo.bankName'] = t('ownerRegister.validation.bankNameRequired');
        }
        break;

      case 4: // Settings (no validation needed, all have defaults)
        if (!formData.applicationReason.trim()) {
          newErrors.applicationReason = t('ownerRegister.validation.applicationReasonRequired');
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    try {
      const response = await applyToBeOwnerMutation.mutateAsync(formData);

      // Show the message from the server or a default success message
      addSuccessMessage(response.message || t('ownerRegister.success.title'));

      // Reset resubmission state
      setIsResubmitting(false);

      // Redirect to verification page for pending applications
      navigate('/owner/verification');
    } catch (error) {
      logError('Registration error', error);
      addErrorMessage(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const handleResubmit = () => {
    setIsResubmitting(true);
    // Reset form data to empty state to allow resubmission
    setFormData({
      businessName: '',
      businessType: 'individual',
      businessRegistrationNumber: '',
      taxId: '',
      businessAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Thailand',
      },
      businessPhone: '',
      businessEmail: currentUser?.email || '',
      bankingInfo: {
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        swiftCode: '',
      },
      settings: {
        minimumStay: 1,
        maximumStay: 30,
        checkInTime: '15:00',
        checkOutTime: '11:00',
      },
      applicationReason: '',
    });
    setErrors({});
    setCurrentStep(1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-step">
            <h3>{t('ownerRegister.businessInformation.title')}</h3>

            <div className="form-group">
              <label htmlFor="businessName">
                {t('ownerRegister.businessInformation.businessName')}
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className={errors.businessName ? 'error' : ''}
                placeholder={t('ownerRegister.businessInformation.businessNamePlaceholder')}
              />
              {errors.businessName && <span className="error-message">{errors.businessName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="businessType">
                {t('ownerRegister.businessInformation.businessType')}
              </label>
              <select
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                className={errors.businessType ? 'error' : ''}
              >
                <option value="individual">
                  {t('ownerRegister.businessInformation.businessTypes.individual')}
                </option>
                <option value="company">
                  {t('ownerRegister.businessInformation.businessTypes.company')}
                </option>
                <option value="organization">
                  {t('ownerRegister.businessInformation.businessTypes.organization')}
                </option>
              </select>
              {errors.businessType && <span className="error-message">{errors.businessType}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessRegistrationNumber">
                  {t('ownerRegister.businessInformation.registrationNumber')}
                </label>
                <input
                  type="text"
                  id="businessRegistrationNumber"
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleInputChange}
                  placeholder={t('ownerRegister.businessInformation.registrationNumberPlaceholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="taxId">{t('ownerRegister.businessInformation.taxId')}</label>
                <input
                  type="text"
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  placeholder={t('ownerRegister.businessInformation.taxIdPlaceholder')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessPhone">
                  {t('ownerRegister.businessInformation.businessPhone')}
                </label>
                <input
                  type="tel"
                  id="businessPhone"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleInputChange}
                  className={errors.businessPhone ? 'error' : ''}
                  placeholder={t('ownerRegister.businessInformation.businessPhonePlaceholder')}
                />
                {errors.businessPhone && (
                  <span className="error-message">{errors.businessPhone}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="businessEmail">
                  {t('ownerRegister.businessInformation.businessEmail')}
                </label>
                <input
                  type="email"
                  id="businessEmail"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleInputChange}
                  className={errors.businessEmail ? 'error' : ''}
                  placeholder={t('ownerRegister.businessInformation.businessEmailPlaceholder')}
                />
                {errors.businessEmail && (
                  <span className="error-message">{errors.businessEmail}</span>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-step">
            <h3>{t('ownerRegister.businessAddress.title')}</h3>

            <div className="form-group">
              <label htmlFor="businessAddress.street">
                {t('ownerRegister.businessAddress.streetAddress')}
              </label>
              <input
                type="text"
                id="businessAddress.street"
                name="businessAddress.street"
                value={formData.businessAddress.street}
                onChange={handleInputChange}
                className={errors['businessAddress.street'] ? 'error' : ''}
                placeholder={t('ownerRegister.businessAddress.streetAddressPlaceholder')}
              />
              {errors['businessAddress.street'] && (
                <span className="error-message">{errors['businessAddress.street']}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessAddress.city">
                  {t('ownerRegister.businessAddress.city')}
                </label>
                <input
                  type="text"
                  id="businessAddress.city"
                  name="businessAddress.city"
                  value={formData.businessAddress.city}
                  onChange={handleInputChange}
                  className={errors['businessAddress.city'] ? 'error' : ''}
                  placeholder={t('ownerRegister.businessAddress.cityPlaceholder')}
                />
                {errors['businessAddress.city'] && (
                  <span className="error-message">{errors['businessAddress.city']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="businessAddress.state">
                  {t('ownerRegister.businessAddress.state')}
                </label>
                <input
                  type="text"
                  id="businessAddress.state"
                  name="businessAddress.state"
                  value={formData.businessAddress.state}
                  onChange={handleInputChange}
                  className={errors['businessAddress.state'] ? 'error' : ''}
                  placeholder={t('ownerRegister.businessAddress.statePlaceholder')}
                />
                {errors['businessAddress.state'] && (
                  <span className="error-message">{errors['businessAddress.state']}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessAddress.zipCode">
                  {t('ownerRegister.businessAddress.zipCode')}
                </label>
                <input
                  type="text"
                  id="businessAddress.zipCode"
                  name="businessAddress.zipCode"
                  value={formData.businessAddress.zipCode}
                  onChange={handleInputChange}
                  className={errors['businessAddress.zipCode'] ? 'error' : ''}
                  placeholder={t('ownerRegister.businessAddress.zipCodePlaceholder')}
                />
                {errors['businessAddress.zipCode'] && (
                  <span className="error-message">{errors['businessAddress.zipCode']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="businessAddress.country">
                  {t('ownerRegister.businessAddress.country')}
                </label>
                <input
                  type="hidden"
                  id="businessAddress.country"
                  name="businessAddress.country"
                  value="Thailand"
                />
                <input type="text" value="Thailand" disabled className="disabled-input" />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-step">
            <h3>{t('ownerRegister.bankingInformation.title')}</h3>
            <p className="step-description">{t('ownerRegister.bankingInformation.description')}</p>

            <div className="form-group">
              <label htmlFor="bankingInfo.accountHolderName">
                {t('ownerRegister.bankingInformation.accountHolderName')}
              </label>
              <input
                type="text"
                id="bankingInfo.accountHolderName"
                name="bankingInfo.accountHolderName"
                value={formData.bankingInfo.accountHolderName}
                onChange={handleInputChange}
                className={errors['bankingInfo.accountHolderName'] ? 'error' : ''}
                placeholder={t('ownerRegister.bankingInformation.accountHolderNamePlaceholder')}
              />
              {errors['bankingInfo.accountHolderName'] && (
                <span className="error-message">{errors['bankingInfo.accountHolderName']}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bankingInfo.bankName">
                  {t('ownerRegister.bankingInformation.bankName')}
                </label>
                <input
                  type="text"
                  id="bankingInfo.bankName"
                  name="bankingInfo.bankName"
                  value={formData.bankingInfo.bankName}
                  onChange={handleInputChange}
                  className={errors['bankingInfo.bankName'] ? 'error' : ''}
                  placeholder={t('ownerRegister.bankingInformation.bankNamePlaceholder')}
                />
                {errors['bankingInfo.bankName'] && (
                  <span className="error-message">{errors['bankingInfo.bankName']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="bankingInfo.accountNumber">
                  {t('ownerRegister.bankingInformation.accountNumber')}
                </label>
                <input
                  type="text"
                  id="bankingInfo.accountNumber"
                  name="bankingInfo.accountNumber"
                  value={formData.bankingInfo.accountNumber}
                  onChange={handleInputChange}
                  placeholder={t('ownerRegister.bankingInformation.accountNumberPlaceholder')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bankingInfo.routingNumber">
                  {t('ownerRegister.bankingInformation.routingNumber')}
                </label>
                <input
                  type="text"
                  id="bankingInfo.routingNumber"
                  name="bankingInfo.routingNumber"
                  value={formData.bankingInfo.routingNumber}
                  onChange={handleInputChange}
                  placeholder={t('ownerRegister.bankingInformation.routingNumberPlaceholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bankingInfo.swiftCode">
                  {t('ownerRegister.bankingInformation.swiftCode')}
                </label>
                <input
                  type="text"
                  id="bankingInfo.swiftCode"
                  name="bankingInfo.swiftCode"
                  value={formData.bankingInfo.swiftCode}
                  onChange={handleInputChange}
                  placeholder={t('ownerRegister.bankingInformation.swiftCodePlaceholder')}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-step">
            <h3>{t('ownerRegister.bookingSettings.title')}</h3>
            <p className="step-description">{t('ownerRegister.bookingSettings.description')}</p>

            <div className="form-group">
              <label htmlFor="settings.minimumStay">
                {t('ownerRegister.bookingSettings.minimumStay')}
              </label>
              <input
                type="number"
                id="settings.minimumStay"
                name="settings.minimumStay"
                value={formData.settings.minimumStay}
                onChange={handleInputChange}
                min="1"
                max="30"
              />
            </div>

            <div className="form-group">
              <label htmlFor="settings.maximumStay">
                {t('ownerRegister.bookingSettings.maximumStay')}
              </label>
              <input
                type="number"
                id="settings.maximumStay"
                name="settings.maximumStay"
                value={formData.settings.maximumStay}
                onChange={handleInputChange}
                min="1"
                max="365"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="settings.checkInTime">
                  {t('ownerRegister.bookingSettings.checkInTime')}
                </label>
                <input
                  type="time"
                  id="settings.checkInTime"
                  name="settings.checkInTime"
                  value={formData.settings.checkInTime}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings.checkOutTime">
                  {t('ownerRegister.bookingSettings.checkOutTime')}
                </label>
                <input
                  type="time"
                  id="settings.checkOutTime"
                  name="settings.checkOutTime"
                  value={formData.settings.checkOutTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="applicationReason">
                {t('ownerRegister.bookingSettings.applicationReason')}
              </label>
              <textarea
                id="applicationReason"
                name="applicationReason"
                value={formData.applicationReason}
                onChange={handleInputChange}
                className={errors.applicationReason ? 'error' : ''}
                placeholder={t('ownerRegister.bookingSettings.applicationReasonPlaceholder')}
              ></textarea>
              {errors.applicationReason && (
                <span className="error-message">{errors.applicationReason}</span>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading state while checking application status
  if (isLoadingApplication) {
    return (
      <div className={`owner-register-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <div className="owner-page-header">
          <div className="header-content">
            <div className="header-main">
              <div className="greeting-section">
                <h1>{t('ownerRegister.title')}</h1>
                <p className="header-subtitle">{t('ownerRegister.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="profile-content">
          <div className="owner-card">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show existing application status
  if (existingApplication && !isResubmitting) {
    const isRejected = existingApplication.status === 'rejected';
    const isPending = existingApplication.status === 'pending';
    const isUnderReview = existingApplication.status === 'under_review';
    const isApproved = existingApplication.status === 'approved';

    return (
      <div className={`owner-register-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <div className="owner-page-header">
          <div className="header-content">
            <div className="header-main">
              <div className="greeting-section">
                <h1>{t('ownerRegister.title')}</h1>
                <p className="header-subtitle">{t('ownerRegister.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="profile-content">
          <div className="owner-card">
            <div className="application-status">
              {isRejected && (
                <>
                  <div className="status-icon rejected">
                    <span>❌</span>
                  </div>
                  <h2>{t('ownerRegister.applicationRejected')}</h2>
                  <p>{t('ownerRegister.applicationRejectedMessage')}</p>
                  {existingApplication.rejectionReason && (
                    <div className="rejection-reason">
                      <h3>{t('ownerRegister.rejectionReason')}:</h3>
                      <p>{existingApplication.rejectionReason}</p>
                    </div>
                  )}
                  <div className="action-buttons">
                    <button className="common-btn common-btn-primary" onClick={handleResubmit}>
                      {t('ownerRegister.resubmitApplication')}
                    </button>
                  </div>
                </>
              )}

              {isPending && (
                <>
                  <div className="status-icon pending">
                    <span>⏳</span>
                  </div>
                  <h2>{t('ownerRegister.applicationPending')}</h2>
                  <p>{t('ownerRegister.applicationPendingMessage')}</p>
                  <div className="application-details">
                    <p>
                      <strong>{t('ownerRegister.businessName')}:</strong>{' '}
                      {existingApplication.businessName}
                    </p>
                    <p>
                      <strong>{t('ownerRegister.submittedOn')}:</strong>{' '}
                      {new Date(existingApplication.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}

              {isUnderReview && (
                <>
                  <div className="status-icon under-review">
                    <span>🔍</span>
                  </div>
                  <h2>{t('ownerRegister.applicationUnderReview')}</h2>
                  <p>{t('ownerRegister.applicationUnderReviewMessage')}</p>
                  <div className="application-details">
                    <p>
                      <strong>{t('ownerRegister.businessName')}:</strong>{' '}
                      {existingApplication.businessName}
                    </p>
                    <p>
                      <strong>{t('ownerRegister.submittedOn')}:</strong>{' '}
                      {new Date(existingApplication.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}

              {isApproved && (
                <>
                  <div className="status-icon approved">
                    <span>✅</span>
                  </div>
                  <h2>{t('ownerRegister.applicationApproved')}</h2>
                  <p>{t('ownerRegister.applicationApprovedMessage')}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login/register prompt
  if (!isAuthenticated) {
    return (
      <div className={`owner-register-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <div className="owner-page-header">
          <div className="header-content">
            <div className="greeting-section">
              <h1>{t('ownerRegister.title')}</h1>
              <p className="header-subtitle">{t('ownerRegister.subtitle')}</p>
            </div>

            <div className="header-stats">
              <div className="header-stat">
                <div className="stat-value">1000+</div>
                <div className="stat-label">{t('ownerRegister.headerStats.activeOwners')}</div>
              </div>
              <div className="header-stat">
                <div className="stat-value">95%</div>
                <div className="stat-label">{t('ownerRegister.headerStats.approvalRate')}</div>
              </div>
              <div className="header-stat">
                <div className="stat-value">24h</div>
                <div className="stat-label">{t('ownerRegister.headerStats.responseTime')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-content">
          <div className="owner-card auth-required-card">
            <div className="auth-required-content">
              <div className="auth-icon">
                <span>🔐</span>
              </div>

              <h2>{t('ownerRegister.authRequired.title')}</h2>
              <p className="auth-description">{t('ownerRegister.authRequired.description')}</p>

              <div className="auth-benefits">
                <h3>{t('ownerRegister.authRequired.benefitsTitle')}</h3>
                <ul>
                  <li>{t('ownerRegister.authRequired.benefits.earnMoney')}</li>
                  <li>{t('ownerRegister.authRequired.benefits.analytics')}</li>
                  <li>{t('ownerRegister.authRequired.benefits.tools')}</li>
                  <li>{t('ownerRegister.authRequired.benefits.mobile')}</li>
                  <li>{t('ownerRegister.authRequired.benefits.reach')}</li>
                </ul>
              </div>

              <div className="auth-buttons">
                <Link to="/register" className="btn btn-primary">
                  {t('ownerRegister.authRequired.createAccount')}
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  {t('ownerRegister.authRequired.signIn')}
                </Link>
              </div>

              <div className="auth-footer">
                <p>
                  {t('ownerRegister.authRequired.alreadyHaveAccount')}{' '}
                  <Link to="/owner/dashboard">{t('ownerRegister.authRequired.goToDashboard')}</Link>
                </p>
                <p>
                  {t('ownerRegister.authRequired.needHelp')}{' '}
                  <a href="mailto:support@adventuremate.com">
                    {t('ownerRegister.authRequired.contactSupport')}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`owner-register-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="register-container">
        <div className="register-header">
          <h1>{t('ownerRegister.title')}</h1>
          <p>{t('ownerRegister.subtitle')}</p>
        </div>

        <div className="progress-bar">
          <div className="progress-steps">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`progress-step ${step <= currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
              >
                <span className="step-number">{step}</span>
                <span className="step-label">
                  {step === 1 && t('ownerRegister.progressSteps.businessInfo')}
                  {step === 2 && t('ownerRegister.progressSteps.address')}
                  {step === 3 && t('ownerRegister.progressSteps.banking')}
                  {step === 4 && t('ownerRegister.progressSteps.settings')}
                </span>
              </div>
            ))}
          </div>
          <div className="progress-line">
            <div
              className="progress-fill"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {renderStepContent()}

          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" onClick={handlePrevious} className="btn btn-secondary">
                {t('ownerRegister.formActions.previous')}
              </button>
            )}

            {currentStep < totalSteps ? (
              <button type="button" onClick={handleNext} className="btn btn-primary">
                {t('ownerRegister.formActions.next')}
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={applyToBeOwnerMutation.isLoading}
              >
                {applyToBeOwnerMutation.isLoading
                  ? t('ownerRegister.formActions.registering')
                  : t('ownerRegister.formActions.completeRegistration')}
              </button>
            )}
          </div>
        </form>

        <div className="register-footer">
          <p>
            {t('ownerRegister.footer.alreadyHaveAccount')}{' '}
            <Link to="/owner/dashboard">{t('ownerRegister.footer.goToDashboard')}</Link>
          </p>
          <p>
            {t('ownerRegister.footer.needHelp')}{' '}
            <a href="mailto:support@adventuremate.com">
              {t('ownerRegister.footer.contactSupport')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerRegisterPage;
