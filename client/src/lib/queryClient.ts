/**
 * React Query client configuration
 */

import { QueryClient } from '@tanstack/react-query';

// Default fetch function for API requests
export const apiRequest = async <T>(
  url: string,
  config?: RequestInit & { data?: any }
): Promise<T> => {
  // Extract data and convert it to JSON body if provided
  const { data, ...restConfig } = config || {};
  
  const requestConfig: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...restConfig,
  };
  
  // Add body if data is provided
  if (data !== undefined) {
    requestConfig.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, requestConfig);

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