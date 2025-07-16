import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './HomePage.css';

const HomePage = () => {
  const { t } = useTranslation();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    // Auto-rotate features
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '🏔️',
      title: t('home.features.mountainAdventures.title'),
      description: t('home.features.mountainAdventures.description'),
      color: 'var(--color-primary)',
    },
    {
      icon: '🏖️',
      title: t('home.features.beachCamping.title'),
      description: t('home.features.beachCamping.description'),
      color: 'var(--color-secondary)',
    },
    {
      icon: '🌿',
      title: t('home.features.jungleRetreats.title'),
      description: t('home.features.jungleRetreats.description'),
      color: 'var(--color-warning)',
    },
    {
      icon: '🗺️',
      title: t('home.features.tripPlanner.title'),
      description: t('home.features.tripPlanner.description'),
      color: 'var(--color-success)',
    },
  ];

  const testimonials = [
    {
      name: t('home.testimonials.somchai.name'),
      location: t('home.testimonials.somchai.location'),
      text: t('home.testimonials.somchai.text'),
      rating: 5,
    },
    {
      name: t('home.testimonials.nong.name'),
      location: t('home.testimonials.nong.location'),
      text: t('home.testimonials.nong.text'),
      rating: 5,
    },
    {
      name: t('home.testimonials.pim.name'),
      location: t('home.testimonials.pim.location'),
      text: t('home.testimonials.pim.text'),
      rating: 5,
    },
  ];

  const destinations = [
    {
      name: t('home.destinations.chiangMai.name'),
      region: t('home.destinations.northernThailand'),
      description: t('home.destinations.chiangMai.description'),
      image: '🏔️',
      stats: [
        { icon: '🌡️', label: t('home.destinations.chiangMai.coolClimate') },
        { icon: '🏕️', label: t('home.destinations.chiangMai.sites') },
      ],
    },
    {
      name: t('home.destinations.krabi.name'),
      region: t('home.destinations.southernThailand'),
      description: t('home.destinations.krabi.description'),
      image: '🏖️',
      stats: [
        { icon: '🌊', label: t('home.destinations.krabi.beachAccess') },
        { icon: '🏕️', label: t('home.destinations.krabi.sites') },
      ],
    },
    {
      name: t('home.destinations.kanchanaburi.name'),
      region: t('home.destinations.westernThailand'),
      description: t('home.destinations.kanchanaburi.description'),
      image: '🌿',
      stats: [
        { icon: '🌲', label: t('home.destinations.kanchanaburi.jungleTrails') },
        { icon: '🏕️', label: t('home.destinations.kanchanaburi.sites') },
      ],
    },
  ];

  return (
    <div className={`home-page ${isVisible ? 'visible' : ''}`}>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-background">
            <div className="hero-overlay"></div>
          </div>
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-title-main">{t('home.hero.title')}</span>
              <span className="hero-title-sub">{t('home.hero.subtitle')}</span>
            </h1>
            <p className="hero-description">{t('home.hero.description')}</p>
            <div className="hero-cta">
              <Link to="/campgrounds" className="btn btn-primary btn-large">
                {t('home.hero.searchButton')}
              </Link>
              <Link to="/campgrounds" className="btn btn-outline btn-large">
                {t('home.hero.exploreButton')}
              </Link>
            </div>
          </div>
          <div className="hero-scroll-indicator">
            <div className="scroll-arrow"></div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="destinations-section">
        <div className="destinations-container">
          <div className="section-header">
            <h2 className="section-title">{t('home.destinations.title')}</h2>
            <p className="section-subtitle">{t('home.destinations.subtitle')}</p>
          </div>

          <div className="destinations-grid">
            {destinations.map((destination, index) => (
              <div
                key={index}
                className="destination-card"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="destination-image">
                  <span className="destination-emoji">{destination.image}</span>
                </div>
                <div className="destination-content">
                  <div className="destination-header">
                    <h3 className="destination-name">{destination.name}</h3>
                    <p className="destination-region">{destination.region}</p>
                  </div>

                  <div className="destination-main">
                    <p className="destination-description">{destination.description}</p>

                    <div className="destination-footer">
                      <div className="destination-stats">
                        {destination.stats.map((stat, statIndex) => (
                          <div key={statIndex} className="destination-stat">
                            <span className="destination-stat-icon">{stat.icon}</span>
                            <span>{stat.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="destination-cta">
                        <Link to="/campgrounds" className="destination-cta-btn">
                          {t('home.destinations.exploreCampgrounds')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">{t('home.features.title')}</h2>
            <p className="section-subtitle">{t('home.features.subtitle')}</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-card ${currentFeature === index ? 'active' : ''}`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="feature-icon" style={{ backgroundColor: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="section-header">
            <h2 className="section-title">{t('home.howItWorks.title')}</h2>
            <p className="section-subtitle">{t('home.howItWorks.subtitle')}</p>
          </div>

          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>{t('home.howItWorks.step1.title')}</h3>
              <p>{t('home.howItWorks.step1.description')}</p>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h3>{t('home.howItWorks.step2.title')}</h3>
              <p>{t('home.howItWorks.step2.description')}</p>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h3>{t('home.howItWorks.step3.title')}</h3>
              <p>{t('home.howItWorks.step3.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="section-header">
            <h2 className="section-title">{t('home.testimonials.title')}</h2>
            <p className="section-subtitle">{t('home.testimonials.subtitle')}</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="testimonial-card"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="testimonial-stars">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-location">{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2>{t('home.cta.title')}</h2>
            <p>{t('home.cta.subtitle')}</p>
            <div className="cta-buttons">
              <Link to="/campgrounds" className="btn btn-primary btn-large">
                {t('home.cta.startExploring')}
              </Link>
              <Link to="/trips" className="btn btn-secondary btn-large">
                {t('home.cta.planYourTrip')}
              </Link>
              <Link to="/register" className="btn btn-outline btn-large">
                {t('home.cta.createAccount')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
