module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    '^bson$': '<rootDir>/__mocks__/bsonMock.js',
    '^mongodb$': '<rootDir>/__mocks__/mongodbMock.js',
    '^react-map-gl$': '<rootDir>/__mocks__/reactMapGlMock.js',
    '^../utils/googleOAuth$': '<rootDir>/__mocks__/googleOAuthMock.js',
    '^../components/CampgroundForm$': '<rootDir>/__mocks__/campgroundFormMock.js',
    '^../components/maps/ClusterMap$': '<rootDir>/__mocks__/clusterMapMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.js', '<rootDir>/tests/setup.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: [
    '**/__tests__/**/*.js?(x)',
    '**/?(*.)+(spec|test).js?(x)',
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],
  // Exclude Playwright E2E tests from Jest
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/coverage/', '/tests/e2e/'],
  collectCoverageFrom: [
    'client/src/**/*.{js,jsx}',
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    'routes/**/*.js',
    '!client/src/**/*.d.ts',
    '!client/src/main.jsx',
    '!client/src/vite-env.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/__mocks__/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/public/',
    '/tests/',
    '/__mocks__/',
    '/coverage/',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testTimeout: 30000,
  verbose: true,
  // Environment variables for tests
  setupFiles: ['<rootDir>/tests/setup.js'],
  // Global test configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
