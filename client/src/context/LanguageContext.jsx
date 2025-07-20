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
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [isInitialized, setIsInitialized] = useState(false);

  // Always call useTranslation to follow Rules of Hooks
  let translation = null;
  let i18n = null;

  try {
    translation = useTranslation();
    i18n = translation.i18n;
  } catch (error) {
    console.error('LanguageContext: Error using useTranslation:', error);
  }

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLanguage = localStorage.getItem('myancamp-language');
        if (savedLanguage && ['en', 'th'].includes(savedLanguage)) {
          setCurrentLanguage(savedLanguage);
          setCurrency(savedLanguage === 'th' ? 'THB' : 'USD');
        } else {
          // Default to English
          setCurrentLanguage('en');
          setCurrency('USD');
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('LanguageContext: Error initializing language:', error);
        setCurrentLanguage('en');
        setCurrency('USD');
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, []);

  // Update i18n when currentLanguage changes
  useEffect(() => {
    if (isInitialized && i18n && i18n.changeLanguage) {
      try {
        i18n.changeLanguage(currentLanguage);
      } catch (error) {
        console.error('LanguageContext: Error changing language:', error);
      }
    }
  }, [currentLanguage, i18n, isInitialized]);

  // Change language function
  const changeLanguage = async (language) => {
    if (['en', 'th'].includes(language)) {
      setCurrentLanguage(language);
      localStorage.setItem('myancamp-language', language);
      setCurrency(language === 'th' ? 'THB' : 'USD');

      try {
        // Force reload of resources and change language
        if (i18n && i18n.changeLanguage) {
          await i18n.changeLanguage(language);
        }
      } catch (error) {
        console.error('LanguageContext: Error changing language:', error);
      }
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
