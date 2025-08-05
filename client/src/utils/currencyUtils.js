// Currency formatting utilities
export const getCurrencySymbol = (currency = 'USD') => {
  return currency === 'THB' ? '฿' : '$';
};

export const formatPrice = (price, currency = 'USD') => {
  if (!price) return '';

  if (currency === 'THB') {
    return `฿${price.toLocaleString('th-TH')}`;
  }
  return `$${price.toLocaleString('en-US')}`;
};

export const getCurrentCurrency = () => {
  const language = localStorage.getItem('adventuremate-language') || 'en';
  return language === 'th' ? 'THB' : 'USD';
};
