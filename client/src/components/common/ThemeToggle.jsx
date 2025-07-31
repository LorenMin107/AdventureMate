import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      role="button"
      tabIndex={0}
    >
      {theme === 'light' ? (
        <FiMoon className="theme-icon" aria-hidden="true" />
      ) : (
        <FiSun className="theme-icon" aria-hidden="true" />
      )}
    </button>
  );
};

export default ThemeToggle;
