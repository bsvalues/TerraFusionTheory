import { screen, fireEvent, waitFor } from '@testing-library/react';
import LogTester from '@/components/debug/LogTester';
import { renderWithQueryClient } from '../../utils/test-utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { LogLevel, LogCategory } from '@shared/schema';

// Mock the API request function
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn(),
  getQueryFn: jest.fn(),
  queryClient: { invalidateQueries: jest.fn() }
}));

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

describe('LogTester Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({
      toast: jest.fn(),
    });
  });

  it('renders correctly with default values', () => {
    renderWithQueryClient(<LogTester />);
    
    // Verify that the component renders with default values
    expect(screen.getByText('Log Testing Tools')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test log message')).toBeInTheDocument();
    expect(screen.getByText('info')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
    expect(screen.getByText('Generate Single Log')).toBeInTheDocument();
    expect(screen.getByText('Generate Sample Logs')).toBeInTheDocument();
  });

  it('handles input changes correctly', () => {
    renderWithQueryClient(<LogTester />);
    
    // Update message input
    const messageInput = screen.getByDisplayValue('Test log message');
    fireEvent.change(messageInput, { target: { value: 'Updated message' } });
    expect(screen.getByDisplayValue('Updated message')).toBeInTheDocument();
    
    // Update details input
    const detailsInput = screen.getByDisplayValue('Log details...');
    fireEvent.change(detailsInput, { target: { value: 'Updated details' } });
    expect(screen.getByDisplayValue('Updated details')).toBeInTheDocument();
  });

  it('sends a single log correctly', async () => {
    const mockToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
    
    (apiRequest as jest.Mock).mockResolvedValueOnce({ success: true });
    
    renderWithQueryClient(<LogTester />);
    
    // Click the generate single log button
    const generateButton = screen.getByText('Generate Single Log');
    fireEvent.click(generateButton);
    
    // Verify API call
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/logs', {
        method: 'POST',
        body: expect.stringContaining('"message":"Test log message"'),
      });
    });
    
    // Verify toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: "Log created",
      description: "Created a info log in the system category",
    });
  });

  it('handles multiple log generation correctly', async () => {
    const mockToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
    
    // Mock successful API calls for all logs
    (apiRequest as jest.Mock).mockResolvedValue({ success: true });
    
    renderWithQueryClient(<LogTester />);
    
    // Click the generate sample logs button
    const generateSampleButton = screen.getByText('Generate Sample Logs');
    fireEvent.click(generateSampleButton);
    
    // Wait for all API calls (7 sample logs)
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledTimes(7);
    });
    
    // Verify toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: "Test logs created",
      description: "Created 7 test log entries of various levels and categories",
    });
  });

  it('handles API errors correctly when generating logs', async () => {
    const mockToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
    
    // Mock API error
    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    
    renderWithQueryClient(<LogTester />);
    
    // Click generate button
    const generateButton = screen.getByText('Generate Single Log');
    fireEvent.click(generateButton);
    
    // Verify error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error creating log",
        description: "Failed to create test log entry",
        variant: "destructive"
      });
    });
  });
});