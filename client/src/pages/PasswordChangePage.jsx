import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import PasswordChangeForm from '../components/PasswordChangeForm';
import { logError } from '../utils/logger';
import './PasswordChangePage.css';

/**
 * PasswordChangePage component
 * Dedicated page for changing user password
 */
const PasswordChangePage = () => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className={`password-change-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="page-container">
        <div className="page-header">
          <h1>Change Password</h1>
          <p>Keep your account secure by updating your password regularly</p>
        </div>

        <div className="page-content">
          <PasswordChangeForm />
        </div>

        <div className="page-footer">
          <button onClick={() => navigate('/profile')} className="back-button">
            ← Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangePage;
