import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Footer.css';

/**
 * Footer component for the application
 * Contains links, contact information, and copyright notice
 */
const Footer = () => {
  const { currentUser, isAuthenticated } = useAuth();

  // Hide "List your campground" link for admin users
  const showListCampgroundLink = !currentUser?.isAdmin;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>AdventureMate</h3>
            <p>Discover, book, and review campgrounds in Thailand</p>
          </div>

          <div className="footer-section">
            <h3>Links</h3>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/campgrounds">Campgrounds</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              {showListCampgroundLink && (
                <li>
                  <Link to="/owner/register">List your campground</Link>
                </li>
              )}
            </ul>
          </div>

          <div className="footer-section">
            <h3>Contact</h3>
            <p>Email: info@adventuremate.com</p>
            <p>Phone: +95 123 456 789</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} AdventureMate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
