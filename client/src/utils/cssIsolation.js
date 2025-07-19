/**
 * CSS Isolation Utility
 * Helps prevent CSS class name conflicts between different sections
 */

// CSS class name prefixes for different sections
export const CSS_PREFIXES = {
  FORUM: 'forum',
  ADMIN: 'admin',
  OWNER: 'owner',
  COMMON: 'common',
};

/**
 * Generate a scoped class name
 * @param {string} prefix - The section prefix
 * @param {string} className - The base class name
 * @returns {string} - The scoped class name
 */
export const scopeClass = (prefix, className) => {
  return `${prefix}-${className}`;
};

/**
 * Generate multiple scoped class names
 * @param {string} prefix - The section prefix
 * @param {...string} classNames - The base class names
 * @returns {string} - Space-separated scoped class names
 */
export const scopeClasses = (prefix, ...classNames) => {
  return classNames.map((className) => scopeClass(prefix, className)).join(' ');
};

/**
 * Create a CSS isolation wrapper
 * @param {string} prefix - The section prefix
 * @param {string} baseClass - The base wrapper class
 * @returns {string} - The scoped wrapper class
 */
export const createIsolationWrapper = (prefix, baseClass = 'page') => {
  return scopeClass(prefix, baseClass);
};

/**
 * CSS isolation constants for common patterns
 */
export const ISOLATION_PATTERNS = {
  // Forum specific
  FORUM_PAGE: 'forum-page',
  FORUM_CARD: 'forum-card',
  FORUM_BUTTON: 'forum-btn',
  FORUM_NAV: 'forum-nav',

  // Admin specific
  ADMIN_PAGE: 'admin-page',
  ADMIN_CARD: 'admin-card',
  ADMIN_BUTTON: 'admin-btn',
  ADMIN_NAV: 'admin-nav',

  // Owner specific
  OWNER_PAGE: 'owner-page',
  OWNER_CARD: 'owner-card',
  OWNER_BUTTON: 'owner-btn',
  OWNER_NAV: 'owner-nav',

  // Common patterns that should be scoped
  COMMON_BUTTON: 'common-btn',
  COMMON_CARD: 'common-card',
  COMMON_NAV: 'common-nav',
};

/**
 * Get scoped class name for a pattern
 * @param {string} pattern - The pattern key from ISOLATION_PATTERNS
 * @param {string} prefix - The section prefix
 * @returns {string} - The scoped class name
 */
export const getScopedClass = (pattern, prefix) => {
  const baseClass = ISOLATION_PATTERNS[pattern];
  if (!baseClass) {
    // Unknown pattern - handled gracefully
    return '';
  }
  return scopeClass(prefix, baseClass);
};

/**
 * CSS isolation context for React components
 */
export class CSSIsolationContext {
  constructor(prefix) {
    this.prefix = prefix;
  }

  /**
   * Create a scoped class name
   * @param {string} className - The base class name
   * @returns {string} - The scoped class name
   */
  class(className) {
    return scopeClass(this.prefix, className);
  }

  /**
   * Create multiple scoped class names
   * @param {...string} classNames - The base class names
   * @returns {string} - Space-separated scoped class names
   */
  classes(...classNames) {
    return scopeClasses(this.prefix, ...classNames);
  }

  /**
   * Get a scoped pattern class
   * @param {string} pattern - The pattern key
   * @returns {string} - The scoped class name
   */
  pattern(pattern) {
    return getScopedClass(pattern, this.prefix);
  }
}

// Create context instances for different sections
export const forumCSS = new CSSIsolationContext(CSS_PREFIXES.FORUM);
export const adminCSS = new CSSIsolationContext(CSS_PREFIXES.ADMIN);
export const ownerCSS = new CSSIsolationContext(CSS_PREFIXES.OWNER);
export const commonCSS = new CSSIsolationContext(CSS_PREFIXES.COMMON);
