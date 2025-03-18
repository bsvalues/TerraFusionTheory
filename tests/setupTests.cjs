// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock fetch globally
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK'
  })
);

// Setup mock for ResizeObserver since it's not available in JSDOM
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock for IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: []
}));

// Mock for window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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

// Mock for URL object
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock for window.scrollTo
window.scrollTo = jest.fn();

// Configure Jest to recognize modern ES modules 
require('core-js/stable');
require('regenerator-runtime/runtime');

// Mock TanStack Query error logging
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  return {
    ...originalModule,
    useQuery: jest.fn().mockImplementation(() => ({
      isLoading: false,
      error: null,
      data: {},
      refetch: jest.fn(),
    })),
    useMutation: jest.fn().mockImplementation(() => ({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
      data: {},
    })),
  };
});

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Suppress expected errors
const originalConsoleError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0]) || 
      /Warning.*React.createFactory/.test(args[0]) ||
      /Error boundaries should implement/.test(args[0])) {
    return;
  }
  originalConsoleError(...args);
};

// Function to cleanup mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});