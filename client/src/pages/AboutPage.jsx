import { useTheme } from '../context/ThemeContext';
import './AboutPage.css';

const AboutPage = () => {
  const { theme } = useTheme();

  return (
    <div className={`about-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="about-container">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="hero-content">
            <h1>About AdventureMate</h1>
            <p className="hero-subtitle">
              Connecting campers with the best campgrounds in Thailand
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="about-section">
          <div className="section-content">
            <h2>Our Mission</h2>
            <p>
              AdventureMate is dedicated to making camping accessible, enjoyable, and sustainable
              for everyone. We believe that nature should be available to all, and we're committed
              to connecting campers with exceptional campgrounds while supporting local communities.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="about-section">
          <div className="section-content">
            <h2>Our Story</h2>
            <div className="story-grid">
              <div className="story-text">
                <p>
                  Founded in 2023, AdventureMate began with a simple idea: to create a platform that
                  makes finding and booking campgrounds as easy as booking a hotel. What started as
                  a small project has grown into a community of thousands of campers and campground
                  owners across Thailand.
                </p>
                <p>
                  We understand the challenges that both campers and campground owners face. Campers
                  struggle to find reliable information about campgrounds, while owners need better
                  ways to reach potential guests. AdventureMate bridges this gap with our
                  comprehensive platform.
                </p>
              </div>
              <div className="story-stats">
                <div className="stat-item">
                  <div className="stat-number">1000+</div>
                  <div className="stat-label">Campgrounds</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">50,000+</div>
                  <div className="stat-label">Happy Campers</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">95%</div>
                  <div className="stat-label">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="about-section">
          <div className="section-content">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🌿</div>
                <h3>Sustainability</h3>
                <p>
                  We promote eco-friendly camping practices and partner with campgrounds that
                  prioritize environmental conservation.
                </p>
              </div>
              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3>Community</h3>
                <p>
                  We believe in building strong relationships between campers, campground owners,
                  and local communities.
                </p>
              </div>
              <div className="value-card">
                <div className="value-icon">🔒</div>
                <h3>Trust</h3>
                <p>
                  We maintain high standards for safety and quality, ensuring every listing meets
                  our rigorous criteria.
                </p>
              </div>
              <div className="value-card">
                <div className="value-icon">💡</div>
                <h3>Innovation</h3>
                <p>
                  We continuously improve our platform to provide the best possible experience for
                  our users.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="about-section">
          <div className="section-content">
            <h2>Our Team</h2>
            <p className="team-intro">
              AdventureMate is built by a passionate team of outdoor enthusiasts, tech experts, and
              travel lovers who understand what makes camping special.
            </p>
            <div className="team-grid">
              <div className="team-member">
                <div className="member-avatar">👨‍💻</div>
                <h3>Development Team</h3>
                <p>Building the technology that powers your camping adventures</p>
              </div>
              <div className="team-member">
                <div className="member-avatar">🎯</div>
                <h3>Customer Support</h3>
                <p>Here to help you every step of the way</p>
              </div>
              <div className="team-member">
                <div className="member-avatar">🏕️</div>
                <h3>Campground Relations</h3>
                <p>Working with owners to provide the best camping experiences</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="about-section">
          <div className="section-content">
            <div className="cta-card">
              <h2>Ready to Start Your Adventure?</h2>
              <p>
                Join thousands of campers who have discovered amazing campgrounds through
                AdventureMate.
              </p>
              <div className="cta-buttons">
                <a href="/campgrounds" className="btn btn-primary">
                  Explore Campgrounds
                </a>
                <a href="/contact" className="btn btn-secondary">
                  Get in Touch
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
