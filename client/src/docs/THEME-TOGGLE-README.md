# Theme Toggle Feature

## Overview

The AdventureMate application now includes a manual light/dark theme toggle button in the navigation bar, allowing users to switch between light and dark modes regardless of their system preference.

## Features

### 🎨 **Manual Theme Control**

- **Toggle Button**: Located in the navigation bar next to the language switcher
- **Visual Feedback**: Shows sun icon in dark mode, moon icon in light mode
- **Smooth Transitions**: Animated icon rotation and theme switching
- **Persistent**: Remembers user's manual theme choice

### ♿ **Accessibility**

- **Keyboard Navigation**: Supports Enter and Space key activation
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Indicators**: Clear focus states for keyboard users
- **Touch-Friendly**: Minimum 44px touch targets on mobile

### 📱 **Mobile Responsive**

- **Adaptive Sizing**: Smaller icons and buttons on mobile devices
- **Touch Optimized**: Proper touch targets for mobile interaction
- **Consistent Placement**: Available in both desktop and mobile navigation

## Implementation

### Components

#### `ThemeToggle.jsx`

- **Location**: `client/src/components/common/ThemeToggle.jsx`
- **Purpose**: Main theme toggle button component
- **Features**:
  - Uses Feather Icons (FiSun, FiMoon)
  - Integrates with ThemeContext
  - Handles keyboard events
  - Provides accessibility attributes

#### `ThemeToggle.css`

- **Location**: `client/src/components/common/ThemeToggle.css`
- **Purpose**: Styling for the theme toggle button
- **Features**:
  - Responsive design
  - Hover and focus states
  - Smooth animations
  - Mobile optimizations

### Integration

#### Header Component

- **Location**: `client/src/components/Header.jsx`
- **Integration**: Added to `nav-controls` section
- **Positioning**: Next to language switcher

#### Theme Context

- **Location**: `client/src/context/ThemeContext.jsx`
- **Integration**: Uses existing `toggleTheme` function
- **Persistence**: Leverages existing localStorage functionality

## Usage

### For Users

1. **Desktop**: Click the sun/moon icon in the top navigation bar
2. **Mobile**: Tap the sun/moon icon in the mobile navigation
3. **Keyboard**: Tab to the button and press Enter or Space
4. **Persistence**: Theme choice is automatically saved

### For Developers

```jsx
import ThemeToggle from './components/common/ThemeToggle';

// Basic usage
<ThemeToggle />

// With custom className
<ThemeToggle className="custom-theme-toggle" />
```

## Styling

### CSS Variables Used

- `--color-text`: Button text color
- `--color-primary`: Primary accent color
- `--color-primary-light`: Light background on hover
- `--color-header-text`: Header-specific text color

### Responsive Breakpoints

- **Desktop**: 44px minimum touch target
- **Tablet (768px)**: 40px minimum touch target
- **Mobile (480px)**: 36px minimum touch target

## Browser Support

- **Modern Browsers**: Full support with animations
- **Legacy Browsers**: Graceful degradation without animations
- **Mobile Browsers**: Full touch support
- **Screen Readers**: Proper ARIA support

## Future Enhancements

### Potential Improvements

- **System Theme Sync**: Option to sync with system preference
- **Custom Themes**: User-defined color schemes
- **Animation Options**: User preference for animations
- **Theme Preview**: Preview before applying changes

### Accessibility Enhancements

- **Reduced Motion**: Respect user's motion preferences
- **High Contrast**: Enhanced contrast mode support
- **Voice Commands**: Voice activation support

## Testing

### Manual Testing Checklist

- [ ] Theme toggle works on desktop
- [ ] Theme toggle works on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Theme persists after page refresh
- [ ] Smooth transitions work
- [ ] Icons change correctly
- [ ] Touch targets are adequate

### Automated Testing

```javascript
// Example test structure
describe('ThemeToggle', () => {
  it('should toggle theme when clicked', () => {
    // Test implementation
  });

  it('should respond to keyboard events', () => {
    // Test implementation
  });

  it('should have proper accessibility attributes', () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Common Issues

1. **Theme not persisting**: Check localStorage permissions
2. **Icons not showing**: Verify react-icons installation
3. **Styling conflicts**: Check CSS specificity
4. **Mobile not working**: Verify touch event handling

### Debug Steps

1. Check browser console for errors
2. Verify ThemeContext is properly wrapped
3. Test in different browsers
4. Check mobile device compatibility
