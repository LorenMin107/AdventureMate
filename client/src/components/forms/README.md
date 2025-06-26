# Form Components

This directory contains reusable form components built with React Hook Form and Yup validation.

## Components

- `Form`: Provides the React Hook Form context and handles form submission with loading states and error handling
- `Input`: Text input field with validation
- `Select`: Dropdown select field with validation
- `Textarea`: Multi-line text input with validation
- `Checkbox`: Boolean checkbox input with validation
- `DatePicker`: Date input field with validation
- `ErrorMessage`: Displays form-level error, warning, info, and success messages
- `LoadingSpinner`: Displays loading indicators with different sizes and colors

## Usage

### Basic Form

```jsx
import { Form, Input, Select } from '../components/forms';
import { object, string } from 'yup';

// Define validation schema with Yup
const schema = object({
  name: string().required('Name is required'),
  email: string().email('Invalid email').required('Email is required'),
});

const MyForm = () => {
  const handleSubmit = (data) => {
    console.log('Form data:', data);
    // Process form data...
  };

  return (
    <Form 
      schema={schema} 
      onSubmit={handleSubmit}
      defaultValues={{ name: '', email: '' }}
    >
      <Input name="name" label="Name" required />
      <Input name="email" label="Email" type="email" required />
      <Select 
        name="country" 
        label="Country" 
        options={[
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
        ]} 
      />
    </Form>
  );
};
```

### Form with Custom Validation and Error Handling

```jsx
import { useState } from 'react';
import { Form, Input, DatePicker, ErrorMessage } from '../components/forms';
import { bookingSchema } from '../../utils/validationSchemas';

const BookingForm = ({ campground }) => {
  const [apiError, setApiError] = useState(null);

  const handleSubmit = async (data) => {
    try {
      setApiError(null);

      // Submit booking data to API
      const response = await fetch(`/api/bookings/${campground._id}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const responseData = await response.json();

      // Handle successful response
      return responseData; // Return data to trigger success message
    } catch (err) {
      setApiError(err.message);
      throw err; // Re-throw to let Form component handle it
    }
  };

  return (
    <>
      {/* Display API-specific errors outside the form if needed */}
      {apiError && (
        <ErrorMessage 
          message={apiError} 
          type="error" 
          dismissible 
          onDismiss={() => setApiError(null)}
        />
      )}

      <Form 
        schema={bookingSchema}
        onSubmit={handleSubmit}
        defaultValues={{ startDate: '', endDate: '' }}
        successMessage="Booking created successfully!"
        resetOnSubmit={true}
      >
        <DatePicker 
          name="startDate" 
          label="Check-in Date" 
          min={getTomorrowString()} 
          required 
        />
        <DatePicker 
          name="endDate" 
          label="Check-out Date" 
          min={getTomorrowString()} 
          required 
        />
      </Form>
    </>
  );
};
```

## Props

### Form

| Prop | Type | Description |
|------|------|-------------|
| schema | object | Yup validation schema |
| defaultValues | object | Default values for form fields |
| onSubmit | function | Function called with form data when form is submitted |
| children | node | Form fields and other content |
| className | string | Additional CSS class names |
| showSubmitButton | boolean | Whether to show the submit button |
| submitButtonText | string | Text for the submit button |
| errorMessage | string | Initial error message to display |
| successMessage | string | Success message to display after form submission |
| resetOnSubmit | boolean | Whether to reset the form after successful submission |

### Input, Select, Textarea, DatePicker

| Prop | Type | Description |
|------|------|-------------|
| name | string | Field name (required) |
| label | string | Label text |
| required | boolean | Whether the field is required |
| validation | object | Additional validation rules |
| className | string | Additional CSS class names |

### ErrorMessage

| Prop | Type | Description |
|------|------|-------------|
| message | string | Message to display |
| type | string | Type of message ('error', 'warning', 'info', 'success') |
| dismissible | boolean | Whether the message can be dismissed |
| onDismiss | function | Function to call when the message is dismissed |
| className | string | Additional CSS class names |

### LoadingSpinner

| Prop | Type | Description |
|------|------|-------------|
| size | string | Size of the spinner ('small', 'medium', 'large') |
| color | string | Color of the spinner ('primary', 'secondary', 'white') |
| label | string | Accessibility label for the spinner |
| className | string | Additional CSS class names |

## Validation

Form validation is handled by Yup. Common validation schemas are available in `utils/validationSchemas.js`.

## Real-time Validation

Forms provide real-time validation feedback as users type, with error messages displayed below each field. The Form component also handles form-level errors and displays them at the top of the form.

## Loading States

The Form component automatically handles loading states during form submission, displaying a spinner in the submit button and disabling it to prevent multiple submissions.
