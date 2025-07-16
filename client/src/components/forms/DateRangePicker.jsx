import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import 'react-datepicker/dist/react-datepicker.css';
import './DateRangePicker.css';

/**
 * DateRangePicker component that integrates with React Hook Form
 * Allows selecting a date range (start and end dates) in a single component
 * Styled to look like Airbnb's date picker
 *
 * @param {Object} props - Component props
 * @param {string} props.startDateName - Name for the start date field in the form
 * @param {string} props.endDateName - Name for the end date field in the form
 * @param {string} props.label - Label text for the date picker
 * @param {Date} props.minDate - Minimum selectable date
 * @param {Date} props.maxDate - Maximum selectable date
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.className - Additional CSS class names
 * @returns {JSX.Element} DateRangePicker component
 */
const DateRangePicker = ({
  startDateName,
  endDateName,
  label,
  minDate,
  maxDate,
  required = false,
  className = '',
  excludeDates = [],
  onStartDateChange,
  onEndDateChange,
  ...rest
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  // Watch the start and end date values
  const startDate = watch(startDateName);
  const endDate = watch(endDateName);

  // State to track if the date picker is open
  const [isOpen, setIsOpen] = useState(false);

  // Convert string dates to Date objects if needed
  const parseDate = (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    return new Date(dateString);
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
    setValue(startDateName, start, { shouldValidate: true });
    setValue(endDateName, end, { shouldValidate: true });

    // Call the callback functions if provided
    if (onStartDateChange) {
      onStartDateChange(start);
    }
    if (onEndDateChange) {
      onEndDateChange(end);
    }

    // Close the date picker when both dates are selected
    if (start && end) {
      setTimeout(() => setIsOpen(false), 300);
    }
  };

  // Toggle the date picker open/closed
  const toggleDatePicker = () => {
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
          className={`date-range-picker-input ${errors[startDateName] || errors[endDateName] ? 'date-range-picker-error' : ''}`}
          onClick={toggleDatePicker}
        >
          <span className="date-range-display">{formatDateRange()}</span>
          <span className="date-range-picker-icon">📅</span>
        </div>

        {isOpen && (
          <div className={`date-range-picker-calendar ${theme === 'dark' ? 'dark-theme' : ''}`}>
            <Controller
              control={control}
              name={startDateName}
              render={({ field }) => (
                <DatePicker
                  selected={parseDate(field.value)}
                  onChange={handleDatesChange}
                  startDate={parseDate(startDate)}
                  endDate={parseDate(endDate)}
                  minDate={minDate}
                  maxDate={maxDate}
                  excludeDates={excludeDates}
                  selectsRange
                  inline
                  monthsShown={2}
                  calendarClassName={`date-range-calendar ${theme === 'dark' ? 'dark-theme' : ''}`}
                  {...rest}
                />
              )}
            />
          </div>
        )}
      </div>

      {(errors[startDateName] || errors[endDateName]) && (
        <p className="date-range-picker-error-message">
          {errors[startDateName]?.message || errors[endDateName]?.message}
        </p>
      )}
    </div>
  );
};

DateRangePicker.propTypes = {
  startDateName: PropTypes.string.isRequired,
  endDateName: PropTypes.string.isRequired,
  label: PropTypes.string,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
  required: PropTypes.bool,
  className: PropTypes.string,
  excludeDates: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  onStartDateChange: PropTypes.func,
  onEndDateChange: PropTypes.func,
};

export default DateRangePicker;
