module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests', '<rootDir>/client/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@tanstack/react-query|@babel|@replit)/)',
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  collectCoverageFrom: [
    '<rootDir>/client/src/**/*.{js,jsx,ts,tsx}',
    '!<rootDir>/client/src/**/*.d.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
    },
  },
  verbose: true,
};