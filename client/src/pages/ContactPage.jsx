import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import './ContactPage.css';

const ContactPage = () => {
  const { theme } = useTheme();
  const { addSuccessMessage, addErrorMessage } = useFlashMessage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - replace with actual contact form submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      addSuccessMessage('Thank you for your message! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      addErrorMessage('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`contact-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="contact-container">
        {/* Hero Section */}
        <section className="contact-hero">
          <div className="hero-content">
            <h1>Contact Us</h1>
            <p className="hero-subtitle">
              We're here to help with any questions about camping or our platform
            </p>
          </div>
        </section>

        <div className="contact-content">
          {/* Contact Information */}
          <section className="contact-info-section">
            <div className="section-content">
              <h2>Get in Touch</h2>
              <p className="section-description">
                Have questions about camping, need help with your booking, or want to list your
                campground? We're here to help you every step of the way.
              </p>

              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">📧</div>
                  <h3>Email</h3>
                  <p>support@adventuremate.com</p>
                  <p className="method-description">For general inquiries and support</p>
                </div>

                <div className="contact-method">
                  <div className="method-icon">📞</div>
                  <h3>Phone</h3>
                  <p>+95 123 456 789</p>
                  <p className="method-description">Available Mon-Fri, 9AM-6PM</p>
                </div>

                <div className="contact-method">
                  <div className="method-icon">💬</div>
                  <h3>Live Chat</h3>
                  <p>Available on website</p>
                  <p className="method-description">Get instant help during business hours</p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Form */}
          <section className="contact-form-section">
            <div className="section-content">
              <div className="form-container">
                <h2>Send us a Message</h2>
                <p className="form-description">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>

                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={errors.name ? 'error' : ''}
                        placeholder="Enter your full name"
                      />
                      {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={errors.email ? 'error' : ''}
                        placeholder="Enter your email address"
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={errors.subject ? 'error' : ''}
                      placeholder="What is this about?"
                    />
                    {errors.subject && <span className="error-message">{errors.subject}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className={errors.message ? 'error' : ''}
                      placeholder="Tell us more about your inquiry..."
                      rows="6"
                    ></textarea>
                    {errors.message && <span className="error-message">{errors.message}</span>}
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="faq-section">
            <div className="section-content">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-grid">
                <div className="faq-item">
                  <h3>How do I book a campground?</h3>
                  <p>
                    Browse our campground listings, select your dates, and complete the booking
                    process. You'll receive a confirmation email with all the details.
                  </p>
                </div>

                <div className="faq-item">
                  <h3>Can I cancel my booking?</h3>
                  <p>
                    Yes, you can cancel your booking through your account dashboard. Cancellation
                    policies vary by campground and are clearly stated during booking.
                  </p>
                </div>

                <div className="faq-item">
                  <h3>How do I list my campground?</h3>
                  <p>
                    Visit our owner registration page to apply. We'll review your application and
                    get back to you within 24 hours.
                  </p>
                </div>

                <div className="faq-item">
                  <h3>What payment methods do you accept?</h3>
                  <p>
                    We accept major credit cards, debit cards, and digital wallets. All payments are
                    processed securely through our platform.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
