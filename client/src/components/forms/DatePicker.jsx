import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import './FormStyles.css';

/**
 * Reusable DatePicker component that integrates with React Hook Form
 *
 * @param {Object} props - Component props
 * @param {string} props.name - DatePicker field name (required for react-hook-form)
 * @param {string} props.label - Label text for the date picker
 * @param {string} props.min - Minimum date (YYYY-MM-DD)
 * @param {string} props.max - Maximum date (YYYY-MM-DD)
 * @param {boolean} props.required - Whether the field is required
 * @param {Object} props.validation - Additional validation rules
 * @param {string} props.className - Additional CSS class names
 * @returns {JSX.Element} DatePicker component
 */
const DatePicker = ({
  name,
  label,
  min,
  max,
  required = false,
  validation = {},
  className = '',
  ...rest
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  // Combine validation rules
  const validationRules = {
    ...validation,
    required: required ? 'This field is required' : false,
  };

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}

      <input
        id={name}
        type="date"
        min={min}
        max={max}
        className={`form-date ${errors[name] ? 'form-date-error' : ''}`}
        {...register(name, validationRules)}
        {...rest}
      />

      {errors[name] && <p className="form-error-message">{errors[name].message}</p>}
    </div>
  );
};

DatePicker.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  min: PropTypes.string,
  max: PropTypes.string,
  required: PropTypes.bool,
  validation: PropTypes.object,
  className: PropTypes.string,
};

export default DatePicker;
