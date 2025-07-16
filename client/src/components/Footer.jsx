import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();
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
            <p className="footer-description">{t('footer.description')}</p>
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
            <h3 className="footer-title">{t('footer.links')}</h3>
            <ul className="footer-links">
              <li>
                <Link to="/">{t('navigation.home')}</Link>
              </li>
              <li>
                <Link to="/campgrounds">{t('navigation.campgrounds')}</Link>
              </li>
              <li>
                <Link to="/about">{t('navigation.about')}</Link>
              </li>
              <li>
                <Link to="/contact">{t('navigation.contact')}</Link>
              </li>
              {showListCampgroundLink && (
                <li>
                  <Link to="/owner/register">{t('footer.listYourCampground')}</Link>
                </li>
              )}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="footer-section contact">
            <h3 className="footer-title">{t('footer.contact')}</h3>
            <p>
              {t('footer.email')}{' '}
              <a href="mailto:info@adventuremate.com" className="footer-link">
                info@adventuremate.com
              </a>
            </p>
            <p>
              {t('footer.phone')}{' '}
              <a href="tel:+95123456789" className="footer-link">
                +95 123 456 789
              </a>
            </p>
            <button
              className="footer-top-btn"
              onClick={handleBackToTop}
              aria-label={t('footer.backToTop')}
            >
              {t('footer.backToTop')}
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} AdventureMate. {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
