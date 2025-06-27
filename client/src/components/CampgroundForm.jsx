import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CampgroundForm.css';

/**
 * CampgroundForm component for creating and editing campgrounds
 * 
 * @param {Object} props - Component props
 * @param {Object} props.campground - Existing campground data for editing (optional)
 * @param {boolean} props.isEditing - Whether the form is for editing (true) or creating (false)
 */
const CampgroundForm = ({ campground = null, isEditing = false }) => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: ''
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize form data if editing an existing campground
  useEffect(() => {
    if (campground && isEditing) {
      setFormData({
        title: campground.title || '',
        location: campground.location || '',
        description: campground.description || ''
      });

      if (campground.images && campground.images.length > 0) {
        setExistingImages(campground.images);
      }
    }
  }, [campground, isEditing]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);

    // Create preview URLs for the selected images
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // Remove a selected image
  const removeSelectedImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle an existing image for deletion
  const toggleImageForDeletion = (filename) => {
    if (imagesToDelete.includes(filename)) {
      setImagesToDelete(prev => prev.filter(name => name !== filename));
    } else {
      setImagesToDelete(prev => [...prev, filename]);
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

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    // If not editing and no images are selected
    if (!isEditing && images.length === 0) {
      errors.images = 'At least one image is required';
    }

    // If editing and all existing images are marked for deletion and no new images
    if (isEditing && existingImages.length > 0 && 
        imagesToDelete.length === existingImages.length && 
        images.length === 0) {
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

      // Nest campground data under 'campground' property as expected by the schema
      formDataToSend.append('campground[title]', formData.title);
      formDataToSend.append('campground[location]', formData.location);
      formDataToSend.append('campground[description]', formData.description);

      // Add images to form data
      images.forEach(image => {
        formDataToSend.append('image', image);
      });

      // Add images to delete if editing
      if (isEditing && imagesToDelete.length > 0) {
        imagesToDelete.forEach(filename => {
          formDataToSend.append('deleteImages[]', filename);
        });
      }

      // Determine URL and method based on whether we're creating or editing
      const url = isEditing 
        ? `/api/campgrounds/${campground?._id}` 
        : '/api/campgrounds';

      const method = isEditing ? 'PUT' : 'POST';

      // Send the request
      const response = await fetch(url, {
        method,
        body: formDataToSend,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);

        // Check if the response is in the new standardized format with field-specific errors
        if (errorData.status === 'error') {
          console.log('Error status is "error"');
          console.log('Error object:', errorData.error);

          // Check for field-specific errors in different possible formats
          if (errorData.error) {
            console.log('Error object type:', typeof errorData.error);

            // Case 1: error is an object with errors array
            if (typeof errorData.error === 'object' && errorData.error.errors) {
              console.log('Found field-specific errors (format 1):', errorData.error.errors);
              const fieldErrors = {};
              errorData.error.errors.forEach(err => {
                console.log('Processing error:', err);
                // Convert API field names (e.g., 'campground.title') to form field names (e.g., 'title')
                const fieldName = err.field.replace('campground.', '');
                console.log('Field name after conversion:', fieldName);
                fieldErrors[fieldName] = err.message;
              });
              console.log('Final field errors:', fieldErrors);
              setValidationErrors(fieldErrors);
              setError('Please correct the validation errors');
              return; // Don't throw, just return to avoid the catch block
            } 
            // Case 2: error is a string "Validation Error"
            else if (errorData.error === 'Validation Error' && errorData.message) {
              console.log('Found validation error message:', errorData.message);
              // Set a general validation error
              setError(errorData.message || 'Please correct the validation errors');
              return; // Don't throw, just return to avoid the catch block
            }

            // If we get here, handle as a general error
            throw new Error(errorData.error || errorData.message || 'Failed to save campground');
          } else {
            console.log('No field-specific errors found');
            // Handle general error message
            throw new Error(errorData.error || errorData.message || 'Failed to save campground');
          }
        } else {
          console.log('Error status is not "error"');
          // Handle legacy error format
          throw new Error(errorData.error || 'Failed to save campground');
        }
      }

      // Check if the response has content before parsing
      const contentType = response.headers.get('content-type');
      let campgroundData;

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        // Check if the response is in the new standardized format
        campgroundData = data.status && data.data ? data.data.campground : data.campground;

        if (!campgroundData) {
          throw new Error('Campground data not found in response');
        }
      } else {
        // If response is not JSON or empty, just proceed without parsing
        console.log('Response is not JSON or empty, proceeding without parsing');
        // Use a default ID to navigate back to the campgrounds list
        campgroundData = { _id: 'list' };
      }

      // Navigate to the campground detail page
      navigate(`/campgrounds/${campgroundData._id}`);
    } catch (err) {
      console.error('Error saving campground:', err);

      // Check if this is an axios error with a response
      if (err.response && err.response.data) {
        const responseData = err.response.data;
        console.log('Error response data:', responseData);

        // Handle standardized API error response
        if (responseData.status === 'error') {
          if (responseData.error && typeof responseData.error === 'object' && responseData.error.errors) {
            // Handle field-specific validation errors
            const fieldErrors = {};
            responseData.error.errors.forEach(err => {
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
          setError(responseData.error || responseData.message || err.message || 'Failed to save campground');
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

      {error && (
        <div className="form-error-message">
          {error}
        </div>
      )}

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
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={validationErrors.location ? 'error' : ''}
            disabled={loading}
          />
          {validationErrors.location && (
            <div className="validation-error">{validationErrors.location}</div>
          )}
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
              name="images"
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
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Campground' : 'Create Campground'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampgroundForm;
