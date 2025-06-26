import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import './FormStyles.css';

/**
 * Reusable Input component that integrates with React Hook Form
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - Input field name (required for react-hook-form)
 * @param {string} props.label - Label text for the input
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether the field is required
 * @param {Object} props.validation - Additional validation rules
 * @param {string} props.className - Additional CSS class names
 * @returns {JSX.Element} Input component
 */
const Input = ({
  name,
  label,
  type = 'text',
  placeholder = '',
  required = false,
  validation = {},
  className = '',
  ...rest
}) => {
  const { register, formState: { errors } } = useFormContext();
  
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
        type={type}
        placeholder={placeholder}
        className={`form-input ${errors[name] ? 'form-input-error' : ''}`}
        {...register(name, validationRules)}
        {...rest}
      />
      
      {errors[name] && (
        <p className="form-error-message">
          {errors[name].message}
        </p>
      )}
    </div>
  );
};

Input.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  validation: PropTypes.object,
  className: PropTypes.string,
};

export default Input;