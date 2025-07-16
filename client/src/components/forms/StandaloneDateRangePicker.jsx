import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import 'react-datepicker/dist/react-datepicker.css';
import './DateRangePicker.css';

/**
 * Standalone DateRangePicker component that doesn't require React Hook Form
 * Allows selecting a date range (start and end dates) in a single component
 *
 * @param {Object} props - Component props
 * @param {Date} props.startDate - Start date value
 * @param {Date} props.endDate - End date value
 * @param {function} props.onStartDateChange - Callback when start date changes
 * @param {function} props.onEndDateChange - Callback when end date changes
 * @param {string} props.label - Label text for the date picker
 * @param {Date} props.minDate - Minimum selectable date
 * @param {Date} props.maxDate - Maximum selectable date
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.className - Additional CSS class names
 * @param {string} props.error - Error message to display
 * @returns {JSX.Element} StandaloneDateRangePicker component
 */
const StandaloneDateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label,
  minDate,
  maxDate,
  required = false,
  className = '',
  error = '',
  ...rest
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  // Convert string dates to Date objects if needed
  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    return new Date(dateValue);
  };

  // Format the selected date range for display
  const formatDateRange = () => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start && !end) return t('forms.selectDates');
    if (start && !end) return `${start.toLocaleDateString()} - ?`;

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  // Handle date changes
  const handleDatesChange = (dates) => {
    const [start, end] = dates;

    // Update temporary dates for display
    setTempStartDate(start);
    setTempEndDate(end);

    // Always update start date first if it's provided
    if (start && onStartDateChange) {
      onStartDateChange(start);
    }

    // Then update end date if it's provided
    if (end && onEndDateChange) {
      onEndDateChange(end);
    }

    // Close the date picker when both dates are selected
    if (start && end) {
      setTimeout(() => setIsOpen(false), 300);
    }
  };

  // Toggle the date picker open/closed
  const toggleDatePicker = () => {
    if (!isOpen) {
      // Reset temporary dates when opening
      setTempStartDate(parseDate(startDate));
      setTempEndDate(parseDate(endDate));
    }
    setIsOpen(!isOpen);
  };

  // Close the date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const datePickerContainer = document.querySelector('.date-range-picker-container');
      if (datePickerContainer && !datePickerContainer.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`date-range-picker ${className}`}>
      {label && (
        <label className="date-range-picker-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}

      <div className="date-range-picker-container">
        <div
          className={`date-range-picker-input ${error ? 'date-range-picker-error' : ''}`}
          onClick={toggleDatePicker}
        >
          <span className="date-range-display">{formatDateRange()}</span>
          <span className="date-range-picker-icon">📅</span>
        </div>

        {isOpen && (
          <div className={`date-range-picker-calendar ${theme === 'dark' ? 'dark-theme' : ''}`}>
            <DatePicker
              selected={tempStartDate}
              onChange={handleDatesChange}
              startDate={tempStartDate}
              endDate={tempEndDate}
              minDate={minDate}
              maxDate={maxDate}
              selectsRange
              inline
              monthsShown={2}
              shouldCloseOnSelect={false}
              calendarClassName={`date-range-calendar ${theme === 'dark' ? 'dark-theme' : ''}`}
              {...rest}
            />
          </div>
        )}
      </div>

      {error && <p className="date-range-picker-error-message">{error}</p>}
    </div>
  );
};

StandaloneDateRangePicker.propTypes = {
  startDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  endDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  onStartDateChange: PropTypes.func,
  onEndDateChange: PropTypes.func,
  label: PropTypes.string,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
  required: PropTypes.bool,
  className: PropTypes.string,
  error: PropTypes.string,
};

export default StandaloneDateRangePicker;
