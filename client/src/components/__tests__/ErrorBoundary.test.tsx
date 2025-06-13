import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../common/ErrorBoundary';

function ProblemChild() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  it('renders fallback UI on error', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Fallback</div>}>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
  });

  it('renders default fallback UI if none provided', () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });
});
