import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import './FormStyles.css';

/**
 * Form component that provides React Hook Form context to its children
 * 
 * @param {Object} props - Component props
 * @param {Object} props.schema - Yup validation schema
 * @param {Object} props.defaultValues - Default values for the form
 * @param {Function} props.onSubmit - Function to call when the form is submitted
 * @param {ReactNode} props.children - Form fields and other content
 * @param {string} props.className - Additional CSS class names
 * @param {boolean} props.showSubmitButton - Whether to show the submit button
 * @param {string} props.submitButtonText - Text for the submit button
 * @returns {JSX.Element} Form component
 */
const Form = ({
  schema,
  defaultValues = {},
  onSubmit,
  children,
  className = '',
  showSubmitButton = true,
  submitButtonText = 'Submit',
  errorMessage = '',
  successMessage = '',
  ...rest
}) => {
  // State for form-level messages
  const [formError, setFormError] = useState(errorMessage);
  const [formSuccess, setFormSuccess] = useState(successMessage);

  // Initialize form methods with validation schema if provided
  const formMethods = useForm({
    defaultValues,
    resolver: schema ? yupResolver(schema) : undefined,
    mode: 'onChange', // Validate on change for real-time feedback
  });

  const { 
    handleSubmit, 
    formState: { isSubmitting, isValid, errors },
    reset
  } = formMethods;

  // Handle form submission with error handling
  const handleFormSubmit = async (data) => {
    try {
      setFormError('');
      setFormSuccess('');

      // Call the provided onSubmit function
      await onSubmit(data);

      // Show success message if provided
      if (successMessage) {
        setFormSuccess(successMessage);
      }

      // Reset form if submission was successful
      if (rest.resetOnSubmit) {
        reset();
      }
    } catch (error) {
      // Show error message
      setFormError(error.message || 'An error occurred. Please try again.');
      console.error('Form submission error:', error);
    }
  };

  return (
    <FormProvider {...formMethods}>
      <form 
        className={`form-container ${className}`} 
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate // Disable browser validation in favor of Yup
        {...rest}
      >
        {/* Display form-level error message if any */}
        {formError && (
          <ErrorMessage 
            message={formError} 
            type="error" 
            dismissible 
            onDismiss={() => setFormError('')}
          />
        )}

        {/* Display form-level success message if any */}
        {formSuccess && (
          <ErrorMessage 
            message={formSuccess} 
            type="success" 
            dismissible 
            onDismiss={() => setFormSuccess('')}
          />
        )}

        {children}

        {showSubmitButton && (
          <button 
            type="submit" 
            className={`form-submit ${isSubmitting ? 'form-submit-with-spinner' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <LoadingSpinner 
                size="small" 
                color="white" 
                className="form-submit-spinner" 
                label="Submitting..."
              />
            )}
            {isSubmitting ? 'Submitting...' : submitButtonText}
          </button>
        )}
      </form>
    </FormProvider>
  );
};

Form.propTypes = {
  schema: PropTypes.object,
  defaultValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  showSubmitButton: PropTypes.bool,
  submitButtonText: PropTypes.string,
  errorMessage: PropTypes.string,
  successMessage: PropTypes.string,
  resetOnSubmit: PropTypes.bool,
};

export default Form;
