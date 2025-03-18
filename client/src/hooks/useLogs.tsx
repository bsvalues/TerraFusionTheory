import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { LogEntry, LogLevel, LogCategory } from '@shared/schema';

interface LogQueryOptions {
  level?: LogLevel | LogLevel[];
  category?: LogCategory | LogCategory[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  projectId?: number;
  userId?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface LogStats {
  totalCount: number;
  countByLevel: Record<LogLevel, number>;
  countByCategory: Record<LogCategory, number>;
  recentErrors: LogEntry[];
  performanceAverage: number | null;
}

export const useLogs = (options?: LogQueryOptions) => {
  const queryClient = useQueryClient();
  const [queryOptions, setQueryOptions] = useState<LogQueryOptions>(options || {});
  
  // Build the query string for the API request
  const getQueryString = useCallback((opts: LogQueryOptions) => {
    const params = new URLSearchParams();
    
    if (opts.level) {
      if (Array.isArray(opts.level)) {
        opts.level.forEach(level => params.append('level', level));
      } else {
        params.append('level', opts.level);
      }
    }
    
    if (opts.category) {
      if (Array.isArray(opts.category)) {
        opts.category.forEach(category => params.append('category', category));
      } else {
        params.append('category', opts.category);
      }
    }
    
    if (opts.startDate) {
      params.append('startDate', opts.startDate.toISOString());
    }
    
    if (opts.endDate) {
      params.append('endDate', opts.endDate.toISOString());
    }
    
    if (opts.limit !== undefined) {
      params.append('limit', opts.limit.toString());
    }
    
    if (opts.offset !== undefined) {
      params.append('offset', opts.offset.toString());
    }
    
    if (opts.projectId !== undefined) {
      params.append('projectId', opts.projectId.toString());
    }
    
    if (opts.userId !== undefined) {
      params.append('userId', opts.userId.toString());
    }
    
    if (opts.search) {
      params.append('search', opts.search);
    }
    
    if (opts.sortBy) {
      params.append('sortBy', opts.sortBy);
    }
    
    if (opts.sortOrder) {
      params.append('sortOrder', opts.sortOrder);
    }
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }, []);
  
  // Query for fetching logs with filters
  const logsQuery = useQuery({
    queryKey: ['/api/logs', queryOptions],
    queryFn: async () => {
      const queryString = getQueryString(queryOptions);
      return apiRequest<LogEntry[]>(`/api/logs${queryString}`);
    },
    enabled: true,
  });
  
  // Query for fetching log statistics
  const statsQuery = useQuery({
    queryKey: ['/api/logs/stats'],
    queryFn: async () => {
      return apiRequest<LogStats>('/api/logs/stats');
    },
    enabled: true,
  });
  
  // Mutation for creating a new log
  const createLogMutation = useMutation({
    mutationFn: (log: Omit<LogEntry, 'id'>) => {
      return apiRequest('/api/logs', {
        method: 'POST',
        body: JSON.stringify(log),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      // Invalidate logs and stats queries to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logs/stats'] });
    },
  });
  
  // Mutation for deleting a log
  const deleteLogMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/logs/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      // Invalidate logs and stats queries to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logs/stats'] });
    },
  });
  
  // Mutation for clearing logs
  const clearLogsMutation = useMutation({
    mutationFn: (options?: { olderThan?: Date; level?: LogLevel; category?: LogCategory }) => {
      let queryString = '';
      
      if (options) {
        const params = new URLSearchParams();
        if (options.olderThan) {
          params.append('olderThan', options.olderThan.toISOString());
        }
        if (options.level) {
          params.append('level', options.level);
        }
        if (options.category) {
          params.append('category', options.category);
        }
        queryString = params.toString() ? `?${params.toString()}` : '';
      }
      
      return apiRequest(`/api/logs${queryString}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      // Invalidate logs and stats queries to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logs/stats'] });
    },
  });
  
  // Function to update the filter options
  const updateFilters = useCallback((newOptions: Partial<LogQueryOptions>) => {
    setQueryOptions(prevOptions => ({
      ...prevOptions,
      ...newOptions,
    }));
  }, []);
  
  // Function to clear all filters
  const clearFilters = useCallback(() => {
    setQueryOptions({});
  }, []);
  
  // Return logs, stats, and mutations
  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
    error: logsQuery.error,
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,
    statsError: statsQuery.error,
    filters: queryOptions,
    updateFilters,
    clearFilters,
    createLog: createLogMutation.mutate,
    deleteLog: deleteLogMutation.mutate,
    clearLogs: clearLogsMutation.mutate,
    isCreating: createLogMutation.isPending,
    isDeleting: deleteLogMutation.isPending,
    isClearing: clearLogsMutation.isPending,
  };
};