/**
 * React Query client configuration
 */

import { QueryClient } from '@tanstack/react-query';

// Default fetch function for API requests
export const apiRequest = async <T>(
  url: string,
  config?: RequestInit
): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `API request failed with status ${response.status}`
    );
  }

  return response.json();
};

// Configure the query client with defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
        if (typeof url !== 'string') {
          throw new Error('Invalid query key - first element must be a string URL');
        }
        return apiRequest(url);
      },
    },
  },
});