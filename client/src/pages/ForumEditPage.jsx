import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logError } from '../utils/logger';
import './ForumNewPostPage.css'; // Reuse the same CSS

/**
 * ForumEditPage component for editing existing forum posts
 * Only accessible to the post author or admin users
 */
const ForumEditPage = () => {
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
      newErrors.tags = 'Maximum 10 tags allowed';
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
        <div className="unauthorized-container">Please log in to edit forum posts.</div>
      </div>
    );
  }

  if (isLoadingPost) {
    return (
      <div className="forum-new-post-page">
        <div className="loading-container">Loading forum post...</div>
      </div>
    );
  }

  if (postError) {
    return (
      <div className="forum-new-post-page">
        <div className="error-container">Failed to load forum post. Please try again later.</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="forum-new-post-page">
        <div className="error-container">Forum post not found.</div>
      </div>
    );
  }

  return (
    <div className="forum-new-post-page">
      <div className="new-post-container">
        <div className="page-header">
          <h1>Edit Forum Post</h1>
          <p>Update your forum post and share your thoughts with the community</p>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="new-post-form">
            {errors.general && <div className="error-message general">{errors.general}</div>}

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
                placeholder="Enter a descriptive title for your post"
                maxLength={200}
              />
              {errors.title && <div className="error-message">{errors.title}</div>}
            </div>

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
                  Post Type *
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
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className={`form-textarea ${errors.content ? 'error' : ''}`}
                placeholder="Share your thoughts, experiences, or ask your question..."
                rows={10}
                maxLength={5000}
              />
              <div className="char-count">{formData.content.length}/5000 characters</div>
              {errors.content && <div className="error-message">{errors.content}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="tags" className="form-label">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
                className={`form-input ${errors.tags ? 'error' : ''}`}
                placeholder="Enter tags separated by commas (e.g., camping, tent, beginner)"
              />
              <div className="help-text">
                Add relevant tags to help others find your post. Separate tags with commas.
              </div>
              {errors.tags && <div className="error-message">{errors.tags}</div>}
            </div>

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
                {isSubmitting ? 'Updating...' : 'Update Post'}
              </button>
            </div>
          </form>

          <div className="posting-guidelines">
            <h3>Posting Guidelines</h3>
            <ul>
              <li>Be respectful and constructive in your posts</li>
              <li>Use clear, descriptive titles</li>
              <li>Provide relevant details and context</li>
              <li>Use appropriate categories and tags</li>
              <li>Follow community guidelines and rules</li>
              <li>Check for similar posts before creating new ones</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumEditPage;
