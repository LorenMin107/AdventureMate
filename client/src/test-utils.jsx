import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the context providers to avoid import issues
const MockAuthProvider = ({ children }) => <div data-testid="auth-provider">{children}</div>;

const MockFlashMessageProvider = ({ children }) => (
  <div data-testid="flash-message-provider">{children}</div>
);

const MockLanguageProvider = ({ children }) => (
  <div data-testid="language-provider">{children}</div>
);

// Custom render function that includes all necessary providers
const AllTheProviders = ({ children }) => {
  // Check if children already has a Router component
  const hasRouter = React.Children.toArray(children).some(
    (child) =>
      child &&
      child.type &&
      (child.type.name === 'MemoryRouter' ||
        child.type.name === 'BrowserRouter' ||
        child.type.name === 'HashRouter')
  );

  const content = (
    <MockLanguageProvider>
      <MockAuthProvider>
        <MockFlashMessageProvider>{children}</MockFlashMessageProvider>
      </MockAuthProvider>
    </MockLanguageProvider>
  );

  // Only wrap with BrowserRouter if no router is already present
  return hasRouter ? content : <BrowserRouter>{content}</BrowserRouter>;
};

const customRender = (ui, options) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
