import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Footer.css';

const Footer = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const showListCampgroundLink = !currentUser?.isAdmin;

  // Scroll to top handler
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={`footer footer--${theme}`} role="contentinfo">
      <div className="container">
        <div className="footer-content">
          {/* About Section */}
          <div className="footer-section about">
            <h3 className="footer-title">AdventureMate</h3>
            <p className="footer-description">Discover, book, and review campgrounds in Thailand</p>
            <div className="footer-social">
              {/* Placeholder social icons (replace with real icons as needed) */}
              <a href="#" aria-label="Facebook" className="footer-social-link" tabIndex={0}>
                FB
              </a>
              <a href="#" aria-label="Twitter" className="footer-social-link" tabIndex={0}>
                TW
              </a>
              <a href="#" aria-label="Instagram" className="footer-social-link" tabIndex={0}>
                IG
              </a>
            </div>
          </div>

          {/* Links Section */}
          <div className="footer-section links">
            <h3 className="footer-title">Links</h3>
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

          {/* Contact Section */}
          <div className="footer-section contact">
            <h3 className="footer-title">Contact</h3>
            <p>
              Email:{' '}
              <a href="mailto:info@adventuremate.com" className="footer-link">
                info@adventuremate.com
              </a>
            </p>
            <p>
              Phone:{' '}
              <a href="tel:+95123456789" className="footer-link">
                +95 123 456 789
              </a>
            </p>
            <button className="footer-top-btn" onClick={handleBackToTop} aria-label="Back to top">
              ↑ Back to top
            </button>
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
