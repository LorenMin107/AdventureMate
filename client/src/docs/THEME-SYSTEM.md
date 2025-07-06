# Theme System Documentation

## Overview

The MyanCamp application features a comprehensive theme system that provides consistent styling across light and dark modes, with automatic system preference detection and manual override capabilities.

## Features

### 🎨 **Automatic Theme Detection**

- Automatically detects user's system color scheme preference
- Respects `prefers-color-scheme` media query
- Seamless switching when system preference changes

### 💾 **Theme Persistence**

- Remembers user's manual theme selection
- Stores preference in localStorage
- Falls back to system preference if no manual choice is stored

### 🔄 **Manual Theme Control**

- Theme toggle button in owner layout
- Programmatic theme switching
- Reset to system theme option

### 🎯 **Consistent Design System**

- Comprehensive CSS variables for all colors, shadows, and transitions
- Consistent border radius and spacing
- Enhanced accessibility with proper focus states

## Theme Context Usage

### Basic Usage

```jsx
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { theme, toggleTheme, setSpecificTheme, resetToSystemTheme, isSystemTheme } = useTheme();

  return (
    <div className={`my-component ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <button onClick={toggleTheme}>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</button>
    </div>
  );
};
```

### Available Methods

- `theme`: Current theme ('light' or 'dark')
- `isSystemTheme`: Boolean indicating if using system preference
- `toggleTheme()`: Switch between light and dark themes
- `setSpecificTheme(theme)`: Set a specific theme
- `resetToSystemTheme()`: Reset to system preference

## CSS Variables

### Color Variables

#### Primary Colors

```css
--color-primary: #2e7d32; /* Main brand color */
--color-primary-hover: #1b5e20; /* Hover state */
--color-primary-light: rgba(46, 125, 50, 0.1); /* Light variant */
--color-primary-dark: #1b5e20; /* Dark variant */

--color-secondary: #43a047; /* Secondary brand color */
--color-secondary-hover: #388e3c; /* Hover state */
--color-secondary-light: rgba(67, 160, 71, 0.1); /* Light variant */
```

#### Semantic Colors

```css
--color-success: #28a745; /* Success states */
--color-success-light: rgba(40, 167, 69, 0.1);
--color-success-dark: #1e7e34;

--color-warning: #ffc107; /* Warning states */
--color-warning-light: rgba(255, 193, 7, 0.1);
--color-warning-dark: #e0a800;

--color-error: #dc3545; /* Error states */
--color-error-light: rgba(220, 53, 69, 0.1);
--color-error-dark: #c82333;

--color-info: #17a2b8; /* Info states */
--color-info-light: rgba(23, 162, 184, 0.1);
--color-info-dark: #138496;
```

#### Background Colors

```css
--color-background: #ffffff; /* Main background */
--color-card-bg: #f8f9fa; /* Card backgrounds */
--color-card-bg-light: rgba(0, 0, 0, 0.05); /* Light card variant */
```

#### Text Colors

```css
--color-text: #213547; /* Primary text */
--color-text-muted: #6c757d; /* Muted text */
--color-text-light: #9ca3af; /* Light text */
```

#### Border Colors

```css
--color-border: #e5e7eb; /* Primary borders */
--color-border-light: rgba(229, 231, 235, 0.5); /* Light borders */
```

### Transition Variables

```css
--transition-fast: 0.15s ease; /* Quick transitions */
--transition-normal: 0.3s ease; /* Standard transitions */
--transition-slow: 0.5s ease; /* Slow transitions */
--transition-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bouncy transitions */
```

### Shadow Variables

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Small shadows */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1); /* Medium shadows */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1); /* Large shadows */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1); /* Extra large shadows */
```

### Border Radius Variables

```css
--radius-sm: 0.375rem; /* Small radius */
--radius-md: 0.5rem; /* Medium radius */
--radius-lg: 0.75rem; /* Large radius */
--radius-xl: 1rem; /* Extra large radius */
--radius-2xl: 1.5rem; /* 2X large radius */
```

## Utility Classes

### Theme Transitions

```css
.theme-transition {
  transition:
    background-color var(--transition-normal),
    color var(--transition-normal),
    border-color var(--transition-normal),
    box-shadow var(--transition-normal);
}

.theme-transition-fast {
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}
```

### Button Styles

```css
.btn {
  /* Base button styles */
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-button-text);
  border-color: var(--color-primary);
}

.btn-secondary {
  background: var(--color-secondary);
  color: var(--color-button-text);
  border-color: var(--color-secondary);
}

.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}
```

### Card Styles

```css
.card {
  background: var(--color-card-bg);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  transition: all var(--transition-normal);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### Badge Styles

```css
.badge {
  /* Base badge styles */
}

.badge-success {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.badge-warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
}

.badge-error {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid var(--color-error);
}

.badge-info {
  background: var(--color-info-light);
  color: var(--color-info);
  border: 1px solid var(--color-info);
}
```

## Best Practices

### 1. Always Use CSS Variables

```css
/* ✅ Good */
.my-component {
  background: var(--color-card-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

/* ❌ Bad */
.my-component {
  background: #f8f9fa;
  color: #213547;
  border: 1px solid #e5e7eb;
}
```

### 2. Include Theme Transitions

```css
/* ✅ Good */
.my-component {
  background: var(--color-background);
  color: var(--color-text);
  transition: all var(--transition-normal);
}
```

### 3. Use Semantic Color Variables

```css
/* ✅ Good */
.success-message {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

/* ❌ Bad */
.success-message {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid #28a745;
}
```

### 4. Add Dark Theme Support

```css
.my-component {
  background: var(--color-card-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

/* Dark theme is automatically handled by CSS variables */
```

### 5. Use Consistent Spacing and Radius

```css
/* ✅ Good */
.my-component {
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  margin-bottom: 2rem;
}
```

## Owner Pages Theme Integration

### Layout Structure

```jsx
const OwnerLayout = () => {
  const { theme, toggleTheme, isSystemTheme } = useTheme();

  return (
    <div className={`owner-layout ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Theme toggle button in sidebar */}
      <button onClick={toggleTheme} className="theme-toggle-btn">
        <span className="theme-icon">{isSystemTheme ? '🌓' : theme === 'dark' ? '🌙' : '☀️'}</span>
        <span className="theme-label">
          {isSystemTheme ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      </button>

      {/* Content area */}
      <div className="owner-content">
        <Outlet />
      </div>
    </div>
  );
};
```

### Page Structure

```jsx
const OwnerPage = () => {
  const { theme } = useTheme();

  return (
    <div className={`owner-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Page header with gradient background */}
      <div className="owner-page-header">
        <h1>Page Title</h1>
        <p>Page description</p>
      </div>

      {/* Content cards */}
      <div className="owner-card">
        <h3>Card Title</h3>
        <p>Card content</p>
      </div>

      {/* Action buttons */}
      <button className="owner-btn owner-btn-primary">Primary Action</button>
    </div>
  );
};
```

## Accessibility Features

### Focus States

```css
/* Enhanced focus styles */
*:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}
```

### High Contrast Support

The theme system automatically provides high contrast in dark mode by using brighter colors for better visibility.

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Browser Support

- **Modern Browsers**: Full support for all features
- **CSS Variables**: IE11+ (with polyfill)
- **System Theme Detection**: Chrome 76+, Firefox 67+, Safari 12.1+
- **Backdrop Filter**: Chrome 76+, Firefox 103+, Safari 9+

## Migration Guide

### From Old Theme System

1. **Replace hardcoded colors** with CSS variables
2. **Add theme transitions** to components
3. **Update component structure** to use new utility classes
4. **Test in both light and dark modes**

### Example Migration

```css
/* Old */
.old-component {
  background: #f8f9fa;
  color: #213547;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* New */
.new-component {
  background: var(--color-card-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}
```

## Troubleshooting

### Theme Not Switching

1. Check if `ThemeProvider` wraps your component
2. Verify localStorage permissions
3. Check browser console for errors

### Colors Not Updating

1. Ensure CSS variables are used instead of hardcoded colors
2. Check if component has proper theme class
3. Verify CSS specificity

### Performance Issues

1. Use `theme-transition-fast` for frequent updates
2. Avoid animating all properties
3. Consider using `will-change` for complex animations

## Future Enhancements

- [ ] Custom theme color picker
- [ ] Theme presets (forest, ocean, sunset, etc.)
- [ ] High contrast mode toggle
- [ ] Reduced motion preferences
- [ ] Theme export/import functionality
- [ ] Component-specific theme overrides

---

For questions or issues with the theme system, please refer to the component documentation or create an issue in the project repository.
