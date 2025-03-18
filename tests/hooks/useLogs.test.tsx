import { renderHook, waitFor } from '@testing-library/react';
import { useLogs } from '@/hooks/useLogs';
import { renderWithQueryClient } from '../utils/test-utils';
import { mockLogs, mockLogStats } from '../mocks/logData';
import { apiRequest } from '@/lib/queryClient';

// Mock the API request function
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn(),
  getQueryFn: jest.fn(),
  queryClient: {
    invalidateQueries: jest.fn()
  }
}));

describe('useLogs Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch logs with default parameters', async () => {
    // Mock the API response
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockLogs);
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockLogStats);

    // Render the hook with the query client wrapper
    const { result } = renderHook(() => useLogs(), {
      wrapper: ({ children }) => renderWithQueryClient(<>{children}</>).wrapper
    });

    // Initial state should be empty
    expect(result.current.logs).toEqual([]);
    expect(result.current.isLoading).toBe(true);

    // Wait for data to be loaded
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verify logs are loaded
    expect(result.current.logs).toEqual(mockLogs);
    expect(apiRequest).toHaveBeenCalledWith('/api/logs');
  });

  it('should handle filter updates correctly', async () => {
    // Mock the API response
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockLogs);
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockLogStats);

    // Render the hook with the query client wrapper
    const { result } = renderHook(() => useLogs(), {
      wrapper: ({ children }) => renderWithQueryClient(<>{children}</>).wrapper
    });

    // Wait for initial data to be loaded
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Clear mock calls
    (apiRequest as jest.Mock).mockClear();
    
    // Setup for filtered response
    const filteredLogs = mockLogs.slice(0, 2);
    (apiRequest as jest.Mock).mockResolvedValueOnce(filteredLogs);

    // Update filters
    result.current.updateFilters({ 
      level: 'info', 
      limit: 10 
    });

    // Wait for refetch to complete
    await waitFor(() => expect(apiRequest).toHaveBeenCalled());

    // Verify correct API call was made with filters
    expect(apiRequest).toHaveBeenCalledWith('/api/logs?level=info&limit=10');
  });

  it('should handle clearing filters correctly', async () => {
    // Mock the API response
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockLogs);
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockLogStats);

    // Render the hook with initial filters
    const { result } = renderHook(() => useLogs({ level: 'error', limit: 5 }), {
      wrapper: ({ children }) => renderWithQueryClient(<>{children}</>).wrapper
    });

    // Wait for initial data to be loaded
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Clear mock calls
    (apiRequest as jest.Mock).mockClear();
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockLogs);

    // Clear filters
    result.current.clearFilters();
    result.current.updateFilters({ limit: 50 });

    // Wait for refetch to complete
    await waitFor(() => expect(apiRequest).toHaveBeenCalled());

    // Verify API call was made without filters
    expect(apiRequest).toHaveBeenCalledWith('/api/logs?limit=50');
  });

  it('should handle log deletion correctly', async () => {
    // Mock the API responses
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockLogs);
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockLogStats);
    
    // Render the hook
    const { result } = renderHook(() => useLogs(), {
      wrapper: ({ children }) => renderWithQueryClient(<>{children}</>).wrapper
    });

    // Wait for initial data to be loaded
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Mock the delete response
    (apiRequest as jest.Mock).mockResolvedValueOnce({ success: true });

    // Delete a log
    result.current.deleteLog(1);

    // Verify delete API call
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/logs/1', { method: 'DELETE' });
    });
  });
});