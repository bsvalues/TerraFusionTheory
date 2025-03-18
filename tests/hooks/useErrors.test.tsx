import { renderHook, act } from '@testing-library/react';
import { ErrorProvider, useErrors, ErrorSource } from '@/hooks/useErrors';
import { ReactNode } from 'react';

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock window event listeners
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

// Store original window methods
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

beforeEach(() => {
  // Replace window methods with mocks
  window.addEventListener = mockAddEventListener;
  window.removeEventListener = mockRemoveEventListener;
});

afterEach(() => {
  // Restore original window methods
  window.addEventListener = originalAddEventListener;
  window.removeEventListener = originalRemoveEventListener;
  jest.clearAllMocks();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <ErrorProvider>{children}</ErrorProvider>
);

describe('useErrors Hook', () => {
  it('should initialize with empty errors array', () => {
    const { result } = renderHook(() => useErrors(), { wrapper });
    
    expect(result.current.errors).toEqual([]);
  });

  it('should add an error correctly', () => {
    const { result } = renderHook(() => useErrors(), { wrapper });
    
    act(() => {
      result.current.addError({
        message: 'Test error',
        source: 'api' as ErrorSource,
        details: 'Error details',
      });
    });
    
    expect(result.current.errors.length).toBe(1);
    expect(result.current.errors[0].message).toBe('Test error');
    expect(result.current.errors[0].source).toBe('api');
    expect(result.current.errors[0].details).toBe('Error details');
    expect(result.current.errors[0]).toHaveProperty('id');
    expect(result.current.errors[0]).toHaveProperty('timestamp');
  });

  it('should clear errors correctly', () => {
    const { result } = renderHook(() => useErrors(), { wrapper });
    
    // Add some errors
    act(() => {
      result.current.addError({
        message: 'Error 1',
        source: 'api' as ErrorSource,
      });
      
      result.current.addError({
        message: 'Error 2',
        source: 'ui' as ErrorSource,
      });
    });
    
    expect(result.current.errors.length).toBe(2);
    
    // Clear errors
    act(() => {
      result.current.clearErrors();
    });
    
    expect(result.current.errors.length).toBe(0);
  });

  it('should log API errors correctly', () => {
    const { result } = renderHook(() => useErrors(), { wrapper });
    
    act(() => {
      result.current.logApiError('API error', { status: 500 });
    });
    
    expect(result.current.errors.length).toBe(1);
    expect(result.current.errors[0].message).toBe('API error');
    expect(result.current.errors[0].source).toBe('api');
    expect(result.current.errors[0].details).toBe(JSON.stringify({ status: 500 }, null, 2));
    expect(result.current.errors[0].stack).toBeDefined();
  });

  it('should log UI errors correctly', () => {
    const { result } = renderHook(() => useErrors(), { wrapper });
    
    act(() => {
      result.current.logUiError('UI error', { component: 'Button' });
    });
    
    expect(result.current.errors.length).toBe(1);
    expect(result.current.errors[0].message).toBe('UI error');
    expect(result.current.errors[0].source).toBe('ui');
    expect(result.current.errors[0].details).toBe(JSON.stringify({ component: 'Button' }, null, 2));
  });

  it('should log parsing errors correctly', () => {
    const { result } = renderHook(() => useErrors(), { wrapper });
    
    act(() => {
      result.current.logParsingError('Parsing error', { json: 'invalid' });
    });
    
    expect(result.current.errors.length).toBe(1);
    expect(result.current.errors[0].message).toBe('Parsing error');
    expect(result.current.errors[0].source).toBe('parsing');
    expect(result.current.errors[0].details).toBe(JSON.stringify({ json: 'invalid' }, null, 2));
  });

  it('should set up global error handlers', () => {
    renderHook(() => useErrors(), { wrapper });
    
    // Verify event listeners were added
    expect(mockAddEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
  });

  it('should clean up global error handlers on unmount', () => {
    const { unmount } = renderHook(() => useErrors(), { wrapper });
    
    unmount();
    
    // Verify event listeners were removed
    expect(mockRemoveEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
  });

  it('should add errors in correct order (newest first)', () => {
    const { result } = renderHook(() => useErrors(), { wrapper });
    
    act(() => {
      result.current.logApiError('First error');
    });
    
    act(() => {
      result.current.logUiError('Second error');
    });
    
    expect(result.current.errors.length).toBe(2);
    expect(result.current.errors[0].message).toBe('Second error');
    expect(result.current.errors[1].message).toBe('First error');
  });

  it('should handle errors with no details', () => {
    const { result } = renderHook(() => useErrors(), { wrapper });
    
    act(() => {
      result.current.logApiError('Simple error');
    });
    
    expect(result.current.errors[0].message).toBe('Simple error');
    expect(result.current.errors[0].details).toBeUndefined();
  });
});