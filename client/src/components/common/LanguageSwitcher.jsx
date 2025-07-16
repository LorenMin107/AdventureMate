import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = ({ className = '' }) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageChange = (language) => {
    changeLanguage(language);
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
