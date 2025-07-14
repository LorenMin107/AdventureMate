import React from 'react';
import { createIsolationWrapper } from '../utils/cssIsolation';

/**
 * CSS Isolation Wrapper Component
 * Wraps page content with CSS isolation to prevent style conflicts
 *
 * @param {Object} props - Component props
 * @param {string} props.section - The section prefix (forum, admin, owner, common)
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
const CSSIsolationWrapper = ({ section = 'common', children, className = '', style = {} }) => {
  const wrapperClass = createIsolationWrapper(section, 'page');
  const combinedClassName = `${wrapperClass} ${className}`.trim();

  return (
    <div className={combinedClassName} style={style} data-section={section}>
      {children}
    </div>
  );
};

export default CSSIsolationWrapper;
