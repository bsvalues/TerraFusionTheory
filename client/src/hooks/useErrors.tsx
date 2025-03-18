import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

export type ErrorSource = 'api' | 'ui' | 'parsing' | 'other';

export interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  source: ErrorSource;
  details?: string;
  stack?: string;
}

interface ErrorContextType {
  errors: ErrorLog[];
  addError: (error: Omit<ErrorLog, 'id' | 'timestamp'>) => void;
  clearErrors: () => void;
  logApiError: (message: string, details?: any) => void;
  logUiError: (message: string, details?: any) => void;
  logParsingError: (message: string, details?: any) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  
  const addError = useCallback((error: Omit<ErrorLog, 'id' | 'timestamp'>) => {
    const newError: ErrorLog = {
      ...error,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    setErrors(prev => [newError, ...prev]);
    
    // You could also send errors to a monitoring service here
    console.error(`[${error.source.toUpperCase()}] ${error.message}`, error.details || '');
  }, []);
  
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);
  
  const logApiError = useCallback((message: string, details?: any) => {
    addError({
      message,
      source: 'api',
      details: details ? JSON.stringify(details, null, 2) : undefined,
      stack: new Error().stack,
    });
  }, [addError]);
  
  const logUiError = useCallback((message: string, details?: any) => {
    addError({
      message,
      source: 'ui',
      details: details ? JSON.stringify(details, null, 2) : undefined,
      stack: new Error().stack,
    });
  }, [addError]);
  
  const logParsingError = useCallback((message: string, details?: any) => {
    addError({
      message,
      source: 'parsing',
      details: details ? JSON.stringify(details, null, 2) : undefined,
      stack: new Error().stack,
    });
  }, [addError]);
  
  // Set up global error handling
  React.useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      addError({
        message: event.message,
        source: event.filename?.includes('api') ? 'api' : 'ui',
        details: `${event.filename}:${event.lineno}:${event.colno}`,
        stack: event.error?.stack
      });
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      addError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        source: 'api',
        details: JSON.stringify(event.reason),
        stack: event.reason?.stack
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, [addError]);
  
  const value = {
    errors,
    addError,
    clearErrors,
    logApiError,
    logUiError,
    logParsingError,
  };
  
  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

export const useErrors = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrors must be used within an ErrorProvider');
  }
  return context;
};

export default useErrors;