import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import useSearchSuggestions from '../hooks/useSearchSuggestions';
import { logInfo } from '../utils/logger';
import './SearchAutocomplete.css';
import { useTranslation } from 'react-i18next';

/**
 * SearchAutocomplete component provides search suggestions and autocomplete functionality
 *
 * @param {Object} props - Component props
 * @param {string} props.value - Current search value
 * @param {function} props.onChange - Callback when search value changes
 * @param {function} props.onSearch - Callback when search is submitted
 * @param {string} props.placeholder - Input placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether the input is disabled
 * @returns {JSX.Element} Search autocomplete component
 */
const SearchAutocomplete = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search campgrounds...',
  className = '',
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Get search suggestions
  const { data: suggestionsData, isLoading } = useSearchSuggestions(inputValue, {
    enabled: inputValue.length >= 2 && isOpen,
  });

  const suggestions = suggestionsData?.suggestions || [];
  const popularTerms = suggestionsData?.popularTerms || [];

  // Debug logging
  console.log('SearchAutocomplete debug:', {
    inputValue,
    suggestionsData,
    suggestions,
    popularTerms,
    isLoading,
    isOpen,
  });

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHighlightedIndex(-1);
    setIsOpen(newValue.length >= 2);

    if (onChange) {
      onChange(newValue);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.length >= 2) {
      setIsOpen(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay closing to allow for suggestion clicks
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 200);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);

    if (onChange) {
      onChange(suggestion);
    }

    if (onSearch) {
      onSearch(suggestion);
    }

    logInfo('Search suggestion selected', { suggestion });
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        } else if (inputValue.trim()) {
          if (onSearch) {
            onSearch(inputValue.trim());
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      if (onSearch) {
        onSearch(inputValue.trim());
      }
    }
  };

  return (
    <div className={`search-autocomplete ${className}`} ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <div className="search-input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="search-input"
            autoComplete="off"
            aria-label={t('searchAutocomplete.searchCampgrounds')}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            role="combobox"
          />

          <button
            type="submit"
            className="search-button"
            disabled={disabled || !inputValue.trim()}
            aria-label={t('common.search')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="suggestions-dropdown" role="listbox">
          {isLoading && (
            <div className="suggestion-item loading">
              <span>{t('searchAutocomplete.loadingSuggestions')}</span>
            </div>
          )}

          {!isLoading &&
            suggestions.length === 0 &&
            popularTerms.length === 0 &&
            inputValue.length >= 2 && (
              <div className="suggestion-item no-results">
                <span>{t('searchAutocomplete.noSuggestionsFound')}</span>
              </div>
            )}

          {!isLoading && suggestions.length > 0 && (
            <>
              <div className="suggestions-section">
                <div className="suggestions-header">
                  <span>{t('searchAutocomplete.suggestions')}</span>
                </div>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`suggestion-${index}`}
                    className={`suggestion-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={index === highlightedIndex}
                  >
                    <span className="suggestion-text">{suggestion}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isLoading && popularTerms.length > 0 && (
            <div className="suggestions-section">
              <div className="suggestions-header">
                <span>{t('searchAutocomplete.popularSearches')}</span>
              </div>
              {popularTerms.map((term, index) => (
                <div
                  key={`popular-${index}`}
                  className={`suggestion-item popular ${suggestions.length + index === highlightedIndex ? 'highlighted' : ''}`}
                  onClick={() => handleSuggestionClick(term)}
                  onMouseEnter={() => setHighlightedIndex(suggestions.length + index)}
                  role="option"
                  aria-selected={suggestions.length + index === highlightedIndex}
                >
                  <span className="suggestion-text">{term}</span>
                  <span className="popular-badge">Popular</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

SearchAutocomplete.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSearch: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default SearchAutocomplete;
