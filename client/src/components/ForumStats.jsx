import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getRelativeTime } from '../utils/formatDate';
import { forumCSS } from '../utils/cssIsolation';
import './ForumStats.css';

const ForumStats = ({ stats, error, isLoading }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Show loading state if explicitly loading
  if (isLoading) {
    return (
      <div className={`forum-stats ${theme}`}>
        <div className="forum-stats-loading">
          <div className="forum-loading-spinner"></div>
          <p>{t('forum.loadingStats')}</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className={`forum-stats ${theme}`}>
        <div className="forum-stats-loading">
          <div className="forum-stats-error-icon">⚠️</div>
          <p>{t('forum.unableToLoadStats')}</p>
        </div>
      </div>
    );
  }

  // Show loading state if no data yet
  if (!stats || !stats.stats) {
    return (
      <div className={`forum-stats ${theme}`}>
        <div className="forum-stats-loading">
          <div className="forum-loading-spinner"></div>
          <p>{t('forum.loadingStats')}</p>
        </div>
      </div>
    );
  }

  const { stats: forumStats, categoryStats, recentActivity } = stats;

  return (
    <div className={`forum-stats ${theme}`}>
      <div className="forum-stats-header">
        <h3>{t('forum.forumStats')}</h3>
      </div>

      <div className="forum-stats-grid">
        <div className="forum-stat-card">
          <div className="forum-stat-icon">📝</div>
          <div className="forum-stat-content">
            <div className="forum-stat-value">{forumStats.totalPosts}</div>
            <div className="forum-stat-label">{t('forum.totalPosts')}</div>
          </div>
        </div>

        <div className="forum-stat-card">
          <div className="forum-stat-icon">💬</div>
          <div className="forum-stat-content">
            <div className="forum-stat-value">{forumStats.totalReplies}</div>
            <div className="forum-stat-label">{t('forum.totalReplies')}</div>
          </div>
        </div>

        <div className="forum-stat-card">
          <div className="forum-stat-icon">👁️</div>
          <div className="forum-stat-content">
            <div className="forum-stat-value">{forumStats.totalViews}</div>
            <div className="forum-stat-label">{t('forum.totalViews')}</div>
          </div>
        </div>

        <div className="forum-stat-card">
          <div className="forum-stat-icon">👍</div>
          <div className="forum-stat-content">
            <div className="forum-stat-value">{forumStats.totalVotes}</div>
            <div className="forum-stat-label">{t('forum.totalVotes')}</div>
          </div>
        </div>
      </div>

      {categoryStats && categoryStats.length > 0 && (
        <div className="forum-category-stats">
          <h4>{t('forum.popularCategories')}</h4>
          <div className="forum-category-list">
            {categoryStats.slice(0, 5).map((category) => (
              <div key={category._id} className="forum-category-item">
                <span className="forum-category-name">{category._id.replace('-', ' ')}</span>
                <span className="forum-category-count">{category.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentActivity && recentActivity.length > 0 && (
        <div className="forum-recent-activity">
          <h4>{t('forum.recentActivity')}</h4>
          <div className="forum-activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="forum-activity-item">
                <div className="forum-activity-title">
                  {activity.title.length > 50
                    ? `${activity.title.substring(0, 50)}...`
                    : activity.title}
                </div>
                <div className="forum-activity-meta">
                  <span className="forum-activity-author">by {activity.author?.username}</span>
                  <span className="forum-activity-time">
                    {getRelativeTime(activity.lastActivity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumStats;
