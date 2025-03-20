module.exports = {
  roots: ['<rootDir>'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/../client/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@server/(.*)$': '<rootDir>/../server/$1',
  },
  setupFilesAfterEnv: [
    '<rootDir>/setupTests.js'
  ],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    '../client/src/**/*.{js,jsx,ts,tsx}',
    '../server/**/*.{js,ts}',
    '../shared/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '__mocks__',
  ],
  verbose: true,
};