import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock CSS imports
jest.mock('../App.css', () => ({}));

describe('App component', () => {
  test('renders welcome message', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    const welcomeElement = screen.getByText(/Welcome to MyanCamp/i);
    expect(welcomeElement).toBeInTheDocument();
  });

  test('renders description', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    const descriptionElement = screen.getByText(/Discover, book, and review campgrounds/i);
    expect(descriptionElement).toBeInTheDocument();
  });
});