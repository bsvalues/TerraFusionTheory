import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log error to analytics service or console
    if (window?.logAnalyticsEvent) {
      window.logAnalyticsEvent('client_error', { error: error.message, stack: error.stack, info });
    } else {
      console.error('ErrorBoundary caught error:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="p-6 text-red-600">An unexpected error occurred. Please refresh the page or contact support.</div>;
    }
    return this.props.children;
  }
}
