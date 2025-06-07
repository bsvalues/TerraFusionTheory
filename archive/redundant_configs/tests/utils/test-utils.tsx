import React, { ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorProvider } from '@/hooks/useErrors';
import { FeedbackProvider } from '@/hooks/useFeedback';

// Create a custom QueryClient for testing
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  });
}

// Wrapper with QueryClientProvider
export function renderWithQueryClient(
  ui: React.ReactElement,
  client?: QueryClient,
): RenderResult {
  const queryClient = client ?? createTestQueryClient();
  
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  return render(ui, { wrapper });
}

// Wrapper with all providers
export function renderWithAllProviders(
  ui: React.ReactElement,
  client?: QueryClient,
): RenderResult {
  const queryClient = client ?? createTestQueryClient();
  
  const AllTheProviders = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <ErrorProvider>
          <FeedbackProvider>
            {children}
          </FeedbackProvider>
        </ErrorProvider>
      </QueryClientProvider>
    );
  };
  
  return render(ui, { wrapper: AllTheProviders });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { ...options });

export { customRender as render };