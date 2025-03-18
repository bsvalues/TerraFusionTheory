import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FeedbackItem } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FeedbackContextType {
  feedbackItems: FeedbackItem[];
  submitFeedback: (message: string) => Promise<void>;
  markAsResolved: (id: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<FeedbackItem[]>('/api/feedback', { method: 'GET' });
      setFeedbackItems(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch feedback';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Could not load feedback data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial fetch on mount
  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const submitFeedback = useCallback(async (message: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<FeedbackItem>('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      setFeedbackItems((prev) => [...prev, response]);
      toast({
        title: 'Feedback Submitted',
        description: 'Your feedback has been recorded successfully',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Could not submit feedback',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const markAsResolved = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<FeedbackItem>(`/api/feedback/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ resolved: true }),
      });
      
      setFeedbackItems((prev) => 
        prev.map((item) => (item.id === id ? response : item))
      );
      
      toast({
        title: 'Feedback Updated',
        description: 'Feedback has been marked as resolved',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update feedback';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Could not update feedback status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refresh = useCallback(async () => {
    await fetchFeedback();
  }, [fetchFeedback]);

  return (
    <FeedbackContext.Provider
      value={{
        feedbackItems,
        submitFeedback,
        markAsResolved,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};