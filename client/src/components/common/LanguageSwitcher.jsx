import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language || 'en';

  const handleLanguageChange = async (language) => {
    try {
      await i18n.changeLanguage(language);
      localStorage.setItem('adventuremate-language', language);
    } catch (error) {
      console.error('LanguageSwitcher: Error changing language:', error);
    }
  };

  return (
    <div className={`language-switcher ${className}`}>
      <button
        className={`language-btn ${currentLanguage === 'en' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('en')}
        title={t('common.english')}
      >
        EN
      </button>
      <button
        className={`language-btn ${currentLanguage === 'th' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('th')}
        title={t('common.thai')}
      >
        ไทย
      </button>
    </div>
  );
};

export default LanguageSwitcher;
