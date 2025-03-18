import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogEntry, LogLevel, LogCategory } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

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
  
  const getQueryString = useCallback((opts: LogQueryOptions) => {
    const params = new URLSearchParams();
    
    if (opts.level) {
      if (Array.isArray(opts.level)) {
        opts.level.forEach(l => params.append('level', l));
      } else {
        params.append('level', opts.level);
      }
    }
    
    if (opts.category) {
      if (Array.isArray(opts.category)) {
        opts.category.forEach(c => params.append('category', c));
      } else {
        params.append('category', opts.category);
      }
    }
    
    if (opts.startDate) params.append('startDate', opts.startDate.toISOString());
    if (opts.endDate) params.append('endDate', opts.endDate.toISOString());
    if (opts.limit) params.append('limit', opts.limit.toString());
    if (opts.offset) params.append('offset', opts.offset.toString());
    if (opts.projectId) params.append('projectId', opts.projectId.toString());
    if (opts.userId) params.append('userId', opts.userId.toString());
    if (opts.search) params.append('search', opts.search);
    if (opts.sortBy) params.append('sortBy', opts.sortBy);
    if (opts.sortOrder) params.append('sortOrder', opts.sortOrder);
    
    return params.toString();
  }, []);
  
  // Fetch logs
  const {
    data: logs = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['logs', queryOptions],
    queryFn: async () => {
      const queryStr = getQueryString(queryOptions);
      const url = `/api/logs${queryStr ? `?${queryStr}` : ''}`;
      return apiRequest<LogEntry[]>(url);
    }
  });
  
  // Fetch log stats
  const { data: stats } = useQuery({
    queryKey: ['logs', 'stats'],
    queryFn: async () => {
      return apiRequest<LogStats>('/api/logs/stats');
    },
    refetchInterval: 30000 // Refresh stats every 30 seconds
  });
  
  // Delete a log entry
  const deleteLogMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/logs/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    }
  });
  
  // Clear logs
  const clearLogsMutation = useMutation({
    mutationFn: (options?: { olderThan?: Date; level?: LogLevel; category?: LogCategory }) => {
      const params = new URLSearchParams();
      if (options?.olderThan) params.append('olderThan', options.olderThan.toISOString());
      if (options?.level) params.append('level', options.level);
      if (options?.category) params.append('category', options.category);
      
      const url = `/api/logs/clear${params.toString() ? `?${params.toString()}` : ''}`;
      return apiRequest(url, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    }
  });
  
  // Update filters
  const updateFilters = useCallback((newOptions: LogQueryOptions) => {
    setQueryOptions(prev => ({ ...prev, ...newOptions }));
  }, []);
  
  // Clear filters
  const clearFilters = useCallback(() => {
    setQueryOptions({});
  }, []);
  
  useEffect(() => {
    // Refresh on query options change
    refetch();
  }, [queryOptions, refetch]);
  
  return {
    logs,
    stats,
    isLoading,
    error,
    updateFilters,
    clearFilters,
    deleteLog: deleteLogMutation.mutate,
    clearLogs: () => clearLogsMutation.mutate({}),
    isClearingLogs: clearLogsMutation.isPending,
    refetch
  };
};