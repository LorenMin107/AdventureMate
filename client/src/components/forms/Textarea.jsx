import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import './FormStyles.css';

/**
 * Reusable Textarea component that integrates with React Hook Form
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Textarea field name (required for react-hook-form)
 * @param {string} props.label - Label text for the textarea
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether the field is required
 * @param {number} props.rows - Number of rows for the textarea
 * @param {Object} props.validation - Additional validation rules
 * @param {string} props.className - Additional CSS class names
 * @returns {JSX.Element} Textarea component
 */
const Textarea = ({
  name,
  label,
  placeholder = '',
  required = false,
  rows = 4,
  validation = {},
  className = '',
  ...rest
}) => {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
  } = useFormContext();

  // Combine validation rules
  const validationRules = {
    ...validation,
    required: required ? t('forms.fieldRequired') : false,
  };

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}

      <textarea
        id={name}
        placeholder={placeholder}
        rows={rows}
        className={`form-textarea ${errors[name] ? 'form-textarea-error' : ''}`}
        {...register(name, validationRules)}
        {...rest}
      />

      {errors[name] && <p className="form-error-message">{errors[name].message}</p>}
    </div>
  );
};

Textarea.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  rows: PropTypes.number,
  validation: PropTypes.object,
  className: PropTypes.string,
};

export default Textarea;
