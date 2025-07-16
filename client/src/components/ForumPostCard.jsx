import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import apiClient from '../utils/api';
import { getRelativeTime } from '../utils/formatDate';
import { logError } from '../utils/logger';
import './ForumPostCard.css';

const ForumPostCard = ({ post }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ postId, voteType }) => {
      const response = await apiClient.post(`/forum/${postId}/vote`, { voteType });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forum', 'posts']);
    },
    onError: (error) => {
      logError('Error voting on post', error);
    },
  });

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      // Redirect to login or show login prompt
      return;
    }

    setIsVoting(true);
    try {
      await voteMutation.mutateAsync({ postId: post._id, voteType });
    } finally {
      setIsVoting(false);
    }
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

  const getStatusBadge = () => {
    if (post.isSticky) return { text: t('forum.postCard.sticky'), class: 'sticky' };
    if (post.isPinned) return { text: t('forum.postCard.pinned'), class: 'pinned' };
    if (post.isLocked) return { text: t('forum.postCard.locked'), class: 'locked' };
    if (post.status === 'closed') return { text: t('forum.postCard.closed'), class: 'closed' };
    return null;
  };

  const getCategoryName = (category) => {
    return t(`forum.postCard.categoryNames.${category}`, {
      defaultValue: category.replace('-', ' '),
    });
  };

  const getTypeName = (type) => {
    return t(`forum.postCard.typeNames.${type}`, { defaultValue: type });
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      className={`forum-post-card ${post.isSticky ? 'sticky' : ''} ${post.isPinned ? 'pinned' : ''}`}
    >
      {statusBadge && <div className={`status-badge ${statusBadge.class}`}>{statusBadge.text}</div>}

      <div className="post-header">
        <div className="post-meta">
          <div className="post-category">
            <span className="category-icon">{getCategoryIcon(post.category)}</span>
            <span className="category-name">{getCategoryName(post.category)}</span>
          </div>
          <div className="post-type">
            <span className="type-icon">{getTypeIcon(post.type)}</span>
            <span className="type-name">{getTypeName(post.type)}</span>
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

      <div className="post-content">
        <Link to={`/forum/${post._id}`} className="post-title">
          {post.title}
        </Link>

        <p className="post-excerpt">
          {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
        </p>

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

      <div className="post-footer">
        <div className="post-stats">
          <div className="forum-stat-item">
            <span className="forum-stat-icon">👁️</span>
            <span className="forum-stat-value">{post.views}</span>
          </div>
          <div className="forum-stat-item">
            <span className="forum-stat-icon">💬</span>
            <span className="forum-stat-value">{post.replyCount}</span>
          </div>
        </div>

        <div className="post-actions">
          <div className="vote-buttons">
            <button
              className={`vote-btn upvote ${post.userVote === 'upvote' ? 'active' : ''}`}
              onClick={() => handleVote('upvote')}
              disabled={isVoting}
              title={t('forum.postCard.upvote')}
            >
              <span className="vote-icon">👍</span>
              <span className="vote-count">{post.upvotes}</span>
            </button>

            <div className="vote-total">{post.upvotes - post.downvotes}</div>

            <button
              className={`vote-btn downvote ${post.userVote === 'downvote' ? 'active' : ''}`}
              onClick={() => handleVote('downvote')}
              disabled={isVoting}
              title={t('forum.postCard.downvote')}
            >
              <span className="vote-icon">👎</span>
              <span className="vote-count">{post.downvotes}</span>
            </button>
          </div>

          <Link to={`/forum/${post._id}`} className="view-post-btn">
            {t('forum.postCard.viewPost')}
          </Link>
        </div>
      </div>

      {post.lastActivity && (
        <div className="post-activity">
          <span className="activity-text">
            {t('forum.postCard.lastActivity', { time: getRelativeTime(post.lastActivity) })}
          </span>
        </div>
      )}
    </div>
  );
};

export default ForumPostCard;
