import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import { useTheme } from '../context/ThemeContext';
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
  const { useApplyToBeOwner } = useOwners();
  const applyToBeOwnerMutation = useApplyToBeOwner();

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
      country: 'Myanmar',
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
      autoApproveBookings: false,
      allowInstantBooking: true,
      cancellationPolicy: 'moderate',
      minimumStay: 1,
      maximumStay: 30,
      checkInTime: '15:00',
      checkOutTime: '11:00',
    },
    applicationReason: '', // Added for application reason
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
          newErrors.businessName = 'Business name is required';
        }
        if (!formData.businessType) {
          newErrors.businessType = 'Business type is required';
        }
        if (!formData.businessPhone.trim()) {
          newErrors.businessPhone = 'Business phone is required';
        }
        if (!formData.businessEmail.trim()) {
          newErrors.businessEmail = 'Business email is required';
        }
        break;

      case 2: // Business Address
        if (!formData.businessAddress.street.trim()) {
          newErrors['businessAddress.street'] = 'Street address is required';
        }
        if (!formData.businessAddress.city.trim()) {
          newErrors['businessAddress.city'] = 'City is required';
        }
        if (!formData.businessAddress.state.trim()) {
          newErrors['businessAddress.state'] = 'State is required';
        }
        if (!formData.businessAddress.zipCode.trim()) {
          newErrors['businessAddress.zipCode'] = 'ZIP code is required';
        }
        break;

      case 3: // Banking Information (optional but validate if provided)
        if (formData.bankingInfo.accountNumber && !formData.bankingInfo.accountHolderName.trim()) {
          newErrors['bankingInfo.accountHolderName'] =
            'Account holder name is required when account number is provided';
        }
        if (formData.bankingInfo.accountNumber && !formData.bankingInfo.bankName.trim()) {
          newErrors['bankingInfo.bankName'] =
            'Bank name is required when account number is provided';
        }
        break;

      case 4: // Settings (no validation needed, all have defaults)
        if (!formData.applicationReason.trim()) {
          newErrors.applicationReason = 'Application reason is required';
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
      addSuccessMessage(
        response.message ||
          'Your owner application has been submitted and is pending review. You will be notified once it is approved.'
      );

      // Redirect to verification page for pending applications
      navigate('/owner/verification');
    } catch (error) {
      logError('Registration error', error);
      addErrorMessage(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-step">
            <h3>Business Information</h3>

            <div className="form-group">
              <label htmlFor="businessName">Business Name *</label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className={errors.businessName ? 'error' : ''}
                placeholder="Enter your business name"
              />
              {errors.businessName && <span className="error-message">{errors.businessName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="businessType">Business Type *</label>
              <select
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                className={errors.businessType ? 'error' : ''}
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="organization">Organization</option>
              </select>
              {errors.businessType && <span className="error-message">{errors.businessType}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessRegistrationNumber">Registration Number</label>
                <input
                  type="text"
                  id="businessRegistrationNumber"
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleInputChange}
                  placeholder="Business registration number (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="taxId">Tax ID</label>
                <input
                  type="text"
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  placeholder="Tax identification number (optional)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessPhone">Business Phone *</label>
                <input
                  type="tel"
                  id="businessPhone"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleInputChange}
                  className={errors.businessPhone ? 'error' : ''}
                  placeholder="+95 xxx xxx xxxx"
                />
                {errors.businessPhone && (
                  <span className="error-message">{errors.businessPhone}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="businessEmail">Business Email *</label>
                <input
                  type="email"
                  id="businessEmail"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleInputChange}
                  className={errors.businessEmail ? 'error' : ''}
                  placeholder="business@example.com"
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
            <h3>Business Address</h3>

            <div className="form-group">
              <label htmlFor="businessAddress.street">Street Address *</label>
              <input
                type="text"
                id="businessAddress.street"
                name="businessAddress.street"
                value={formData.businessAddress.street}
                onChange={handleInputChange}
                className={errors['businessAddress.street'] ? 'error' : ''}
                placeholder="Enter street address"
              />
              {errors['businessAddress.street'] && (
                <span className="error-message">{errors['businessAddress.street']}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessAddress.city">City *</label>
                <input
                  type="text"
                  id="businessAddress.city"
                  name="businessAddress.city"
                  value={formData.businessAddress.city}
                  onChange={handleInputChange}
                  className={errors['businessAddress.city'] ? 'error' : ''}
                  placeholder="City"
                />
                {errors['businessAddress.city'] && (
                  <span className="error-message">{errors['businessAddress.city']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="businessAddress.state">State/Region *</label>
                <input
                  type="text"
                  id="businessAddress.state"
                  name="businessAddress.state"
                  value={formData.businessAddress.state}
                  onChange={handleInputChange}
                  className={errors['businessAddress.state'] ? 'error' : ''}
                  placeholder="State or Region"
                />
                {errors['businessAddress.state'] && (
                  <span className="error-message">{errors['businessAddress.state']}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessAddress.zipCode">ZIP Code *</label>
                <input
                  type="text"
                  id="businessAddress.zipCode"
                  name="businessAddress.zipCode"
                  value={formData.businessAddress.zipCode}
                  onChange={handleInputChange}
                  className={errors['businessAddress.zipCode'] ? 'error' : ''}
                  placeholder="ZIP Code"
                />
                {errors['businessAddress.zipCode'] && (
                  <span className="error-message">{errors['businessAddress.zipCode']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="businessAddress.country">Country</label>
                <select
                  id="businessAddress.country"
                  name="businessAddress.country"
                  value={formData.businessAddress.country}
                  onChange={handleInputChange}
                >
                  <option value="Myanmar">Myanmar</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Vietnam">Vietnam</option>
                  <option value="Laos">Laos</option>
                  <option value="Cambodia">Cambodia</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-step">
            <h3>Banking Information</h3>
            <p className="step-description">
              Banking information is optional but required for receiving payments. You can add this
              later in your profile settings.
            </p>

            <div className="form-group">
              <label htmlFor="bankingInfo.accountHolderName">Account Holder Name</label>
              <input
                type="text"
                id="bankingInfo.accountHolderName"
                name="bankingInfo.accountHolderName"
                value={formData.bankingInfo.accountHolderName}
                onChange={handleInputChange}
                className={errors['bankingInfo.accountHolderName'] ? 'error' : ''}
                placeholder="Full name as on bank account"
              />
              {errors['bankingInfo.accountHolderName'] && (
                <span className="error-message">{errors['bankingInfo.accountHolderName']}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bankingInfo.bankName">Bank Name</label>
                <input
                  type="text"
                  id="bankingInfo.bankName"
                  name="bankingInfo.bankName"
                  value={formData.bankingInfo.bankName}
                  onChange={handleInputChange}
                  className={errors['bankingInfo.bankName'] ? 'error' : ''}
                  placeholder="Bank name"
                />
                {errors['bankingInfo.bankName'] && (
                  <span className="error-message">{errors['bankingInfo.bankName']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="bankingInfo.accountNumber">Account Number</label>
                <input
                  type="text"
                  id="bankingInfo.accountNumber"
                  name="bankingInfo.accountNumber"
                  value={formData.bankingInfo.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Bank account number"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bankingInfo.routingNumber">Routing Number</label>
                <input
                  type="text"
                  id="bankingInfo.routingNumber"
                  name="bankingInfo.routingNumber"
                  value={formData.bankingInfo.routingNumber}
                  onChange={handleInputChange}
                  placeholder="Routing number (if applicable)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bankingInfo.swiftCode">SWIFT Code</label>
                <input
                  type="text"
                  id="bankingInfo.swiftCode"
                  name="bankingInfo.swiftCode"
                  value={formData.bankingInfo.swiftCode}
                  onChange={handleInputChange}
                  placeholder="SWIFT/BIC code (if applicable)"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-step">
            <h3>Booking Settings</h3>
            <p className="step-description">
              Configure your default booking settings. You can change these later in your dashboard.
            </p>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="settings.autoApproveBookings"
                  checked={formData.settings.autoApproveBookings}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Auto-approve bookings
              </label>
              <small>Automatically approve booking requests without manual review</small>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="settings.allowInstantBooking"
                  checked={formData.settings.allowInstantBooking}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Allow instant booking
              </label>
              <small>Allow guests to book immediately without approval</small>
            </div>

            <div className="form-group">
              <label htmlFor="settings.cancellationPolicy">Cancellation Policy</label>
              <select
                id="settings.cancellationPolicy"
                name="settings.cancellationPolicy"
                value={formData.settings.cancellationPolicy}
                onChange={handleInputChange}
              >
                <option value="flexible">Flexible - Full refund 24 hours before check-in</option>
                <option value="moderate">Moderate - Full refund 5 days before check-in</option>
                <option value="strict">Strict - 50% refund up to 1 week before check-in</option>
              </select>
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
                  min="1"
                  max="365"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="settings.checkInTime">Check-in Time</label>
                <input
                  type="time"
                  id="settings.checkInTime"
                  name="settings.checkInTime"
                  value={formData.settings.checkInTime}
                  onChange={handleInputChange}
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
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="applicationReason">Application Reason *</label>
              <textarea
                id="applicationReason"
                name="applicationReason"
                value={formData.applicationReason}
                onChange={handleInputChange}
                className={errors.applicationReason ? 'error' : ''}
                placeholder="Please provide a brief explanation for your application."
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

  // If user is not authenticated, show login/register prompt
  if (!isAuthenticated) {
    return (
      <div className={`owner-register-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <div className="register-container">
          <div className="register-header">
            <h1>Become a Campground Owner</h1>
            <p>
              Join MyanCamp as a verified campground owner and start earning from your property.
            </p>
          </div>

          <div className="auth-required-message">
            <h2>Create an Account or Sign In</h2>
            <p>You need to have an account to register as a campground owner.</p>
            <div className="auth-buttons">
              <Link to="/register" className="btn btn-primary">
                Create Account
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
            </div>
          </div>

          <div className="register-footer">
            <p>
              Need help? <a href="mailto:support@myancamp.com">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`owner-register-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="register-container">
        <div className="register-header">
          <h1>Become a Campground Owner</h1>
          <p>Join MyanCamp as a verified campground owner and start earning from your property.</p>
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
                  {step === 1 && 'Business Info'}
                  {step === 2 && 'Address'}
                  {step === 3 && 'Banking'}
                  {step === 4 && 'Settings'}
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
                Previous
              </button>
            )}

            {currentStep < totalSteps ? (
              <button type="button" onClick={handleNext} className="btn btn-primary">
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={applyToBeOwnerMutation.isLoading}
              >
                {applyToBeOwnerMutation.isLoading ? 'Registering...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </form>

        <div className="register-footer">
          <p>
            Already have an owner account? <Link to="/owner/dashboard">Go to Dashboard</Link>
          </p>
          <p>
            Need help? <a href="mailto:support@myancamp.com">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerRegisterPage;
