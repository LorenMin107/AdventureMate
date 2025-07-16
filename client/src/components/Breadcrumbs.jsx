import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Breadcrumbs.css';

/**
 * Breadcrumbs component for displaying navigation path
 * Automatically generates breadcrumbs based on the current route
 */
const Breadcrumbs = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // Skip rendering breadcrumbs on the home page
  if (location.pathname === '/') {
    return null;
  }

  // Split the path into segments
  const pathSegments = location.pathname.split('/').filter((segment) => segment);

  // Generate breadcrumb items
  const breadcrumbItems = pathSegments.map((segment, index) => {
    // Create the path for this breadcrumb
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;

    // Format the segment for display (capitalize, replace hyphens with spaces)
    let formattedSegment = segment.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

    // Handle special cases like IDs
    if (segment.match(/^[0-9a-f]{24}$/i)) {
      formattedSegment = t('breadcrumbs.details');
    } else if (segment === 'edit') {
      formattedSegment = t('breadcrumbs.edit');
    } else if (segment === 'new') {
      formattedSegment = t('breadcrumbs.new');
    }

    // Return the breadcrumb item
    return {
      path,
      label: formattedSegment,
      isLast: index === pathSegments.length - 1,
    };
  });

  return (
    <nav aria-label="breadcrumb" className="breadcrumbs">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/">{t('breadcrumbs.home')}</Link>
        </li>

        {breadcrumbItems.map((item, index) => (
          <li
            key={item.path}
            className={`breadcrumb-item ${item.isLast ? 'active' : ''}`}
            aria-current={item.isLast ? 'page' : undefined}
          >
            {item.isLast ? <span>{item.label}</span> : <Link to={item.path}>{item.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
