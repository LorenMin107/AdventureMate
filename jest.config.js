module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  collectCoverageFrom: [
    'client/src/**/*.{js,jsx}',
    '!client/src/**/*.d.ts',
    '!client/src/main.jsx',
    '!client/src/vite-env.d.ts',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/public/'],
};
