import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import './CampgroundForm.css';
import { logInfo, logError } from '../utils/logger';
import MapPicker from './MapPicker';
import { useTheme } from '../context/ThemeContext';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;

const LOCAL_STORAGE_KEY = 'myancamp-owner-campground-form';

/**
 * CampgroundForm component for creating and editing campgrounds
 *
 * @param {Object} props - Component props
 * @param {Object} props.campground - Existing campground data for editing (optional)
 * @param {boolean} props.isEditing - Whether the form is for editing (true) or creating (false)
 * @param {string} [props.apiPath] - Optional API path for creation (e.g., /owners/campgrounds)
 */
const CampgroundForm = ({ campground = null, isEditing = false, apiPath }) => {
  const navigate = useNavigate();
  const { theme } = useTheme ? useTheme() : { theme: 'light' };

  // Add this line:
  const useFlatFields = apiPath === '/owners/campgrounds';

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    geometry: null, // { type: 'Point', coordinates: [lng, lat] }
    street: '',
    city: '',
    state: '',
    country: '',
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Restore form state from localStorage on mount (only for new form)
  useEffect(() => {
    if (!isEditing) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(parsed.formData || { title: '', location: '', description: '' });
          // Do not restore images for security reasons
        } catch {}
      }
    }
  }, [isEditing]);

  // Save form state to localStorage on change (only for new form)
  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ formData }));
    }
  }, [formData, isEditing]);

  // Initialize form data if editing an existing campground
  useEffect(() => {
    if (campground && isEditing) {
      setFormData({
        title: campground.title || '',
        location: campground.location || '',
        description: campground.description || '',
        geometry: campground.geometry || null,
        street: campground.street || '',
        city: campground.city || '',
        state: campground.state || '',
        country: campground.country || '',
      });

      if (campground.images && campground.images.length > 0) {
        setExistingImages(campground.images);
      }
    }
  }, [campground, isEditing]);

  // Fallback: If editing and geometry is missing but location is present, geocode the location
  useEffect(() => {
    if (
      isEditing &&
      formData.location &&
      (!formData.geometry ||
        !formData.geometry.coordinates ||
        formData.geometry.coordinates.length !== 2)
    ) {
      // Geocode the location string
      const geocodeLocation = async () => {
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            formData.location
          )}.json?access_token=${MAPBOX_TOKEN}`;
          const resp = await fetch(url);
          const data = await resp.json();
          if (data.features && data.features[0] && data.features[0].center) {
            const [lng, lat] = data.features[0].center;
            setFormData((prev) => ({
              ...prev,
              geometry: { type: 'Point', coordinates: [lng, lat] },
            }));
          } else {
            // Could not geocode, prompt user to pick on map
            setFormData((prev) => ({ ...prev, geometry: null }));
          }
        } catch (err) {
          logError('Failed to geocode location on frontend', err);
          setFormData((prev) => ({ ...prev, geometry: null }));
        }
      };
      geocodeLocation();
    }
    // Only run when editing and geometry is missing but location is present
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, formData.location]);

  // Handle MapPicker change (now receives address components)
  const handleMapPickerChange = ({ lat, lng, address, components }) => {
    setFormData((prev) => ({
      ...prev,
      location: address || '',
      geometry: lat && lng ? { type: 'Point', coordinates: [lng, lat] } : null,
      street: components?.street || '',
      city: components?.city || '',
      state: components?.state || '',
      country: components?.country || '',
    }));
    // Clear validation error for location
    if (validationErrors.location) {
      setValidationErrors((prev) => ({ ...prev, location: null }));
    }
  };

  // Handle input changes (for title, description, and address fields)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
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

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }

    if (
      !formData.geometry ||
      !formData.geometry.coordinates ||
      formData.geometry.coordinates.length !== 2
    ) {
      errors.location = 'Please select a location on the map.';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    if (!formData.country.trim()) {
      errors.country = 'Country is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    // If not editing and no images are selected
    if (!isEditing && images.length === 0) {
      errors.images = 'At least one image is required';
    }

    // If editing and all existing images are marked for deletion and no new images
    if (
      isEditing &&
      existingImages.length > 0 &&
      imagesToDelete.length === existingImages.length &&
      images.length === 0
    ) {
      errors.images = 'At least one image is required';
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

      // Use flat field names for owner endpoint, nested for admin/general
      if (useFlatFields) {
        formDataToSend.append('title', formData.title);
        formDataToSend.append('location', formData.location);
        formDataToSend.append('description', formData.description);
        if (formData.geometry) {
          formDataToSend.append('geometry', JSON.stringify(formData.geometry));
        }
        formDataToSend.append('street', formData.street);
        formDataToSend.append('city', formData.city);
        formDataToSend.append('state', formData.state);
        formDataToSend.append('country', formData.country);
      } else {
        formDataToSend.append('campground[title]', formData.title);
        formDataToSend.append('campground[location]', formData.location);
        formDataToSend.append('campground[description]', formData.description);
        if (formData.geometry) {
          formDataToSend.append('campground[geometry]', JSON.stringify(formData.geometry));
        }
        formDataToSend.append('campground[street]', formData.street);
        formDataToSend.append('campground[city]', formData.city);
        formDataToSend.append('campground[state]', formData.state);
        formDataToSend.append('campground[country]', formData.country);
      }

      // Add images to form data
      images.forEach((image) => {
        formDataToSend.append(useFlatFields ? 'images' : 'image', image);
      });

      // Add images to delete if editing
      if (isEditing && imagesToDelete.length > 0) {
        imagesToDelete.forEach((filename) => {
          formDataToSend.append('deleteImages[]', filename);
        });
      }

      // Determine URL and method based on whether we're creating or editing
      // Don't include /api/v1 in the URL as it's already in the baseURL of apiClient
      const url = isEditing ? `/campgrounds/${campground?._id}` : apiPath || '/campgrounds';
      const method = isEditing ? 'PUT' : 'POST';

      // Send the request using apiClient
      const response =
        method === 'POST'
          ? await apiClient.post(url, formDataToSend, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
          : await apiClient.put(url, formDataToSend, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

      // With apiClient, the response is already parsed and in response.data
      logInfo('Response from API:', response);

      // Check if the response is in the new standardized format
      const responseData = response.data;
      let campgroundData;

      if (responseData.status === 'success' && responseData.data) {
        // New standardized format
        campgroundData = responseData.data.campground;
      } else if (responseData.campground) {
        // Legacy format
        campgroundData = responseData.campground;
      } else {
        // If we can't find the campground data, use a default ID
        logInfo('Campground data not found in response, using default');
        campgroundData = { _id: 'list' };
      }

      logInfo('Campground data:', campgroundData);

      // On successful submit, clear localStorage for new form
      if (!isEditing) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }

      // Navigate to the campground detail page
      navigate(`/campgrounds/${campgroundData._id}`);
    } catch (err) {
      logError('Error saving campground:', err);

      // Check if this is an axios error with a response
      if (err.response && err.response.data) {
        const responseData = err.response.data;
        logInfo('Error response data:', responseData);

        // Handle standardized API error response
        if (responseData.status === 'error') {
          if (
            responseData.error &&
            typeof responseData.error === 'object' &&
            responseData.error.errors
          ) {
            // Handle field-specific validation errors
            const fieldErrors = {};
            responseData.error.errors.forEach((err) => {
              const fieldName = err.field.replace('campground.', '');
              fieldErrors[fieldName] = err.message;
            });
            setValidationErrors(fieldErrors);
            setError('Please correct the validation errors');
          } else {
            // Handle general error message
            setError(responseData.error || responseData.message || 'Failed to save campground');
          }
        } else {
          // Handle non-standardized error response
          setError(
            responseData.error || responseData.message || err.message || 'Failed to save campground'
          );
        }
      } else {
        // Handle generic error
        setError(err.message || 'Failed to save campground. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="campground-form-container">
      <h2>{isEditing ? 'Edit Campground' : 'Create New Campground'}</h2>

      {error && <div className="form-error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="campground-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={validationErrors.title ? 'error' : ''}
            disabled={loading}
          />
          {validationErrors.title && (
            <div className="validation-error">{validationErrors.title}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <MapPicker
            value={
              formData.geometry
                ? { lat: formData.geometry.coordinates[1], lng: formData.geometry.coordinates[0] }
                : null
            }
            onChange={handleMapPickerChange}
            initialAddress={formData.location}
            theme={theme}
          />
          {validationErrors.location && (
            <div className="validation-error">{validationErrors.location}</div>
          )}
          <div
            className="address-fields-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            <div>
              <label htmlFor="street">Street</label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className={validationErrors.street ? 'error' : ''}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="city">
                City<span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={validationErrors.city ? 'error' : ''}
                disabled={loading}
                required
              />
              {validationErrors.city && (
                <div className="validation-error">{validationErrors.city}</div>
              )}
            </div>
            <div>
              <label htmlFor="state">State/Region</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={validationErrors.state ? 'error' : ''}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="country">
                Country<span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={validationErrors.country ? 'error' : ''}
                disabled={loading}
                required
              />
              {validationErrors.country && (
                <div className="validation-error">{validationErrors.country}</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
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
          <label>Images</label>

          {/* Existing images (for editing) */}
          {isEditing && existingImages.length > 0 && (
            <div className="existing-images">
              <p>Current Images:</p>
              <div className="image-preview-container">
                {existingImages.map((image, index) => (
                  <div
                    key={index}
                    className={`image-preview ${imagesToDelete.includes(image.filename) ? 'marked-for-deletion' : ''}`}
                  >
                    <img src={image.url} alt={`Campground ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-button"
                      onClick={() => toggleImageForDeletion(image.filename)}
                    >
                      {imagesToDelete.includes(image.filename) ? 'Restore' : 'Remove'}
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
              name={useFlatFields ? 'images' : 'image'}
              onChange={handleImageChange}
              multiple
              accept="image/*"
              disabled={loading}
            />
            <label htmlFor="images" className="upload-button">
              Select Images
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
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {validationErrors.images && (
            <div className="validation-error">{validationErrors.images}</div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Campground' : 'Create Campground'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampgroundForm;
