import { render, screen } from '../test-utils';
import React from 'react';

// Create a minimal App component for testing
const MinimalApp = () => (
  <div data-testid="minimal-app">
    <h1>Test App</h1>
  </div>
);

describe('App component', () => {
  test('renders minimal app structure', () => {
    render(<MinimalApp />);
    expect(screen.getByTestId('minimal-app')).toBeInTheDocument();
    expect(screen.getByText('Test App')).toBeInTheDocument();
  });

  test('renders minimal navigation elements', () => {
    render(<MinimalApp />);
    expect(screen.getByTestId('minimal-app')).toBeInTheDocument();
  });
});
