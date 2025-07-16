import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import './ForumNewPostPage.css';

const ForumNewPostPage = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    type: 'discussion',
    tags: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: async () => {
      const response = await apiClient.get('/forum/categories');
      return response.data.data.categories;
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      const response = await apiClient.post('/forum', postData);
      return response.data.data;
    },
    onSuccess: (data) => {
      navigate(`/forum/${data.post._id}`);
    },
    onError: (error) => {
      logError('Error creating forum post', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Failed to create post. Please try again.' });
      }
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    } else if (formData.content.length > 5000) {
      newErrors.content = 'Content cannot exceed 5000 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.type) {
      newErrors.type = 'Post type is required';
    }

    // Validate tags
    if (formData.tags) {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      if (tags.length > 10) {
        newErrors.tags = 'Maximum 10 tags allowed';
      }
      for (const tag of tags) {
        if (tag.length > 20) {
          newErrors.tags = 'Each tag cannot exceed 20 characters';
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        ...formData,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
      };

      await createPostMutation.mutateAsync(postData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/forum');
  };

  const getCategoryIcon = (category) => {
    const icons = {
      general: '💬',
      'camping-tips': '🏕️',
      equipment: '🎒',
      destinations: '🗺️',
      safety: '🛡️',
      reviews: '⭐',
      questions: '❓',
      announcements: '📢',
    };
    return icons[category] || '📝';
  };

  return (
    <div className={`forum-new-post-page ${theme}`}>
      <div className="new-post-container">
        <div className="page-header">
          <h1>Create New Post</h1>
          <p>Share your thoughts, ask questions, or start a discussion with the community</p>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="new-post-form">
            {errors.general && <div className="error-message general">{errors.general}</div>}

            {/* Title */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="Enter a descriptive title for your post..."
                maxLength={200}
              />
              {errors.title && <div className="error-message">{errors.title}</div>}
              <div className="char-count">{formData.title.length}/200 characters</div>
            </div>

            {/* Category and Type */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`form-select ${errors.category ? 'error' : ''}`}
                >
                  {categoriesData?.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && <div className="error-message">{errors.category}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="type" className="form-label">
                  Post Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`form-select ${errors.type ? 'error' : ''}`}
                >
                  <option value="discussion">💬 Discussion</option>
                  <option value="question">❓ Question</option>
                </select>
                {errors.type && <div className="error-message">{errors.type}</div>}
              </div>
            </div>

            {/* Content */}
            <div className="form-group">
              <label htmlFor="content" className="form-label">
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className={`form-textarea ${errors.content ? 'error' : ''}`}
                placeholder="Write your post content here..."
                rows="8"
                maxLength={5000}
              />
              {errors.content && <div className="error-message">{errors.content}</div>}
              <div className="char-count">{formData.content.length}/5000 characters</div>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label htmlFor="tags" className="form-label">
                Tags (optional)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className={`form-input ${errors.tags ? 'error' : ''}`}
                placeholder="camping, equipment, tips (comma-separated)"
              />
              {errors.tags && <div className="error-message">{errors.tags}</div>}
              <div className="help-text">
                Add relevant tags to help others find your post. Separate multiple tags with commas.
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? t('forum.newPost.creating') : t('forum.newPost.createPost')}
              </button>
            </div>
          </form>

          {/* Posting Guidelines */}
          <div className="posting-guidelines">
            <h3>Posting Guidelines</h3>
            <ul>
              <li>Be respectful and constructive in your posts</li>
              <li>Use clear, descriptive titles</li>
              <li>Provide relevant details and context</li>
              <li>Use appropriate categories and tags</li>
              <li>Check for similar posts before creating new ones</li>
              <li>Follow community rules and guidelines</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumNewPostPage;
