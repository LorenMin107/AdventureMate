import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../utils/api';
import { getRelativeTime } from '../utils/formatDate';
import { logError } from '../utils/logger';
import ConfirmDialog from '../components/common/ConfirmDialog';
import './ForumPostPage.css';

const ForumPostPage = () => {
  const { id } = useParams();
  const { theme } = useTheme();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    post: null,
  });
  const [deleteReplyDialog, setDeleteReplyDialog] = useState({
    open: false,
    replyIndex: null,
    reply: null,
  });

  // Fetch forum post
  const {
    data: postData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['forum', 'post', id],
    queryFn: async () => {
      const response = await apiClient.get(`/forum/${id}`);
      return response.data.data.post;
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ postId, voteType }) => {
      const response = await apiClient.post(`/forum/${postId}/vote`, { voteType });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forum', 'post', id]);
    },
    onError: (error) => {
      logError('Error voting on post', error);
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ postId, content }) => {
      const response = await apiClient.post(`/forum/${postId}/replies`, { content });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forum', 'post', id]);
      setReplyContent('');
    },
    onError: (error) => {
      logError('Error adding reply', error);
    },
  });

  // Reply vote mutation
  const replyVoteMutation = useMutation({
    mutationFn: async ({ postId, replyIndex, voteType }) => {
      const response = await apiClient.post(`/forum/${postId}/replies/${replyIndex}/vote`, {
        voteType,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forum', 'post', id]);
    },
    onError: (error) => {
      logError('Error voting on reply', error);
    },
  });

  // Accept answer mutation
  const acceptAnswerMutation = useMutation({
    mutationFn: async ({ postId, replyIndex }) => {
      const response = await apiClient.post(`/forum/${postId}/replies/${replyIndex}/accept`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forum', 'post', id]);
    },
    onError: (error) => {
      logError('Error accepting answer', error);
    },
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async ({ postId, replyIndex }) => {
      const response = await apiClient.delete(`/forum/${postId}/replies/${replyIndex}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forum', 'post', id]);
    },
    onError: (error) => {
      logError('Error deleting reply', error);
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId) => {
      await apiClient.delete(`/forum/${postId}`);
    },
    onSuccess: () => {
      navigate('/forum');
    },
    onError: (error) => {
      logError('Error deleting post', error);
    },
  });

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsVoting(true);
    try {
      await voteMutation.mutateAsync({ postId: id, voteType });
    } finally {
      setIsVoting(false);
    }
  };

  const handleReplyVote = async (replyIndex, voteType) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await replyVoteMutation.mutateAsync({ postId: id, replyIndex, voteType });
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await replyMutation.mutateAsync({ postId: id, content: replyContent });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (replyIndex) => {
    try {
      await acceptAnswerMutation.mutateAsync({ postId: id, replyIndex });
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const handleDeletePost = () => {
    setDeleteDialog({
      open: true,
      post: postData,
    });
  };

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync(id);
    setDeleteDialog({ open: false, post: null });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, post: null });
  };

  const handleDeleteReply = (replyIndex, reply) => {
    setDeleteReplyDialog({
      open: true,
      replyIndex,
      reply,
    });
  };

  const handleDeleteReplyConfirm = async () => {
    await deleteReplyMutation.mutateAsync({
      postId: id,
      replyIndex: deleteReplyDialog.replyIndex,
    });
    setDeleteReplyDialog({ open: false, replyIndex: null, reply: null });
  };

  const handleDeleteReplyCancel = () => {
    setDeleteReplyDialog({ open: false, replyIndex: null, reply: null });
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

  const getTypeIcon = (type) => {
    return type === 'question' ? '❓' : '💬';
  };

  if (isLoading) {
    return (
      <div className={`forum-post-page ${theme}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !postData) {
    return (
      <div className={`forum-post-page ${theme}`}>
        <div className="error-container">
          <h2>Error Loading Post</h2>
          <p>
            Failed to load the forum post. It may have been deleted or you may not have permission
            to view it.
          </p>
          <Link to="/forum" className="btn btn-primary">
            Back to Forum
          </Link>
        </div>
      </div>
    );
  }

  const post = postData;

  return (
    <div className={`forum-post-page ${theme}`}>
      <div className="post-container">
        {/* Post Header */}
        <div className="post-header">
          <div className="post-meta">
            <div className="post-category">
              <span className="category-icon">{getCategoryIcon(post.category)}</span>
              <span className="category-name">{post.category.replace('-', ' ')}</span>
            </div>
            <div className="post-type">
              <span className="type-icon">{getTypeIcon(post.type)}</span>
              <span className="type-name">{post.type}</span>
            </div>
          </div>

          <div className="post-author">
            <div className="author-avatar">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt={post.author.username} />
              ) : (
                <div className="avatar-placeholder">
                  {post.author?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="author-info">
              <span className="author-name">{post.author?.username}</span>
              <span className="post-date">{getRelativeTime(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="post-content">
          <h1 className="post-title">{post.title}</h1>

          <div className="post-body">{post.content}</div>

          {post.tags && post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="post-actions">
          <div className="vote-section">
            <div className="vote-buttons">
              <button
                className={`vote-btn upvote ${post.userVote === 'upvote' ? 'active' : ''}`}
                onClick={() => handleVote('upvote')}
                disabled={isVoting}
                title="Upvote"
              >
                <span className="vote-icon">👍</span>
                <span className="vote-count">
                  {Array.isArray(post.upvotes) ? post.upvotes.length : post.upvotes || 0}
                </span>
              </button>

              <div className="vote-total">
                {(Array.isArray(post.upvotes) ? post.upvotes.length : post.upvotes || 0) -
                  (Array.isArray(post.downvotes) ? post.downvotes.length : post.downvotes || 0)}
              </div>

              <button
                className={`vote-btn downvote ${post.userVote === 'downvote' ? 'active' : ''}`}
                onClick={() => handleVote('downvote')}
                disabled={isVoting}
                title="Downvote"
              >
                <span className="vote-icon">👎</span>
                <span className="vote-count">
                  {Array.isArray(post.downvotes) ? post.downvotes.length : post.downvotes || 0}
                </span>
              </button>
            </div>
          </div>

          <div className="post-stats">
            <div className="stat-item">
              <span className="stat-icon">👁️</span>
              <span className="stat-value">{post.views} views</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💬</span>
              <span className="stat-value">{post.replies.length} replies</span>
            </div>
          </div>

          {(currentUser?._id === post.author?._id || currentUser?.isAdmin) && (
            <div className="post-actions-buttons">
              <Link to={`/forum/${id}/edit`} className="btn btn-secondary">
                Edit
              </Link>
              <button onClick={handleDeletePost} className="btn btn-danger">
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Replies Section */}
        <div className="replies-section">
          <h3>Replies ({post.replies.length})</h3>

          {post.replies.length === 0 ? (
            <div className="no-replies">
              <p>No replies yet. Be the first to respond!</p>
            </div>
          ) : (
            <div className="replies-list">
              {post.replies.map((reply, index) => (
                <div key={index} className={`reply-item ${reply.isAccepted ? 'accepted' : ''}`}>
                  {reply.isAccepted && (
                    <div className="accepted-badge">
                      <span>✓ Accepted Answer</span>
                    </div>
                  )}

                  <div className="reply-header">
                    <div className="reply-author">
                      <div className="author-avatar small">
                        {reply.author?.avatar ? (
                          <img src={reply.author.avatar} alt={reply.author.username} />
                        ) : (
                          <div className="avatar-placeholder">
                            {reply.author?.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="author-info">
                        <span className="author-name">{reply.author?.username}</span>
                        <span className="reply-date">{getRelativeTime(reply.createdAt)}</span>
                      </div>
                    </div>

                    {post.type === 'question' &&
                      (currentUser?._id === post.author?._id || currentUser?.isAdmin) && (
                        <button
                          onClick={() => handleAcceptAnswer(index)}
                          className={`accept-btn ${reply.isAccepted ? 'accepted' : ''}`}
                          disabled={reply.isAccepted}
                        >
                          {reply.isAccepted ? 'Accepted' : 'Accept Answer'}
                        </button>
                      )}
                  </div>

                  <div className="reply-content">{reply.content}</div>

                  <div className="reply-actions">
                    <div className="vote-buttons small">
                      <button
                        className={`vote-btn upvote ${reply.userVote === 'upvote' ? 'active' : ''}`}
                        onClick={() => handleReplyVote(index, 'upvote')}
                        title="Upvote"
                      >
                        <span className="vote-icon">👍</span>
                        <span className="vote-count">
                          {Array.isArray(reply.upvotes) ? reply.upvotes.length : reply.upvotes || 0}
                        </span>
                      </button>

                      <button
                        className={`vote-btn downvote ${reply.userVote === 'downvote' ? 'active' : ''}`}
                        onClick={() => handleReplyVote(index, 'downvote')}
                        title="Downvote"
                      >
                        <span className="vote-icon">👎</span>
                        <span className="vote-count">
                          {Array.isArray(reply.downvotes)
                            ? reply.downvotes.length
                            : reply.downvotes || 0}
                        </span>
                      </button>
                    </div>

                    {(currentUser?._id === reply.author?._id || currentUser?.isAdmin) && (
                      <button
                        onClick={() => handleDeleteReply(index, reply)}
                        className="btn btn-danger btn-small"
                        title="Delete Reply"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply Form */}
          {isAuthenticated && !post.isLocked ? (
            <div className="reply-form-section">
              <h4>Add Your Reply</h4>
              <form onSubmit={handleSubmitReply} className="reply-form">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="reply-textarea"
                  rows="4"
                  required
                />
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || !replyContent.trim()}
                  >
                    {isSubmitting ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            </div>
          ) : !isAuthenticated ? (
            <div className="login-prompt">
              <p>
                <Link to="/login">Login</Link> to ask questions or join the discussion.
              </p>
            </div>
          ) : post.isLocked ? (
            <div className="locked-notice">
              <p>This post is locked and cannot be replied to.</p>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Forum Post"
        message={`Are you sure you want to delete "${deleteDialog.post?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      <ConfirmDialog
        open={deleteReplyDialog.open}
        onClose={handleDeleteReplyCancel}
        onConfirm={handleDeleteReplyConfirm}
        title="Delete Reply"
        message={`Are you sure you want to delete this reply? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default ForumPostPage;
