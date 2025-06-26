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
    description: '',
    price: ''
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
        description: campground.description || '',
        price: campground.price || ''
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

    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be a positive number';
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
      formDataToSend.append('campground[price]', formData.price);

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
        throw new Error(errorData.error || 'Failed to save campground');
      }

      const data = await response.json();

      // Navigate to the campground detail page
      navigate(`/campgrounds/${data.campground?._id}`);
    } catch (err) {
      console.error('Error saving campground:', err);
      setError(err.message || 'Failed to save campground. Please try again later.');
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
          <label htmlFor="price">Price (per night)</label>
          <div className="price-input-container">
            <span className="price-symbol">$</span>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={validationErrors.price ? 'error' : ''}
              disabled={loading}
            />
          </div>
          {validationErrors.price && (
            <div className="validation-error">{validationErrors.price}</div>
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
