import * as yup from 'yup';

/**
 * Common validation schemas for forms using Yup
 */

// String validations
export const nameSchema = yup
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .required('Name is required');

export const emailSchema = yup
  .string()
  .email('Please enter a valid email address')
  .required('Email is required');

export const passwordSchema = yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )
  .required('Password is required');

export const confirmPasswordSchema = (fieldName = 'password') => 
  yup
    .string()
    .oneOf([yup.ref(fieldName), null], 'Passwords must match')
    .required('Please confirm your password');

// Date validations
export const dateSchema = yup
  .date()
  .typeError('Please enter a valid date')
  .required('Date is required');

export const futureDateSchema = yup
  .date()
  .typeError('Please enter a valid date')
  .min(new Date(), 'Date must be in the future')
  .required('Date is required');

// Number validations
export const positiveNumberSchema = yup
  .number()
  .typeError('Please enter a valid number')
  .positive('Number must be positive')
  .required('This field is required');

export const priceSchema = yup
  .number()
  .typeError('Please enter a valid price')
  .positive('Price must be positive')
  .required('Price is required');

// Form Schemas
export const loginSchema = yup.object({
  email: emailSchema,
  password: yup.string().required('Password is required'),
});

export const registerSchema = yup.object({
  username: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema(),
});

export const bookingSchema = yup.object({
  startDate: futureDateSchema,
  endDate: yup
    .date()
    .typeError('Please enter a valid date')
    .min(
      yup.ref('startDate'),
      'End date must be after start date'
    )
    .required('End date is required'),
});

export const campgroundSchema = yup.object({
  title: yup.string().required('Title is required'),
  location: yup.string().required('Location is required'),
  price: priceSchema,
  description: yup
    .string()
    .min(20, 'Description must be at least 20 characters')
    .required('Description is required'),
});

export const reviewSchema = yup.object({
  rating: yup
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot be more than 5')
    .required('Rating is required'),
  body: yup
    .string()
    .min(5, 'Review must be at least 5 characters')
    .required('Review text is required'),
});