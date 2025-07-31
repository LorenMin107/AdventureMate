import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme based on stored preference or browser preference
  const getInitialTheme = () => {
    try {
      // Check for stored theme preference first
      const storedTheme = localStorage.getItem('myancamp-theme');
      if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
        return storedTheme;
      }

      // Fall back to browser preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (error) {
      console.warn('Error reading theme from localStorage:', error);
      // Fall back to browser preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [isSystemTheme, setIsSystemTheme] = useState(() => {
    try {
      return !localStorage.getItem('myancamp-theme');
    } catch (error) {
      console.warn('Error checking system theme:', error);
      return true;
    }
  });

  // Listen for changes in system color scheme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Define the handler function
    const handleChange = (e) => {
      if (isSystemTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Add event listener
    mediaQuery.addEventListener('change', handleChange);

    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [isSystemTheme]);

  // Update document theme when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Ensure theme is properly restored after OAuth redirects or page reloads
  useEffect(() => {
    const restoreTheme = () => {
      try {
        const storedTheme = localStorage.getItem('myancamp-theme');
        if (storedTheme && ['light', 'dark'].includes(storedTheme) && storedTheme !== theme) {
          console.log('Restoring theme from localStorage:', storedTheme);
          setTheme(storedTheme);
          setIsSystemTheme(false);
        }
      } catch (error) {
        console.warn('Error restoring theme from localStorage:', error);
      }
    };

    // Restore theme after a short delay to ensure localStorage is available
    const timeoutId = setTimeout(restoreTheme, 100);

    return () => clearTimeout(timeoutId);
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      setIsSystemTheme(false);
      localStorage.setItem('myancamp-theme', newTheme);
    } catch (error) {
      console.warn('Error toggling theme:', error);
      // Still update the theme state even if localStorage fails
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      setIsSystemTheme(false);
    }
  };

  // Set specific theme function
  const setSpecificTheme = (newTheme) => {
    if (['light', 'dark'].includes(newTheme)) {
      try {
        setTheme(newTheme);
        setIsSystemTheme(false);
        localStorage.setItem('myancamp-theme', newTheme);
      } catch (error) {
        console.warn('Error setting specific theme:', error);
        // Still update the theme state even if localStorage fails
        setTheme(newTheme);
        setIsSystemTheme(false);
      }
    }
  };

  // Reset to system theme function
  const resetToSystemTheme = () => {
    try {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      setTheme(systemTheme);
      setIsSystemTheme(true);
      localStorage.removeItem('myancamp-theme');
    } catch (error) {
      console.warn('Error resetting to system theme:', error);
      // Still update the theme state even if localStorage fails
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      setTheme(systemTheme);
      setIsSystemTheme(true);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isSystemTheme,
        toggleTheme,
        setSpecificTheme,
        resetToSystemTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
