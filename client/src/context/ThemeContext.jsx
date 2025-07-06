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
    // Check for stored theme preference first
    const storedTheme = localStorage.getItem('myancamp-theme');
    if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
      return storedTheme;
    }

    // Fall back to browser preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [isSystemTheme, setIsSystemTheme] = useState(!localStorage.getItem('myancamp-theme'));

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

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setIsSystemTheme(false);
    localStorage.setItem('myancamp-theme', newTheme);
  };

  // Set specific theme function
  const setSpecificTheme = (newTheme) => {
    if (['light', 'dark'].includes(newTheme)) {
      setTheme(newTheme);
      setIsSystemTheme(false);
      localStorage.setItem('myancamp-theme', newTheme);
    }
  };

  // Reset to system theme function
  const resetToSystemTheme = () => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    setTheme(systemTheme);
    setIsSystemTheme(true);
    localStorage.removeItem('myancamp-theme');
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
