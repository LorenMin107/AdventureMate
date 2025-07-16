import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './AboutPage.css';

const AboutPage = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div className={`about-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="about-container">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="hero-content">
            <h1>{t('aboutPage.hero.title')}</h1>
            <p className="hero-subtitle">{t('aboutPage.hero.subtitle')}</p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="about-section">
          <div className="section-content">
            <h2>{t('aboutPage.mission.title')}</h2>
            <p>{t('aboutPage.mission.description')}</p>
          </div>
        </section>

        {/* Story Section */}
        <section className="about-section">
          <div className="section-content">
            <h2>{t('aboutPage.story.title')}</h2>
            <div className="story-grid">
              <div className="story-text">
                <p>{t('aboutPage.story.paragraph1')}</p>
                <p>{t('aboutPage.story.paragraph2')}</p>
              </div>
              <div className="story-stats">
                <div className="stat-item">
                  <div className="stat-number">1000+</div>
                  <div className="stat-label">{t('aboutPage.story.stats.campgrounds')}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">50,000+</div>
                  <div className="stat-label">{t('aboutPage.story.stats.campers')}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">95%</div>
                  <div className="stat-label">{t('aboutPage.story.stats.satisfaction')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="about-section">
          <div className="section-content">
            <h2>{t('aboutPage.values.title')}</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🌿</div>
                <h3>{t('aboutPage.values.sustainability.title')}</h3>
                <p>{t('aboutPage.values.sustainability.description')}</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3>{t('aboutPage.values.community.title')}</h3>
                <p>{t('aboutPage.values.community.description')}</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🔒</div>
                <h3>{t('aboutPage.values.trust.title')}</h3>
                <p>{t('aboutPage.values.trust.description')}</p>
              </div>
              <div className="value-card">
                <div className="value-icon">💡</div>
                <h3>{t('aboutPage.values.innovation.title')}</h3>
                <p>{t('aboutPage.values.innovation.description')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="about-section">
          <div className="section-content">
            <h2>{t('aboutPage.team.title')}</h2>
            <p className="team-intro">{t('aboutPage.team.intro')}</p>
            <div className="team-grid">
              <div className="team-member">
                <div className="member-avatar">👨‍💻</div>
                <h3>{t('aboutPage.team.development.title')}</h3>
                <p>{t('aboutPage.team.development.description')}</p>
              </div>
              <div className="team-member">
                <div className="member-avatar">🎯</div>
                <h3>{t('aboutPage.team.support.title')}</h3>
                <p>{t('aboutPage.team.support.description')}</p>
              </div>
              <div className="team-member">
                <div className="member-avatar">🏕️</div>
                <h3>{t('aboutPage.team.relations.title')}</h3>
                <p>{t('aboutPage.team.relations.description')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="about-section">
          <div className="section-content">
            <div className="cta-card">
              <h2>{t('aboutPage.cta.title')}</h2>
              <p>{t('aboutPage.cta.description')}</p>
              <div className="cta-buttons">
                <a href="/campgrounds" className="btn btn-primary">
                  {t('aboutPage.cta.exploreCampgrounds')}
                </a>
                <a href="/contact" className="btn btn-secondary">
                  {t('aboutPage.cta.getInTouch')}
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
