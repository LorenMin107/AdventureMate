import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('myancamp-language');
    if (savedLanguage && ['en', 'th'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
      i18n.changeLanguage(savedLanguage);
      setCurrency(savedLanguage === 'th' ? 'THB' : 'USD');
    } else {
      // Default to English
      setCurrentLanguage('en');
      i18n.changeLanguage('en');
      setCurrency('USD');
    }
  }, [i18n]);

  // Change language function
  const changeLanguage = (language) => {
    if (['en', 'th'].includes(language)) {
      setCurrentLanguage(language);
      i18n.changeLanguage(language);
      localStorage.setItem('myancamp-language', language);
      setCurrency(language === 'th' ? 'THB' : 'USD');
    }
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    return currency === 'THB' ? '฿' : '$';
  };

  // Format price based on currency
  const formatPrice = (price) => {
    if (currency === 'THB') {
      return `฿${price.toLocaleString('th-TH')}`;
    }
    return `$${price.toLocaleString('en-US')}`;
  };

  const value = {
    currentLanguage,
    currency,
    changeLanguage,
    getCurrencySymbol,
    formatPrice,
    isThai: currentLanguage === 'th',
    isEnglish: currentLanguage === 'en',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
