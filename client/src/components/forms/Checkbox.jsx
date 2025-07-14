import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import './FormStyles.css';

/**
 * Reusable Checkbox component that integrates with React Hook Form
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Checkbox field name (required for react-hook-form)
 * @param {string} props.label - Label text for the checkbox
 * @param {boolean} props.required - Whether the field is required
 * @param {Object} props.validation - Additional validation rules
 * @param {string} props.className - Additional CSS class names
 * @returns {JSX.Element} Checkbox component
 */
const Checkbox = ({ name, label, required = false, validation = {}, className = '', ...rest }) => {
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
    <div className={`form-field form-field-checkbox ${className}`}>
      <div className="checkbox-container">
        <input
          id={name}
          type="checkbox"
          className={`form-checkbox ${errors[name] ? 'form-checkbox-error' : ''}`}
          {...register(name, validationRules)}
          {...rest}
        />

        {label && (
          <label htmlFor={name} className="form-checkbox-label">
            {label}
            {required && <span className="required-mark">*</span>}
          </label>
        )}
      </div>

      {errors[name] && <p className="form-error-message">{errors[name].message}</p>}
    </div>
  );
};

Checkbox.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  required: PropTypes.bool,
  validation: PropTypes.object,
  className: PropTypes.string,
};

export default Checkbox;
