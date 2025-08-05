import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import useOwners from '../hooks/useOwners';
import { logError } from '../utils/logger';
import './OwnerRegisterPage.css'; // Reuse the same CSS

/**
 * Owner Create Profile Page
 * Modern profile creation for users assigned as owners by admin
 */
const OwnerCreateProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showMessage } = useFlashMessage();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { useRegisterOwner } = useOwners();
  const registerOwnerMutation = useRegisterOwner();

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
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
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
          newErrors.businessName = t('ownerCreateProfile.validation.businessNameRequired');
        }
        if (!formData.businessType) {
          newErrors.businessType = t('ownerCreateProfile.validation.businessTypeRequired');
        }
        if (!formData.businessPhone.trim()) {
          newErrors.businessPhone = t('ownerCreateProfile.validation.businessPhoneRequired');
        }
        if (!formData.businessEmail.trim()) {
          newErrors.businessEmail = t('ownerCreateProfile.validation.businessEmailRequired');
        }
        break;

      case 2: // Business Address
        if (!formData.businessAddress.street.trim()) {
          newErrors['businessAddress.street'] = t('ownerCreateProfile.validation.streetRequired');
        }
        if (!formData.businessAddress.city.trim()) {
          newErrors['businessAddress.city'] = t('ownerCreateProfile.validation.cityRequired');
        }
        if (!formData.businessAddress.state.trim()) {
          newErrors['businessAddress.state'] = t('ownerCreateProfile.validation.stateRequired');
        }
        if (!formData.businessAddress.zipCode.trim()) {
          newErrors['businessAddress.zipCode'] = t('ownerCreateProfile.validation.zipCodeRequired');
        }
        break;

      case 3: // Banking Information (optional but validate if provided)
        if (formData.bankingInfo.accountNumber && !formData.bankingInfo.accountHolderName.trim()) {
          newErrors['bankingInfo.accountHolderName'] = t(
            'ownerCreateProfile.validation.accountHolderNameRequired'
          );
        }
        if (formData.bankingInfo.accountNumber && !formData.bankingInfo.bankName.trim()) {
          newErrors['bankingInfo.bankName'] = t('ownerCreateProfile.validation.bankNameRequired');
        }
        break;

      case 4: // Settings (no validation needed, all have defaults)
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
      await registerOwnerMutation.mutateAsync(formData);
      showMessage(t('ownerCreateProfile.success.title'), 'success');
      navigate('/owner/dashboard');
    } catch (error) {
      logError('Profile creation error', error);
      showMessage(
        error.response?.data?.message || 'Profile creation failed. Please try again.',
        'error'
      );
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-step">
            <div className="step-header">
              <h3>{t('ownerCreateProfile.businessInformation.title')}</h3>
              <p className="step-description">
                {t('ownerCreateProfile.businessInformation.description')}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="businessName">
                {t('ownerCreateProfile.businessInformation.businessName')}
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className={errors.businessName ? 'error' : ''}
                placeholder={t('ownerCreateProfile.businessInformation.businessNamePlaceholder')}
              />
              {errors.businessName && <span className="error-message">{errors.businessName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="businessType">
                {t('ownerCreateProfile.businessInformation.businessType')}
              </label>
              <select
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                className={errors.businessType ? 'error' : ''}
              >
                <option value="individual">
                  {t('ownerCreateProfile.businessInformation.businessTypes.individual')}
                </option>
                <option value="company">
                  {t('ownerCreateProfile.businessInformation.businessTypes.company')}
                </option>
                <option value="organization">
                  {t('ownerCreateProfile.businessInformation.businessTypes.organization')}
                </option>
              </select>
              {errors.businessType && <span className="error-message">{errors.businessType}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessRegistrationNumber">
                  {t('ownerCreateProfile.businessInformation.registrationNumber')}
                </label>
                <input
                  type="text"
                  id="businessRegistrationNumber"
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleInputChange}
                  placeholder={t(
                    'ownerCreateProfile.businessInformation.registrationNumberPlaceholder'
                  )}
                />
              </div>

              <div className="form-group">
                <label htmlFor="taxId">{t('ownerCreateProfile.businessInformation.taxId')}</label>
                <input
                  type="text"
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  placeholder={t('ownerCreateProfile.businessInformation.taxIdPlaceholder')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessPhone">
                  {t('ownerCreateProfile.businessInformation.businessPhone')}
                </label>
                <input
                  type="tel"
                  id="businessPhone"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleInputChange}
                  className={errors.businessPhone ? 'error' : ''}
                  placeholder={t('ownerCreateProfile.businessInformation.businessPhonePlaceholder')}
                />
                {errors.businessPhone && (
                  <span className="error-message">{errors.businessPhone}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="businessEmail">
                  {t('ownerCreateProfile.businessInformation.businessEmail')}
                </label>
                <input
                  type="email"
                  id="businessEmail"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleInputChange}
                  className={errors.businessEmail ? 'error' : ''}
                  placeholder={t('ownerCreateProfile.businessInformation.businessEmailPlaceholder')}
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
            <div className="step-header">
              <h3>{t('ownerCreateProfile.businessAddress.title')}</h3>
              <p className="step-description">
                {t('ownerCreateProfile.businessAddress.description')}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="businessAddress.street">
                {t('ownerCreateProfile.businessAddress.streetAddress')}
              </label>
              <input
                type="text"
                id="businessAddress.street"
                name="businessAddress.street"
                value={formData.businessAddress.street}
                onChange={handleInputChange}
                className={errors['businessAddress.street'] ? 'error' : ''}
                placeholder={t('ownerCreateProfile.businessAddress.streetAddressPlaceholder')}
              />
              {errors['businessAddress.street'] && (
                <span className="error-message">{errors['businessAddress.street']}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessAddress.city">
                  {t('ownerCreateProfile.businessAddress.city')}
                </label>
                <input
                  type="text"
                  id="businessAddress.city"
                  name="businessAddress.city"
                  value={formData.businessAddress.city}
                  onChange={handleInputChange}
                  className={errors['businessAddress.city'] ? 'error' : ''}
                  placeholder={t('ownerCreateProfile.businessAddress.cityPlaceholder')}
                />
                {errors['businessAddress.city'] && (
                  <span className="error-message">{errors['businessAddress.city']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="businessAddress.state">
                  {t('ownerCreateProfile.businessAddress.state')}
                </label>
                <input
                  type="text"
                  id="businessAddress.state"
                  name="businessAddress.state"
                  value={formData.businessAddress.state}
                  onChange={handleInputChange}
                  className={errors['businessAddress.state'] ? 'error' : ''}
                  placeholder={t('ownerCreateProfile.businessAddress.statePlaceholder')}
                />
                {errors['businessAddress.state'] && (
                  <span className="error-message">{errors['businessAddress.state']}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessAddress.zipCode">
                  {t('ownerCreateProfile.businessAddress.zipCode')}
                </label>
                <input
                  type="text"
                  id="businessAddress.zipCode"
                  name="businessAddress.zipCode"
                  value={formData.businessAddress.zipCode}
                  onChange={handleInputChange}
                  className={errors['businessAddress.zipCode'] ? 'error' : ''}
                  placeholder={t('ownerCreateProfile.businessAddress.zipCodePlaceholder')}
                />
                {errors['businessAddress.zipCode'] && (
                  <span className="error-message">{errors['businessAddress.zipCode']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="businessAddress.country">
                  {t('ownerCreateProfile.businessAddress.country')}
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
            <div className="step-header">
              <h3>{t('ownerCreateProfile.bankingInformation.title')}</h3>
              <p className="step-description">
                {t('ownerCreateProfile.bankingInformation.description')}
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bankingInfo.accountHolderName">
                  {t('ownerCreateProfile.bankingInformation.accountHolderName')}
                </label>
                <input
                  type="text"
                  id="bankingInfo.accountHolderName"
                  name="bankingInfo.accountHolderName"
                  value={formData.bankingInfo.accountHolderName}
                  onChange={handleInputChange}
                  className={errors['bankingInfo.accountHolderName'] ? 'error' : ''}
                  placeholder={t(
                    'ownerCreateProfile.bankingInformation.accountHolderNamePlaceholder'
                  )}
                />
                {errors['bankingInfo.accountHolderName'] && (
                  <span className="error-message">{errors['bankingInfo.accountHolderName']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="bankingInfo.bankName">
                  {t('ownerCreateProfile.bankingInformation.bankName')}
                </label>
                <input
                  type="text"
                  id="bankingInfo.bankName"
                  name="bankingInfo.bankName"
                  value={formData.bankingInfo.bankName}
                  onChange={handleInputChange}
                  className={errors['bankingInfo.bankName'] ? 'error' : ''}
                  placeholder={t('ownerCreateProfile.bankingInformation.bankNamePlaceholder')}
                />
                {errors['bankingInfo.bankName'] && (
                  <span className="error-message">{errors['bankingInfo.bankName']}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bankingInfo.accountNumber">
                  {t('ownerCreateProfile.bankingInformation.accountNumber')}
                </label>
                <input
                  type="text"
                  id="bankingInfo.accountNumber"
                  name="bankingInfo.accountNumber"
                  value={formData.bankingInfo.accountNumber}
                  onChange={handleInputChange}
                  placeholder={t('ownerCreateProfile.bankingInformation.accountNumberPlaceholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bankingInfo.routingNumber">
                  {t('ownerCreateProfile.bankingInformation.routingNumber')}
                </label>
                <input
                  type="text"
                  id="bankingInfo.routingNumber"
                  name="bankingInfo.routingNumber"
                  value={formData.bankingInfo.routingNumber}
                  onChange={handleInputChange}
                  placeholder={t('ownerCreateProfile.bankingInformation.routingNumberPlaceholder')}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bankingInfo.swiftCode">
                {t('ownerCreateProfile.bankingInformation.swiftCode')}
              </label>
              <input
                type="text"
                id="bankingInfo.swiftCode"
                name="bankingInfo.swiftCode"
                value={formData.bankingInfo.swiftCode}
                onChange={handleInputChange}
                placeholder={t('ownerCreateProfile.bankingInformation.swiftCodePlaceholder')}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-step">
            <div className="step-header">
              <h3>{t('ownerCreateProfile.businessSettings.title')}</h3>
              <p className="step-description">
                {t('ownerCreateProfile.businessSettings.description')}
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="settings.checkInTime">
                  {t('ownerCreateProfile.businessSettings.checkInTime')}
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
                  {t('ownerCreateProfile.businessSettings.checkOutTime')}
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="settings.minimumStay">
                  {t('ownerCreateProfile.businessSettings.minimumStay')}
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
                  {t('ownerCreateProfile.businessSettings.maximumStay')}
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
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`owner-register-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Enhanced Page Header */}
      <div className="owner-page-header">
        <div className="header-content">
          <div className="header-main">
            <div className="greeting-section">
              <h1>{t('ownerCreateProfile.title')}</h1>
              <p className="header-subtitle">{t('ownerCreateProfile.subtitle')}</p>
            </div>
            <div className="header-stats">
              <div className="header-stat">
                <span className="stat-label">{t('ownerCreateProfile.progress.step')}</span>
                <span className="stat-value">
                  {currentStep}/{totalSteps}
                </span>
              </div>
              <div className="header-stat">
                <span className="stat-label">{t('ownerCreateProfile.progress.progress')}</span>
                <span className="stat-value">{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="profile-content">
        {/* Enhanced Progress Bar */}
        <div className="owner-card progress-card">
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
        </div>

        {/* Enhanced Form */}
        <div className="owner-card form-card">
          <form onSubmit={handleSubmit} className="register-form">
            {renderStepContent()}

            <div className="form-actions">
              {currentStep > 1 && (
                <button type="button" onClick={handlePrevious} className="btn btn-secondary">
                  {t('ownerCreateProfile.formActions.previous')}
                </button>
              )}

              {currentStep < totalSteps ? (
                <button type="button" onClick={handleNext} className="btn btn-primary">
                  {t('ownerCreateProfile.formActions.next')}
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={registerOwnerMutation.isLoading}
                >
                  {registerOwnerMutation.isLoading
                    ? t('ownerCreateProfile.formActions.creatingProfile')
                    : t('ownerCreateProfile.formActions.completeProfile')}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Enhanced Footer */}
        <div className="owner-card footer-card">
          <div className="register-footer">
            <div className="footer-content">
              <p>
                {t('ownerCreateProfile.footer.alreadyHaveAccount')}{' '}
                <Link to="/owner/dashboard">{t('ownerCreateProfile.footer.goToDashboard')}</Link>
              </p>
              <p>
                {t('ownerCreateProfile.footer.needHelp')}{' '}
                <a href="mailto:support@adventuremate.com">
                  {t('ownerCreateProfile.footer.contactSupport')}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerCreateProfilePage;
