/**
 * Theme debugging utilities
 * Helps identify and fix theme-related issues, especially after OAuth redirects
 */

/**
 * Debug theme state and localStorage
 */
export const debugThemeState = () => {
  try {
    const storedTheme = localStorage.getItem('myancamp-theme');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    console.log('=== Theme Debug Info ===');
    console.log('localStorage theme:', storedTheme);
    console.log('Current document theme:', currentTheme);
    console.log('System prefers dark:', systemPrefersDark);
    console.log('Current URL:', window.location.href);
    console.log(
      'Is OAuth callback page:',
      window.location.pathname.includes('/auth/google/callback')
    );
    console.log('========================');

    return {
      storedTheme,
      currentTheme,
      systemPrefersDark,
      isOAuthCallback: window.location.pathname.includes('/auth/google/callback'),
    };
  } catch (error) {
    console.error('Error debugging theme state:', error);
    return null;
  }
};

/**
 * Force restore theme from localStorage
 */
export const forceRestoreTheme = () => {
  try {
    const storedTheme = localStorage.getItem('myancamp-theme');
    if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
      console.log('Force restoring theme:', storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
      return storedTheme;
    }
    return null;
  } catch (error) {
    console.error('Error force restoring theme:', error);
    return null;
  }
};

/**
 * Check if theme is consistent between localStorage and document
 */
export const checkThemeConsistency = () => {
  try {
    const storedTheme = localStorage.getItem('myancamp-theme');
    const currentTheme = document.documentElement.getAttribute('data-theme');

    const isConsistent = storedTheme === currentTheme;

    if (!isConsistent) {
      console.warn('Theme inconsistency detected:', {
        storedTheme,
        currentTheme,
        url: window.location.href,
      });
    }

    return isConsistent;
  } catch (error) {
    console.error('Error checking theme consistency:', error);
    return false;
  }
};
