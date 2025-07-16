import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logError } from '../utils/logger';
import './ForumNewPostPage.css'; // Reuse the same CSS

/**
 * ForumEditPage component for editing existing forum posts
 * Only accessible to the post author or admin users
 */
const ForumEditPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    type: 'discussion',
    tags: [],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the forum post data
  const {
    data: post,
    isLoading: isLoadingPost,
    error: postError,
  } = useQuery({
    queryKey: ['forum-post', id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/forum/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch forum post');
      }
      const data = await response.json();
      return data.data?.post || data.post;
    },
    enabled: !!id && isAuthenticated,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData) => {
      const response = await fetch(`/api/v1/forum/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update forum post');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries(['forum-posts']);
      queryClient.invalidateQueries(['forum-post', id]);
      queryClient.invalidateQueries(['forum-stats']);

      // Navigate to the updated post
      navigate(`/forum/${id}`);
    },
    onError: (error) => {
      logError('Error updating forum post', error);
      setErrors({ general: error.message });
      setIsSubmitting(false);
    },
  });

  // Populate form when post data is loaded
  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        category: post.category || 'general',
        type: post.type || 'discussion',
        tags: post.tags || [],
      });
    }
  }, [post]);

  // Check authorization
  useEffect(() => {
    if (post && currentUser) {
      const isAuthor = currentUser._id === post.author._id;
      const isAdmin = currentUser.isAdmin;

      if (!isAuthor && !isAdmin) {
        navigate(`/forum/${id}`);
      }
    }
  }, [post, currentUser, navigate, id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleTagsChange = (e) => {
    const tagsString = e.target.value;
    const tags = tagsString
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setFormData((prev) => ({
      ...prev,
      tags,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Content must be at least 10 characters long';
    } else if (formData.content.length > 5000) {
      newErrors.content = 'Content cannot exceed 5000 characters';
    }

    if (formData.tags.length > 10) {
      newErrors.tags = t('forumEdit.maxTagsError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await updateMutation.mutateAsync(formData);
    } catch (error) {
      // Error is handled in mutation onError
    }
  };

  const handleCancel = () => {
    navigate(`/forum/${id}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="forum-new-post-page">
        <div className="unauthorized-container">{t('forumEdit.loginRequired')}</div>
      </div>
    );
  }

  if (isLoadingPost) {
    return (
      <div className="forum-new-post-page">
        <div className="loading-container">{t('forumEdit.loading')}</div>
      </div>
    );
  }

  if (postError) {
    return (
      <div className="forum-new-post-page">
        <div className="error-container">{t('forumEdit.errorLoading')}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="forum-new-post-page">
        <div className="error-container">{t('forumEdit.notFound')}</div>
      </div>
    );
  }

  return (
    <div className="forum-new-post-page">
      <div className="new-post-container">
        <div className="page-header">
          <h1>{t('forumEdit.title')}</h1>
          <p>{t('forumEdit.subtitle')}</p>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="new-post-form">
            {errors.general && <div className="error-message general">{errors.general}</div>}

            <div className="form-group">
              <label htmlFor="title" className="form-label">
                {t('forumEdit.titleLabel')}
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder={t('forumEdit.titlePlaceholder')}
                maxLength={200}
              />
              {errors.title && <div className="error-message">{errors.title}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  {t('forumEdit.categoryLabel')}
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="general">General Discussion</option>
                  <option value="camping-tips">Camping Tips</option>
                  <option value="equipment">Equipment & Gear</option>
                  <option value="destinations">Destinations</option>
                  <option value="safety">Safety & First Aid</option>
                  <option value="reviews">Reviews & Recommendations</option>
                  <option value="questions">Questions & Help</option>
                  <option value="announcements">Announcements</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="type" className="form-label">
                  {t('forumEdit.typeLabel')}
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="discussion">Discussion</option>
                  <option value="question">Question</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="content" className="form-label">
                {t('forumEdit.contentLabel')}
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className={`form-textarea ${errors.content ? 'error' : ''}`}
                placeholder={t('forumEdit.contentPlaceholder')}
                rows={10}
                maxLength={5000}
              />
              <div className="char-count">{formData.content.length}/5000 characters</div>
              {errors.content && <div className="error-message">{errors.content}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="tags" className="form-label">
                {t('forumEdit.tagsLabel')}
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
                className={`form-input ${errors.tags ? 'error' : ''}`}
                placeholder={t('forumEdit.tagsPlaceholder')}
              />
              <div className="help-text">{t('forumEdit.tagsHelp')}</div>
              {errors.tags && <div className="error-message">{errors.tags}</div>}
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                {t('forumEdit.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? t('forumEdit.updating') : t('forumEdit.updatePost')}
              </button>
            </div>
          </form>

          <div className="posting-guidelines">
            <h3>{t('forumEdit.guidelinesTitle')}</h3>
            <ul>
              {t('forumEdit.guidelines', { returnObjects: true }).map((guideline, index) => (
                <li key={index}>{guideline}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumEditPage;
