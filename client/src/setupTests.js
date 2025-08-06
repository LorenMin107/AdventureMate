// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock performance.navigation
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    navigation: {
      type: 0, // TYPE_NAVIGATE
    },
    getEntriesByType: () => [
      {
        type: 'navigate',
      },
    ],
  },
});

// Mock context hooks
jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    isAuthenticated: false,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  }),
}));

jest.mock('./context/FlashMessageContext', () => ({
  useFlashMessage: () => ({
    addMessage: jest.fn(),
    addSuccessMessage: jest.fn(),
    addErrorMessage: jest.fn(),
    addInfoMessage: jest.fn(),
    addWarningMessage: jest.fn(),
    removeMessage: jest.fn(),
    clearMessages: jest.fn(),
    messages: [],
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
      isInitialized: true,
    },
  }),
  Trans: ({ children }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

jest.mock('./context/UserContext', () => ({
  UserProvider: ({ children }) => <div data-testid="user-provider">{children}</div>,
  useUser: () => ({
    user: null,
    loading: false,
    updateUser: jest.fn(),
  }),
}));

jest.mock('./context/ThemeContext', () => ({
  ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>,
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
  }),
}));
