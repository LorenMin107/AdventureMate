import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import { logError } from '../utils/logger';
import './ForumNewPostPage.css';

const ForumNewPostPage = () => {
  const { t } = useTranslation();
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
        setErrors({ general: t('forum.newPost.failedToCreate') });
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
      newErrors.title = t('forum.newPost.titleRequired');
    } else if (formData.title.length < 5) {
      newErrors.title = t('forum.newPost.titleTooShort');
    } else if (formData.title.length > 200) {
      newErrors.title = t('forum.newPost.titleTooLong');
    }

    if (!formData.content.trim()) {
      newErrors.content = t('forum.newPost.contentRequired');
    } else if (formData.content.length < 10) {
      newErrors.content = t('forum.newPost.contentTooShort');
    } else if (formData.content.length > 5000) {
      newErrors.content = t('forum.newPost.contentTooLong');
    }

    if (!formData.category) {
      newErrors.category = t('forum.newPost.categoryRequired');
    }

    if (!formData.type) {
      newErrors.type = t('forum.newPost.typeRequired');
    }

    // Validate tags
    if (formData.tags) {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      if (tags.length > 10) {
        newErrors.tags = t('forum.newPost.tagsTooMany');
      }
      for (const tag of tags) {
        if (tag.length > 20) {
          newErrors.tags = t('forum.newPost.tagTooLong');
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
          <h1>{t('forum.newPost.pageTitle')}</h1>
          <p>{t('forum.newPost.pageSubtitle')}</p>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="new-post-form">
            {errors.general && <div className="error-message general">{errors.general}</div>}

            {/* Title */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                {t('forum.newPost.postTitle')} *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder={t('forum.newPost.postTitlePlaceholder')}
                maxLength={200}
              />
              {errors.title && <div className="error-message">{errors.title}</div>}
              <div className="char-count">
                {formData.title.length}/200 {t('forum.newPost.characters')}
              </div>
            </div>

            {/* Category and Type */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  {t('forum.newPost.category')} *
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
                  {t('forum.newPost.type')} *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`form-select ${errors.type ? 'error' : ''}`}
                >
                  <option value="discussion">{t('forum.newPost.discussion')}</option>
                  <option value="question">{t('forum.newPost.question')}</option>
                </select>
                {errors.type && <div className="error-message">{errors.type}</div>}
              </div>
            </div>

            {/* Content */}
            <div className="form-group">
              <label htmlFor="content" className="form-label">
                {t('forum.newPost.content')} *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className={`form-textarea ${errors.content ? 'error' : ''}`}
                placeholder={t('forum.newPost.contentPlaceholder')}
                rows="8"
                maxLength={5000}
              />
              {errors.content && <div className="error-message">{errors.content}</div>}
              <div className="char-count">
                {formData.content.length}/5000 {t('forum.newPost.characters')}
              </div>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label htmlFor="tags" className="form-label">
                {t('forum.newPost.tags')}
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className={`form-input ${errors.tags ? 'error' : ''}`}
                placeholder={t('forum.newPost.tagsPlaceholder')}
              />
              {errors.tags && <div className="error-message">{errors.tags}</div>}
              <div className="help-text">{t('forum.newPost.tagsHelpText')}</div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                {t('forum.newPost.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? t('forum.newPost.creating') : t('forum.newPost.createPost')}
              </button>
            </div>
          </form>

          {/* Posting Guidelines */}
          <div className="posting-guidelines">
            <h3>{t('forum.newPost.postingGuidelines.title')}</h3>
            <ul>
              <li>{t('forum.newPost.postingGuidelines.respectful')}</li>
              <li>{t('forum.newPost.postingGuidelines.clearTitles')}</li>
              <li>{t('forum.newPost.postingGuidelines.relevantDetails')}</li>
              <li>{t('forum.newPost.postingGuidelines.appropriateCategories')}</li>
              <li>{t('forum.newPost.postingGuidelines.checkSimilar')}</li>
              <li>{t('forum.newPost.postingGuidelines.followRules')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumNewPostPage;
