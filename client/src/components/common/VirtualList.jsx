import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { logInfo } from '../../utils/logger';
import './VirtualList.css';

/**
 * VirtualList - A high-performance virtual scrolling component for large datasets
 *
 * Features:
 * - Only renders visible items in the viewport
 * - Smooth scrolling with minimal memory usage
 * - Configurable item height and buffer
 * - Loading states and error handling
 * - Accessibility support
 * - Responsive design
 */
const VirtualList = ({
  items = [],
  itemHeight = 60,
  containerHeight = 400,
  buffer = 5,
  renderItem,
  loading = false,
  error = null,
  emptyMessage = null,
  onLoadMore = null,
  hasMore = false,
  className = '',
  itemClassName = '',
  loadingComponent = null,
  errorComponent = null,
  emptyComponent = null,
  ...props
}) => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // Calculate virtual scrolling values
  const virtualValues = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + buffer
    );
    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;

    return {
      totalHeight,
      startIndex,
      endIndex,
      visibleItems,
      offsetY,
      visibleCount: visibleItems.length,
    };
  }, [items, scrollTop, containerHeight, itemHeight, buffer]);

  // Handle scroll events
  const handleScroll = useCallback(
    (event) => {
      const newScrollTop = event.target.scrollTop;
      setScrollTop(newScrollTop);

      // Log scroll performance in development
      if (process.env.NODE_ENV === 'development') {
        logInfo('VirtualList scroll', {
          scrollTop: newScrollTop,
          visibleItems: virtualValues.visibleCount,
          totalItems: items.length,
        });
      }
    },
    [virtualValues.visibleCount, items.length]
  );

  // Handle container resize
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
  }, []);

  // Intersection observer for infinite loading
  const intersectionRef = useRef(null);
  const handleIntersection = useCallback(
    (entries) => {
      const [entry] = entries;
      setIsIntersecting(entry.isIntersecting);

      if (entry.isIntersecting && hasMore && onLoadMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, onLoadMore, loading]
  );

  // Set up intersection observer
  useEffect(() => {
    if (intersectionRef.current && hasMore) {
      const observer = new IntersectionObserver(handleIntersection, {
        root: containerRef.current,
        rootMargin: '100px',
        threshold: 0.1,
      });

      observer.observe(intersectionRef.current);

      return () => observer.disconnect();
    }
  }, [handleIntersection, hasMore]);

  // Set up resize observer
  useEffect(() => {
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [handleResize]);

  // Default components
  const defaultLoadingComponent = (
    <div className="virtual-list-loading">
      <div className="loading-spinner"></div>
      <span>{t('common.loading')}</span>
    </div>
  );

  const defaultErrorComponent = (
    <div className="virtual-list-error">
      <span className="error-icon">⚠️</span>
      <span>{error || t('common.error')}</span>
    </div>
  );

  const defaultEmptyComponent = (
    <div className="virtual-list-empty">
      <span className="empty-icon">📭</span>
      <span>{emptyMessage || t('common.noItems')}</span>
    </div>
  );

  // Render loading state
  if (loading && items.length === 0) {
    return (
      <div className={`virtual-list-container ${className}`} style={{ height: containerHeight }}>
        {loadingComponent || defaultLoadingComponent}
      </div>
    );
  }

  // Render error state
  if (error && items.length === 0) {
    return (
      <div className={`virtual-list-container ${className}`} style={{ height: containerHeight }}>
        {errorComponent || defaultErrorComponent}
      </div>
    );
  }

  // Render empty state
  if (items.length === 0) {
    return (
      <div className={`virtual-list-container ${className}`} style={{ height: containerHeight }}>
        {emptyComponent || defaultEmptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{ height: containerHeight }}
      {...props}
    >
      <div
        className="virtual-list-scroll-container"
        style={{ height: virtualValues.totalHeight }}
        onScroll={handleScroll}
      >
        <div
          className="virtual-list-content"
          style={{
            transform: `translateY(${virtualValues.offsetY}px)`,
            width: containerWidth,
          }}
        >
          {virtualValues.visibleItems.map((item, index) => {
            const actualIndex = virtualValues.startIndex + index;
            return (
              <div
                key={`${item.id || actualIndex}-${actualIndex}`}
                className={`virtual-list-item ${itemClassName}`}
                style={{ height: itemHeight }}
                data-index={actualIndex}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}

          {/* Intersection observer target for infinite loading */}
          {hasMore && (
            <div
              ref={intersectionRef}
              className="virtual-list-intersection-target"
              style={{ height: '1px', width: '100%' }}
            />
          )}
        </div>
      </div>

      {/* Loading indicator for infinite loading */}
      {loading && hasMore && (
        <div className="virtual-list-loading-more">
          {loadingComponent || defaultLoadingComponent}
        </div>
      )}
    </div>
  );
};

VirtualList.propTypes = {
  items: PropTypes.array.isRequired,
  itemHeight: PropTypes.number,
  containerHeight: PropTypes.number,
  buffer: PropTypes.number,
  renderItem: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  emptyMessage: PropTypes.string,
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  className: PropTypes.string,
  itemClassName: PropTypes.string,
  loadingComponent: PropTypes.node,
  errorComponent: PropTypes.node,
  emptyComponent: PropTypes.node,
};

export default VirtualList;
