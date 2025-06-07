import { renderHook, act, waitFor } from '@testing-library/react';
import { FeedbackProvider, useFeedback } from '@/hooks/useFeedback';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ReactNode } from 'react';

// Mock the dependencies
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn(),
  queryClient: { invalidateQueries: jest.fn() }
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

const mockToast = jest.fn();
(useToast as jest.Mock).mockReturnValue({
  toast: mockToast
});

// Sample feedback items
const mockFeedbackItems = [
  { id: 1, message: 'Test feedback 1', timestamp: '2025-03-18T12:00:00.000Z', resolved: false },
  { id: 2, message: 'Test feedback 2', timestamp: '2025-03-18T13:00:00.000Z', resolved: true }
];

const wrapper = ({ children }: { children: ReactNode }) => (
  <FeedbackProvider>{children}</FeedbackProvider>
);

describe('useFeedback Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API call to fetch feedback
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockFeedbackItems);
  });

  it('should fetch feedback items on initial load', async () => {
    const { result } = renderHook(() => useFeedback(), { wrapper });
    
    // Initially, it should be loading
    expect(result.current.loading).toBe(true);
    
    // After API resolution, it should have feedback items
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.feedbackItems).toEqual(mockFeedbackItems);
    });
    
    // Verify API call was made
    expect(apiRequest).toHaveBeenCalledWith('/api/feedback', { method: 'GET' });
  });

  it('should handle API error when fetching feedback', async () => {
    // Reset mock to simulate error
    (apiRequest as jest.Mock).mockReset();
    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
    
    const { result } = renderHook(() => useFeedback(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch');
    });
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Could not load feedback data',
      variant: 'destructive',
    });
  });

  it('should submit new feedback successfully', async () => {
    // Reset mock to simulate successful feedback submission
    (apiRequest as jest.Mock).mockReset();
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockFeedbackItems); // Initial fetch
    
    const newFeedback = {
      id: 3,
      message: 'New feedback',
      timestamp: '2025-03-18T14:00:00.000Z',
      resolved: false
    };
    
    (apiRequest as jest.Mock).mockResolvedValueOnce(newFeedback); // Submit feedback
    
    const { result } = renderHook(() => useFeedback(), { wrapper });
    
    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Submit new feedback
    await act(async () => {
      await result.current.submitFeedback('New feedback');
    });
    
    // Verify API call was made correctly
    expect(apiRequest).toHaveBeenCalledWith('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ message: 'New feedback' })
    });
    
    // Verify state was updated
    expect(result.current.feedbackItems).toContainEqual(newFeedback);
    
    // Verify toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Feedback Submitted',
      description: 'Your feedback has been recorded successfully',
    });
  });

  it('should handle errors when submitting feedback', async () => {
    // Reset mock to simulate API error during submission
    (apiRequest as jest.Mock).mockReset();
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockFeedbackItems); // Initial fetch
    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Submission failed')); // Submit feedback fails
    
    const { result } = renderHook(() => useFeedback(), { wrapper });
    
    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Try to submit feedback
    await act(async () => {
      await result.current.submitFeedback('Failed feedback').catch(() => {});
    });
    
    // Verify error state
    expect(result.current.error).toBe('Submission failed');
    
    // Verify toast was shown with error
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Could not submit feedback',
      variant: 'destructive',
    });
  });

  it('should mark feedback as resolved successfully', async () => {
    // Reset mock
    (apiRequest as jest.Mock).mockReset();
    (apiRequest as jest.Mock).mockResolvedValueOnce(mockFeedbackItems); // Initial fetch
    
    const resolvedFeedback = {
      ...mockFeedbackItems[0],
      resolved: true
    };
    
    (apiRequest as jest.Mock).mockResolvedValueOnce(resolvedFeedback); // Mark as resolved
    
    const { result } = renderHook(() => useFeedback(), { wrapper });
    
    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Mark feedback as resolved
    await act(async () => {
      await result.current.markAsResolved(1);
    });
    
    // Verify API call was made correctly
    expect(apiRequest).toHaveBeenCalledWith('/api/feedback/1', {
      method: 'PATCH',
      body: JSON.stringify({ resolved: true }),
    });
    
    // Verify state was updated
    expect(result.current.feedbackItems.find(item => item.id === 1)?.resolved).toBe(true);
    
    // Verify toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Feedback Updated',
      description: 'Feedback has been marked as resolved',
    });
  });

  it('should refresh feedback when requested', async () => {
    // Reset mock
    (apiRequest as jest.Mock).mockReset();
    
    // Setup mock for initial fetch and refresh
    const initialFeedback = [...mockFeedbackItems];
    const updatedFeedback = [...mockFeedbackItems, {
      id: 3,
      message: 'New feedback item',
      timestamp: '2025-03-18T15:00:00.000Z',
      resolved: false
    }];
    
    (apiRequest as jest.Mock).mockResolvedValueOnce(initialFeedback); // Initial fetch
    (apiRequest as jest.Mock).mockResolvedValueOnce(updatedFeedback); // Refresh
    
    const { result } = renderHook(() => useFeedback(), { wrapper });
    
    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.feedbackItems).toEqual(initialFeedback);
    });
    
    // Call refresh
    await act(async () => {
      await result.current.refresh();
    });
    
    // Verify API was called again
    expect(apiRequest).toHaveBeenCalledTimes(2);
    
    // Verify state was updated with new data
    expect(result.current.feedbackItems).toEqual(updatedFeedback);
  });
});