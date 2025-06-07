import { screen, waitFor, fireEvent } from '@testing-library/react';
import { LoggingDashboard } from '@/components/logging/LoggingDashboard';
import { renderWithQueryClient } from '../../utils/test-utils';
import { mockLogs, mockLogStats } from '../../mocks/logData';
import { apiRequest } from '@/lib/queryClient';
import * as useLogs from '@/hooks/useLogs';

// Mock the API request function
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn(),
  getQueryFn: jest.fn(),
  queryClient: { invalidateQueries: jest.fn() }
}));

// Mock window.confirm
global.confirm = jest.fn(() => true);

describe('LoggingDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders loading state correctly', async () => {
    // Mock the useLogs hook
    jest.spyOn(useLogs, 'useLogs').mockReturnValue({
      logs: [],
      stats: null,
      isLoading: true,
      error: null,
      updateFilters: jest.fn(),
      clearFilters: jest.fn(),
      deleteLog: jest.fn(),
      clearLogs: jest.fn(),
      isClearingLogs: false,
      refetch: jest.fn()
    });
    
    renderWithQueryClient(<LoggingDashboard />);
    
    // Check if loading indicator is displayed
    expect(screen.getByText('Loading logs...')).toBeInTheDocument();
  });
  
  it('renders logs correctly when data is loaded', async () => {
    // Mock the useLogs hook
    jest.spyOn(useLogs, 'useLogs').mockReturnValue({
      logs: mockLogs,
      stats: mockLogStats,
      isLoading: false,
      error: null,
      updateFilters: jest.fn(),
      clearFilters: jest.fn(),
      deleteLog: jest.fn(),
      clearLogs: jest.fn(),
      isClearingLogs: false,
      refetch: jest.fn()
    });
    
    renderWithQueryClient(<LoggingDashboard />);
    
    // Check if log items are rendered
    expect(screen.getByText('Application started successfully')).toBeInTheDocument();
    expect(screen.getByText('API rate limit approaching threshold')).toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    
    // Check if log level badges are rendered
    expect(screen.getByText('info')).toBeInTheDocument();
    expect(screen.getByText('warning')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
  });
  
  it('handles filter updates correctly', async () => {
    const updateFiltersMock = jest.fn();
    
    // Mock the useLogs hook
    jest.spyOn(useLogs, 'useLogs').mockReturnValue({
      logs: mockLogs,
      stats: mockLogStats,
      isLoading: false,
      error: null,
      updateFilters: updateFiltersMock,
      clearFilters: jest.fn(),
      deleteLog: jest.fn(),
      clearLogs: jest.fn(),
      isClearingLogs: false,
      refetch: jest.fn()
    });
    
    renderWithQueryClient(<LoggingDashboard />);
    
    // Set search term
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'error' } });
    
    // Click apply filters button
    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);
    
    // Verify updateFilters was called with correct parameters
    expect(updateFiltersMock).toHaveBeenCalledWith({
      limit: 50, // Default limit
      search: 'error'
    });
  });
  
  it('handles clearing filters correctly', async () => {
    const clearFiltersMock = jest.fn();
    const updateFiltersMock = jest.fn();
    
    // Mock the useLogs hook
    jest.spyOn(useLogs, 'useLogs').mockReturnValue({
      logs: mockLogs,
      stats: mockLogStats,
      isLoading: false,
      error: null,
      updateFilters: updateFiltersMock,
      clearFilters: clearFiltersMock,
      deleteLog: jest.fn(),
      clearLogs: jest.fn(),
      isClearingLogs: false,
      refetch: jest.fn()
    });
    
    renderWithQueryClient(<LoggingDashboard />);
    
    // Set search term
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'error' } });
    
    // Click clear button
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    // Verify clearFilters was called
    expect(clearFiltersMock).toHaveBeenCalled();
    expect(updateFiltersMock).toHaveBeenCalledWith({ limit: 50 });
  });
  
  it('switches between tabs correctly', async () => {
    // Mock the useLogs hook
    jest.spyOn(useLogs, 'useLogs').mockReturnValue({
      logs: mockLogs,
      stats: mockLogStats,
      isLoading: false,
      error: null,
      updateFilters: jest.fn(),
      clearFilters: jest.fn(),
      deleteLog: jest.fn(),
      clearLogs: jest.fn(),
      isClearingLogs: false,
      refetch: jest.fn()
    });
    
    renderWithQueryClient(<LoggingDashboard />);
    
    // Initially on logs tab
    expect(screen.getByText('Showing 5 logs')).toBeInTheDocument();
    
    // Switch to analytics tab
    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    fireEvent.click(analyticsTab);
    
    // Verify analytics content is displayed
    expect(screen.getByText('Total Logs')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument(); // Total count from mockLogStats
  });
});