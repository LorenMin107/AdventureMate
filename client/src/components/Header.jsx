import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // Check if user is authenticated but email is not verified
  const isEmailVerified = currentUser?.isEmailVerified ?? false;
  const showAuthenticatedLinks = isAuthenticated && isEmailVerified;

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          MyanCamp
        </Link>
        <nav className="nav">
          <ul className="nav-list">
            <li className="nav-item">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  isActive ? "nav-link active" : "nav-link"
                }
                end
              >
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                to="/campgrounds" 
                className={({ isActive }) => 
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Campgrounds
              </NavLink>
            </li>
            {isAuthenticated ? (
              <>
                {showAuthenticatedLinks ? (
                  <>
                    <li className="nav-item">
                      <NavLink 
                        to="/profile" 
                        className={({ isActive }) => 
                          isActive ? "nav-link active" : "nav-link"
                        }
                      >
                        Profile
                      </NavLink>
                    </li>
                    {!currentUser?.isAdmin && (
                      <li className="nav-item">
                        <NavLink 
                          to="/bookings" 
                          className={({ isActive }) => 
                            isActive ? "nav-link active" : "nav-link"
                          }
                        >
                          My Bookings
                        </NavLink>
                      </li>
                    )}
                    {currentUser?.isAdmin && (
                      <li className="nav-item">
                        <NavLink 
                          to="/admin" 
                          className={({ isActive }) => 
                            isActive ? "nav-link active" : "nav-link"
                          }
                        >
                          Admin
                        </NavLink>
                      </li>
                    )}
                    <li className="nav-item">
                      <a href="#" onClick={handleLogout} className="nav-link">
                        Logout
                      </a>
                    </li>
                  </>
                ) : (
                  <li className="nav-item">
                    <NavLink 
                      to="/verify-email-required" 
                      className={({ isActive }) => 
                        isActive ? "nav-link active" : "nav-link"
                      }
                    >
                      Verify Email
                    </NavLink>
                  </li>
                )}
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink 
                    to="/login" 
                    className={({ isActive }) => 
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink 
                    to="/register" 
                    className={({ isActive }) => 
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    Register
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
