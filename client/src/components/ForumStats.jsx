import { useTheme } from '../context/ThemeContext';
import { getRelativeTime } from '../utils/formatDate';
import './ForumStats.css';

const ForumStats = ({ stats, error, isLoading }) => {
  const { theme } = useTheme();

  // Show loading state if explicitly loading
  if (isLoading) {
    return (
      <div className={`forum-stats ${theme}`}>
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Loading stats...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className={`forum-stats ${theme}`}>
        <div className="stats-loading">
          <div className="stats-error-icon">⚠️</div>
          <p>Unable to load stats</p>
        </div>
      </div>
    );
  }

  // Show loading state if no data yet
  if (!stats || !stats.stats) {
    return (
      <div className={`forum-stats ${theme}`}>
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Loading stats...</p>
        </div>
      </div>
    );
  }

  const { stats: forumStats, categoryStats, recentActivity } = stats;

  return (
    <div className={`forum-stats ${theme}`}>
      <div className="stats-header">
        <h3>Forum Statistics</h3>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{forumStats.totalPosts}</div>
            <div className="stat-label">Total Posts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <div className="stat-value">{forumStats.totalReplies}</div>
            <div className="stat-label">Total Replies</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <div className="stat-value">{forumStats.totalViews}</div>
            <div className="stat-label">Total Views</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👍</div>
          <div className="stat-content">
            <div className="stat-value">{forumStats.totalVotes}</div>
            <div className="stat-label">Total Votes</div>
          </div>
        </div>
      </div>

      {categoryStats && categoryStats.length > 0 && (
        <div className="category-stats">
          <h4>Popular Categories</h4>
          <div className="category-list">
            {categoryStats.slice(0, 5).map((category) => (
              <div key={category._id} className="category-item">
                <span className="category-name">{category._id.replace('-', ' ')}</span>
                <span className="category-count">{category.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentActivity && recentActivity.length > 0 && (
        <div className="recent-activity">
          <h4>Recent Activity</h4>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-title">
                  {activity.title.length > 50
                    ? `${activity.title.substring(0, 50)}...`
                    : activity.title}
                </div>
                <div className="activity-meta">
                  <span className="activity-author">by {activity.author?.username}</span>
                  <span className="activity-time">{getRelativeTime(activity.lastActivity)}</span>
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
