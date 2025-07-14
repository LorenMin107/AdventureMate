import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import './FormStyles.css';

/**
 * Reusable Select component that integrates with React Hook Form
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Select field name (required for react-hook-form)
 * @param {string} props.label - Label text for the select
 * @param {Array} props.options - Array of options for the select
 * @param {string} props.placeholder - Placeholder text (first option)
 * @param {boolean} props.required - Whether the field is required
 * @param {Object} props.validation - Additional validation rules
 * @param {string} props.className - Additional CSS class names
 * @returns {JSX.Element} Select component
 */
const Select = ({
  name,
  label,
  options = [],
  placeholder = 'Select an option',
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

      <select
        id={name}
        className={`form-select ${errors[name] ? 'form-select-error' : ''}`}
        {...register(name, validationRules)}
        {...rest}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {errors[name] && <p className="form-error-message">{errors[name].message}</p>}
    </div>
  );
};

Select.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  validation: PropTypes.object,
  className: PropTypes.string,
};

export default Select;
