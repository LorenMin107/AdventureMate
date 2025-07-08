import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './HomePage.css';

const HomePage = () => {
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
      title: 'Mountain Adventures',
      description:
        "Discover pristine mountain campgrounds in Northern Thailand's stunning landscapes.",
      color: 'var(--color-primary)',
    },
    {
      icon: '🏖️',
      title: 'Beach Camping',
      description: "Experience coastal camping along Thailand's beautiful beaches and islands.",
      color: 'var(--color-secondary)',
    },
    {
      icon: '🌿',
      title: 'Jungle Retreats',
      description: "Immerse yourself in Thailand's lush jungles and national parks.",
      color: 'var(--color-warning)',
    },
    {
      icon: '🗺️',
      title: 'Trip Planner',
      description:
        'Plan your perfect camping adventure with our comprehensive trip planning tools.',
      color: 'var(--color-success)',
    },
  ];

  const testimonials = [
    {
      name: 'Somchai',
      location: 'Chiang Mai',
      text: 'Found amazing mountain camping spots near Doi Inthanon. The booking was seamless and the views were incredible!',
      rating: 5,
    },
    {
      name: 'Nong',
      location: 'Phuket',
      text: 'Beach camping in Krabi was a dream come true. The community reviews helped us choose the perfect spot.',
      rating: 5,
    },
    {
      name: 'Pim',
      location: 'Bangkok',
      text: "As a city dweller, I love escaping to Thailand's national parks. The booking system makes it so easy!",
      rating: 5,
    },
  ];

  const destinations = [
    {
      name: 'Chiang Mai',
      region: 'Northern Thailand',
      description: 'Mountain camping with cool weather and stunning views',
      image: '🏔️',
      stats: [
        { icon: '🌡️', label: 'Cool Climate' },
        { icon: '🏕️', label: '50+ Sites' },
      ],
    },
    {
      name: 'Krabi',
      region: 'Southern Thailand',
      description: 'Beach camping with crystal clear waters',
      image: '🏖️',
      stats: [
        { icon: '🌊', label: 'Beach Access' },
        { icon: '🏕️', label: '30+ Sites' },
      ],
    },
    {
      name: 'Kanchanaburi',
      region: 'Western Thailand',
      description: 'River camping and jungle adventures',
      image: '🌿',
      stats: [
        { icon: '🌲', label: 'Jungle Trails' },
        { icon: '🏕️', label: '25+ Sites' },
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
              <span className="hero-title-main">Explore</span>
              <span className="hero-title-sub">Thailand's Natural Wonders</span>
            </h1>
            <p className="hero-description">
              Discover, book, and experience the most beautiful campgrounds across Thailand. From
              misty mountains to pristine beaches, your next adventure awaits in the Land of Smiles.
            </p>
            <div className="hero-cta">
              <Link to="/campgrounds" className="btn btn-primary btn-large">
                Explore Campgrounds
              </Link>
              <Link to="/campgrounds" className="btn btn-outline btn-large">
                View Destinations
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
            <h2 className="section-title">Popular Destinations</h2>
            <p className="section-subtitle">
              Discover Thailand's most sought-after camping locations
            </p>
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
                          Explore Campgrounds
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
            <h2 className="section-title">Why Choose AdventureMate?</h2>
            <p className="section-subtitle">
              Everything you need for the perfect camping experience in Thailand
            </p>
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
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Get started in just three simple steps</p>
          </div>

          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>Search & Discover</h3>
              <p>
                Browse through our curated collection of campgrounds across Thailand's 77 provinces
              </p>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h3>Book Your Stay</h3>
              <p>Choose your dates and secure your spot with our easy booking system</p>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h3>Enjoy & Share</h3>
              <p>
                Experience Thailand's natural beauty and share your adventures with the community
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="section-header">
            <h2 className="section-title">What Our Campers Say</h2>
            <p className="section-subtitle">
              Real experiences from real adventurers across Thailand
            </p>
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
            <h2>Ready for Your Thai Adventure?</h2>
            <p>Join thousands of campers discovering Thailand's natural wonders</p>
            <div className="cta-buttons">
              <Link to="/campgrounds" className="btn btn-primary btn-large">
                Start Exploring
              </Link>
              <Link to="/trips" className="btn btn-secondary btn-large">
                Plan Your Trip
              </Link>
              <Link to="/register" className="btn btn-outline btn-large">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
