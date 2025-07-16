import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useFlashMessage } from '../context/FlashMessageContext';
import './ContactPage.css';

const ContactPage = () => {
  const { t } = useTranslation();
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
      newErrors.name = t('contact.validation.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('contact.validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('contact.validation.validEmail');
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t('contact.validation.subjectRequired');
    }

    if (!formData.message.trim()) {
      newErrors.message = t('contact.validation.messageRequired');
    } else if (formData.message.length < 10) {
      newErrors.message = t('contact.validation.messageMinLength');
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

      addSuccessMessage(t('contact.successMessage'));
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      addErrorMessage(t('contact.errorMessage'));
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
            <h1>{t('contact.title')}</h1>
            <p className="hero-subtitle">{t('contact.subtitle')}</p>
          </div>
        </section>

        <div className="contact-content">
          {/* Contact Information */}
          <section className="contact-info-section">
            <div className="section-content">
              <h2>{t('contact.getInTouch')}</h2>
              <p className="section-description">{t('contact.description')}</p>

              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">📧</div>
                  <h3>{t('contact.email')}</h3>
                  <p>{t('contact.emailAddress')}</p>
                  <p className="method-description">{t('contact.emailDescription')}</p>
                </div>

                <div className="contact-method">
                  <div className="method-icon">📞</div>
                  <h3>{t('contact.phone')}</h3>
                  <p>{t('contact.phoneNumber')}</p>
                  <p className="method-description">{t('contact.phoneDescription')}</p>
                </div>

                <div className="contact-method">
                  <div className="method-icon">💬</div>
                  <h3>{t('contact.liveChat')}</h3>
                  <p>{t('contact.liveChatStatus')}</p>
                  <p className="method-description">{t('contact.liveChatDescription')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Form */}
          <section className="contact-form-section">
            <div className="section-content">
              <div className="form-container">
                <h2>{t('contact.sendMessage')}</h2>
                <p className="form-description">{t('contact.formDescription')}</p>

                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">{t('contact.fullName')} *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={errors.name ? 'error' : ''}
                        placeholder={t('contact.fullNamePlaceholder')}
                      />
                      {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">{t('contact.emailAddressField')} *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={errors.email ? 'error' : ''}
                        placeholder={t('contact.emailPlaceholder')}
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">{t('contact.subject')} *</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={errors.subject ? 'error' : ''}
                      placeholder={t('contact.subjectPlaceholder')}
                    />
                    {errors.subject && <span className="error-message">{errors.subject}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">{t('contact.message')} *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className={errors.message ? 'error' : ''}
                      placeholder={t('contact.messagePlaceholder')}
                      rows="6"
                    ></textarea>
                    {errors.message && <span className="error-message">{errors.message}</span>}
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? t('contact.sending') : t('contact.sendMessageButton')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="faq-section">
            <div className="section-content">
              <h2>{t('contact.faq.title')}</h2>
              <div className="faq-grid">
                <div className="faq-item">
                  <h3>{t('contact.faq.booking.question')}</h3>
                  <p>{t('contact.faq.booking.answer')}</p>
                </div>

                <div className="faq-item">
                  <h3>{t('contact.faq.cancellation.question')}</h3>
                  <p>{t('contact.faq.cancellation.answer')}</p>
                </div>

                <div className="faq-item">
                  <h3>{t('contact.faq.listing.question')}</h3>
                  <p>{t('contact.faq.listing.answer')}</p>
                </div>

                <div className="faq-item">
                  <h3>{t('contact.faq.payment.question')}</h3>
                  <p>{t('contact.faq.payment.answer')}</p>
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
