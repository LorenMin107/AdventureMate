import React, { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

/**
 * PageTransition component
 * Wraps page content and adds transition animations between route changes
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 */
const PageTransition = ({ children }) => {
  const location = useLocation();
  const elementRef = useRef(null);

  // Determine route pattern for specific animations
  const getRoutePattern = (pathname) => {
    if (pathname.startsWith('/campgrounds')) {
      return '/campgrounds';
    } else if (pathname.startsWith('/admin')) {
      return '/admin';
    }
    return '';
  };

  // Apply animation on route change
  useEffect(() => {
    const element = elementRef.current;

    if (element) {
      // Reset animation
      element.classList.remove('page-enter-active');
      element.classList.remove('page-exit-active');

      // Set route pattern data attribute for specific animations
      const routePattern = getRoutePattern(location.pathname);
      element.setAttribute('data-route-pattern', routePattern);

      // Force a reflow to ensure the animation restarts
      void element.offsetWidth;

      // Add animation classes
      element.classList.add('page-enter');

      // Use requestAnimationFrame to ensure the animation starts properly
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.classList.remove('page-enter');
          element.classList.add('page-enter-active');
        });
      });
    }

    // Cleanup function
    return () => {
      if (element) {
        element.classList.remove('page-enter-active');
        element.classList.add('page-exit-active');
      }
    };
  }, [location.pathname]);

  return (
    <div ref={elementRef} className="page-transition">
      {children}
    </div>
  );
};

export default PageTransition;
