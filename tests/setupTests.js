// Setup file for Jest tests
import '@testing-library/jest-dom';
import 'openai/shims/node';

// Set test environment
process.env.NODE_ENV = 'test';

// Set test timeouts
jest.setTimeout(10000); // 10 seconds global timeout

// Mock the fetch API
global.fetch = jest.fn();

// Define global.Request for OpenAI
if (typeof Request === 'undefined') {
  global.Request = class Request {};
}

// Polyfill for TextEncoder/Decoder if needed
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Silence console during tests
global.console = {
  ...console,
  // Uncomment to silence specific console methods during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Clean up after all tests
afterAll(() => {
  jest.clearAllMocks();
});