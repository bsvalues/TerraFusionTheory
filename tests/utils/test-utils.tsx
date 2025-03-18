import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorProvider } from '@/hooks/useErrors';
import { FeedbackProvider } from '@/hooks/useFeedback';

// Create a custom query client for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
  // Using a more compatible logger configuration for Jest
  logger: {
    log: console.log,
    warn: console.warn,
    error: console.error,
  },
});

// All-in-one wrapper with all providers needed for testing
export function AllTheProviders({ children }: { children: ReactNode }) {
  const testQueryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={testQueryClient}>
      <ErrorProvider>
        <FeedbackProvider>
          {children}
        </FeedbackProvider>
      </ErrorProvider>
    </QueryClientProvider>
  );
}

// Wrapper with QueryClientProvider for testing components that use react-query
export function renderWithQueryClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const testQueryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper, ...options }),
    queryClient: testQueryClient,
  };
}

// Render with all providers
export function renderWithAllProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return {
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
}

// Export a customized render method with all providers
export const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the render method
export { customRender as render };