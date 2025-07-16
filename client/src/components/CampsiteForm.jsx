import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MaskedInput from 'react-text-mask';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';
import apiClient from '../utils/api';
import './CampsiteForm.css';
import { logInfo, logError } from '../utils/logger';

/**
 * CampsiteForm component for creating and editing campsites
 *
 * @param {Object} props - Component props
 * @param {string} props.campgroundId - ID of the parent campground
 * @param {Object} props.campsite - Existing campsite data for editing (optional)
 * @param {boolean} props.isEditing - Whether the form is for editing (true) or creating (false)
 */
const CampsiteForm = ({ campgroundId, campsite = null, isEditing = false }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Configure the currency mask
  const currencyMask = createNumberMask({
    prefix: '$',
    suffix: '',
    includeThousandsSeparator: true,
    thousandsSeparatorSymbol: ',',
    allowDecimal: true,
    decimalSymbol: '.',
    decimalLimit: 2,
    integerLimit: 7,
    allowNegative: false,
    allowLeadingZeroes: false,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    capacity: 1,
    features: [],
    availability: true,
  });

  const [featureInput, setFeatureInput] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize form data if editing an existing campsite
  useEffect(() => {
    if (campsite && isEditing) {
      setFormData({
        name: campsite.name || '',
        description: campsite.description || '',
        price: campsite.price || '',
        capacity: campsite.capacity || 1,
        features: campsite.features || [],
        availability: campsite.availability !== undefined ? campsite.availability : true,
      });

      if (campsite.images && campsite.images.length > 0) {
        setExistingImages(campsite.images);
      }
    }
  }, [campsite, isEditing]);

  // Helper function to format price for display
  const formatPrice = (price) => {
    if (!price) return '';
    // Remove any non-numeric characters except decimal point
    const numericValue = price.toString().replace(/[^0-9.]/g, '');
    return numericValue;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Special handling for price field
    if (name === 'price') {
      // Extract numeric value from masked input
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Handle price input change from masked input
  const handlePriceChange = (e) => {
    const rawValue = e.target.value;
    // Extract numeric value from masked input (remove $ and commas)
    const numericValue = rawValue.replace(/[$,]/g, '');

    setFormData((prev) => ({
      ...prev,
      price: numericValue,
    }));

    // Clear validation error
    if (validationErrors.price) {
      setValidationErrors((prev) => ({
        ...prev,
        price: null,
      }));
    }
  };

  // Handle feature input
  const handleFeatureInputChange = (e) => {
    setFeatureInput(e.target.value);
  };

  // Add a feature
  const addFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput('');
    }
  };

  // Remove a feature
  const removeFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);

    // Create preview URLs for the selected images
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  // Remove a selected image
  const removeSelectedImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle an existing image for deletion
  const toggleImageForDeletion = (filename) => {
    if (imagesToDelete.includes(filename)) {
      setImagesToDelete((prev) => prev.filter((name) => name !== filename));
    } else {
      setImagesToDelete((prev) => [...prev, filename]);
    }
  };

  // Validate the form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = t('campsites.nameRequired');
    }

    if (!formData.description.trim()) {
      errors.description = t('campsites.descriptionRequired');
    }

    // Validate price - ensure it's a valid number after removing any formatting
    const priceValue = formData.price ? formData.price.toString().replace(/[$,]/g, '') : '';
    if (!priceValue) {
      errors.price = t('campsites.priceRequired');
    } else if (isNaN(priceValue) || parseFloat(priceValue) <= 0) {
      errors.price = t('campsites.pricePositive');
    }

    if (!formData.capacity || formData.capacity < 1) {
      errors.capacity = t('campsites.capacityPositive');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create FormData object for file uploads
      const formDataToSend = new FormData();

      // Nest campsite data under 'campsite' property as expected by the schema
      formDataToSend.append('campsite[name]', formData.name);
      formDataToSend.append('campsite[description]', formData.description);

      // Ensure price is a clean numeric value without formatting
      const cleanPrice = formData.price ? formData.price.toString().replace(/[$,]/g, '') : '';
      formDataToSend.append('campsite[price]', cleanPrice);

      formDataToSend.append('campsite[capacity]', formData.capacity);
      formDataToSend.append('campsite[availability]', formData.availability);

      // Add features as an array
      formData.features.forEach((feature) => {
        formDataToSend.append('campsite[features][]', feature);
      });

      // Add images to form data
      images.forEach((image) => {
        formDataToSend.append('image', image);
      });

      // Add images to delete if editing
      if (isEditing && imagesToDelete.length > 0) {
        imagesToDelete.forEach((filename) => {
          formDataToSend.append('deleteImages[]', filename);
        });
      }

      // Determine URL and method based on whether we're creating or editing
      const url = isEditing
        ? `/campsites/${campsite?._id}`
        : `/campgrounds/${campgroundId}/campsites`;

      const method = isEditing ? 'PUT' : 'POST';

      // Send the request using apiClient
      const response =
        method === 'PUT'
          ? await apiClient.put(url, formDataToSend)
          : await apiClient.post(url, formDataToSend);

      // With apiClient (axios), the response data is already parsed as JSON
      const data = response.data;

      // Check if the response is in the standardized format
      const campsiteData = data.status && data.data ? data.data.campsite : data.campsite;

      // Log success
      logInfo('Campsite saved successfully', campsiteData);

      // Navigate back to the campground detail page
      navigate(`/campgrounds/${campgroundId}`);
    } catch (err) {
      logError('Error saving campsite', err);

      // Handle axios error responses
      if (err.response && err.response.data) {
        const errorData = err.response.data;

        // Check if the response is in the standardized format with field-specific errors
        if (errorData.status === 'error') {
          // Handle field-specific errors
          if (errorData.error && typeof errorData.error === 'object' && errorData.error.errors) {
            const fieldErrors = {};
            errorData.error.errors.forEach((err) => {
              // Convert API field names (e.g., 'campsite.name') to form field names (e.g., 'name')
              const fieldName = err.field.replace('campsite.', '');
              fieldErrors[fieldName] = err.message;
            });
            setValidationErrors(fieldErrors);
            setError('Please correct the validation errors');
            return;
          } else {
            // Handle general error message
            setError(errorData.error || errorData.message || 'Failed to save campsite');
          }
        } else {
          // Handle legacy error format
          setError(errorData.error || t('campsites.saveError'));
        }
      } else {
        // Handle network errors or other exceptions
        setError(err.message || t('campsites.saveErrorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="campsite-form-container">
      <h2>{isEditing ? t('campsites.editCampsite') : t('campsites.createCampsite')}</h2>

      {error && <div className="form-error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="campsite-form">
        <div className="form-group">
          <label htmlFor="name">{t('campsites.name')}</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={validationErrors.name ? 'error' : ''}
            disabled={loading}
          />
          {validationErrors.name && <div className="validation-error">{validationErrors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="price">{t('campsites.price')}</label>
          <div className={`currency-input-container ${validationErrors.price ? 'has-error' : ''}`}>
            <MaskedInput
              mask={currencyMask}
              id="price"
              name="price"
              value={
                formData.price
                  ? typeof formData.price === 'string' && formData.price.startsWith('$')
                    ? formData.price
                    : `$${formData.price}`
                  : ''
              }
              onChange={handlePriceChange}
              className={`currency-input ${validationErrors.price ? 'error' : ''}`}
              placeholder="$0.00"
              disabled={loading}
              guide={false}
              keepCharPositions={false}
            />
          </div>
          {validationErrors.price && (
            <div className="validation-error">{validationErrors.price}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="capacity">{t('campsites.capacity')}</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="1"
            className={validationErrors.capacity ? 'error' : ''}
            disabled={loading}
          />
          {validationErrors.capacity && (
            <div className="validation-error">{validationErrors.capacity}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">{t('campsites.description')}</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            className={validationErrors.description ? 'error' : ''}
            disabled={loading}
          ></textarea>
          {validationErrors.description && (
            <div className="validation-error">{validationErrors.description}</div>
          )}
        </div>

        <div className="form-group">
          <label>{t('campsites.features')}</label>
          <div className="feature-input-container">
            <input
              type="text"
              id="feature-input"
              value={featureInput}
              onChange={handleFeatureInputChange}
              placeholder={t('campsites.addFeaturePlaceholder')}
              disabled={loading}
            />
            <button
              type="button"
              onClick={addFeature}
              disabled={!featureInput.trim() || loading}
              className="add-feature-button"
            >
              {t('campsites.addFeature')}
            </button>
          </div>

          {formData.features.length > 0 && (
            <div className="features-list">
              {formData.features.map((feature, index) => (
                <div key={index} className="feature-tag">
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="remove-feature-button"
                    disabled={loading}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="availability" className="checkbox-label">
            <input
              type="checkbox"
              id="availability"
              name="availability"
              checked={formData.availability}
              onChange={handleChange}
              disabled={loading}
            />
            {t('campsites.availability')}
          </label>
        </div>

        <div className="form-group">
          <label>{t('campsites.images')}</label>

          {/* Existing images (for editing) */}
          {isEditing && existingImages.length > 0 && (
            <div className="existing-images">
              <p>{t('campsites.currentImages')}</p>
              <div className="image-preview-container">
                {existingImages.map((image, index) => (
                  <div
                    key={index}
                    className={`image-preview ${imagesToDelete.includes(image.filename) ? 'marked-for-deletion' : ''}`}
                  >
                    <img src={image.url} alt={`Campsite ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-button"
                      onClick={() => toggleImageForDeletion(image.filename)}
                    >
                      {imagesToDelete.includes(image.filename)
                        ? t('campsites.restore')
                        : t('campsites.remove')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New image upload */}
          <div className="image-upload">
            <input
              type="file"
              id="images"
              name="images"
              onChange={handleImageChange}
              multiple
              accept="image/*"
              disabled={loading}
            />
            <label htmlFor="images" className="upload-button">
              {t('campsites.selectImages')}
            </label>
          </div>

          {/* Preview of selected images */}
          {imagePreviews.length > 0 && (
            <div className="image-preview-container">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image-button"
                    onClick={() => removeSelectedImage(index)}
                  >
                    {t('campsites.remove')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate(`/campgrounds/${campgroundId}`)}
            disabled={loading}
          >
            {t('campsites.cancel')}
          </button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading
              ? t('campsites.saving')
              : isEditing
                ? t('campsites.updateCampsiteButton')
                : t('campsites.createCampsiteButton')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampsiteForm;
