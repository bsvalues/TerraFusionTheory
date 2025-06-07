import { screen, fireEvent, waitFor } from '@testing-library/react';
import ErrorDashboard from '@/components/debug/ErrorDashboard';
import { renderWithQueryClient } from '../../utils/test-utils';
import { useErrors } from '@/hooks/useErrors';
import { useFeedback } from '@/hooks/useFeedback';
import { LoggingDashboard } from '@/components/logging/LoggingDashboard';
import LogTester from '@/components/debug/LogTester';

// Mock the dependencies
jest.mock('@/hooks/useErrors', () => ({
  useErrors: jest.fn(),
}));

jest.mock('@/hooks/useFeedback', () => ({
  useFeedback: jest.fn(),
}));

jest.mock('@/components/logging/LoggingDashboard', () => ({
  LoggingDashboard: jest.fn().mockReturnValue(<div data-testid="logging-dashboard">Logging Dashboard</div>),
}));

jest.mock('@/components/debug/LogTester', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue(<div data-testid="log-tester">Log Tester</div>),
}));

describe('ErrorDashboard Component', () => {
  // Mock error data
  const mockErrors = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      message: 'API Error Test',
      source: 'api',
      details: 'API call failed with 500',
      stack: 'Error at line 42'
    },
    {
      id: '2',
      timestamp: new Date().toISOString(),
      message: 'UI Error Test',
      source: 'ui',
      details: 'Failed to render component',
    }
  ];

  // Mock feedback data
  const mockFeedbackItems = [
    {
      id: 1,
      message: 'The app crashed when I tried to submit',
      timestamp: new Date().toISOString(),
      resolved: false
    },
    {
      id: 2,
      message: 'Great feature, but needs better error messages',
      timestamp: new Date().toISOString(),
      resolved: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useErrors hook
    (useErrors as jest.Mock).mockReturnValue({
      errors: mockErrors,
      clearErrors: jest.fn(),
      addError: jest.fn(),
      logApiError: jest.fn(),
      logUiError: jest.fn(),
      logParsingError: jest.fn()
    });
    
    // Mock useFeedback hook
    (useFeedback as jest.Mock).mockReturnValue({
      feedbackItems: mockFeedbackItems,
      submitFeedback: jest.fn().mockResolvedValue({}),
      markAsResolved: jest.fn().mockResolvedValue({}),
      loading: false,
      error: null,
      refresh: jest.fn()
    });
  });

  it('renders as a button when closed', () => {
    renderWithQueryClient(<ErrorDashboard />);
    
    const button = screen.getByText('2 Errors');
    expect(button).toBeInTheDocument();
  });

  it('opens dashboard when button is clicked', () => {
    renderWithQueryClient(<ErrorDashboard />);
    
    // Click to open
    fireEvent.click(screen.getByText('2 Errors'));
    
    // Check if dashboard is open
    expect(screen.getByText('BS Intelligent Agent - Dashboard')).toBeInTheDocument();
  });

  it('displays errors tab correctly', () => {
    renderWithQueryClient(<ErrorDashboard />);
    
    // Open dashboard
    fireEvent.click(screen.getByText('2 Errors'));
    
    // Check tab is selected
    expect(screen.getByRole('tab', { name: /Errors/ })).toHaveAttribute('data-state', 'active');
    
    // Check if errors are displayed
    expect(screen.getByText('API Error Test')).toBeInTheDocument();
    expect(screen.getByText('UI Error Test')).toBeInTheDocument();
  });

  it('filters errors correctly', () => {
    renderWithQueryClient(<ErrorDashboard />);
    
    // Open dashboard
    fireEvent.click(screen.getByText('2 Errors'));
    
    // Filter by API errors
    fireEvent.click(screen.getByText('API'));
    
    // Check if only API errors are displayed
    expect(screen.getByText('API Error Test')).toBeInTheDocument();
    expect(screen.queryByText('UI Error Test')).not.toBeInTheDocument();
  });

  it('expands error details when clicked', () => {
    renderWithQueryClient(<ErrorDashboard />);
    
    // Open dashboard
    fireEvent.click(screen.getByText('2 Errors'));
    
    // Click on error to expand
    fireEvent.click(screen.getByText('API Error Test'));
    
    // Check if details are shown
    expect(screen.getByText('API call failed with 500')).toBeInTheDocument();
    expect(screen.getByText('Error at line 42')).toBeInTheDocument();
  });

  it('displays feedback tab correctly', () => {
    renderWithQueryClient(<ErrorDashboard />);
    
    // Open dashboard
    fireEvent.click(screen.getByText('2 Errors'));
    
    // Switch to feedback tab
    fireEvent.click(screen.getByRole('tab', { name: /Feedback/ }));
    
    // Check if feedback items are displayed
    expect(screen.getByText('The app crashed when I tried to submit')).toBeInTheDocument();
    expect(screen.getByText('Great feature, but needs better error messages')).toBeInTheDocument();
  });

  it('allows marking feedback as resolved', async () => {
    const mockMarkAsResolved = jest.fn().mockResolvedValue({});
    (useFeedback as jest.Mock).mockReturnValue({
      feedbackItems: mockFeedbackItems,
      submitFeedback: jest.fn().mockResolvedValue({}),
      markAsResolved: mockMarkAsResolved,
      loading: false,
      error: null,
      refresh: jest.fn()
    });
    
    renderWithQueryClient(<ErrorDashboard />);
    
    // Open dashboard
    fireEvent.click(screen.getByText('2 Errors'));
    
    // Switch to feedback tab
    fireEvent.click(screen.getByRole('tab', { name: /Feedback/ }));
    
    // Click resolve on unresolved feedback
    fireEvent.click(screen.getByText('Resolve'));
    
    // Check if markAsResolved was called
    expect(mockMarkAsResolved).toHaveBeenCalledWith(1);
  });

  it('allows submitting new feedback', async () => {
    const mockSubmitFeedback = jest.fn().mockResolvedValue({});
    (useFeedback as jest.Mock).mockReturnValue({
      feedbackItems: mockFeedbackItems,
      submitFeedback: mockSubmitFeedback,
      markAsResolved: jest.fn().mockResolvedValue({}),
      loading: false,
      error: null,
      refresh: jest.fn()
    });
    
    renderWithQueryClient(<ErrorDashboard />);
    
    // Open dashboard
    fireEvent.click(screen.getByText('2 Errors'));
    
    // Type feedback
    const feedbackInput = screen.getByPlaceholderText('Describe the issue or provide feedback...');
    fireEvent.change(feedbackInput, { target: { value: 'New feedback test' } });
    
    // Submit feedback
    fireEvent.click(screen.getByText('Submit'));
    
    // Check if submitFeedback was called
    expect(mockSubmitFeedback).toHaveBeenCalledWith('New feedback test');
    
    // Wait for submission state to change
    await waitFor(() => {
      expect(screen.getByText('Submitted!')).toBeInTheDocument();
    });
  });

  it('displays logs tab with components correctly', () => {
    renderWithQueryClient(<ErrorDashboard />);
    
    // Open dashboard
    fireEvent.click(screen.getByText('2 Errors'));
    
    // Switch to logs tab
    fireEvent.click(screen.getByRole('tab', { name: /Logs/ }));
    
    // Check if logging components are rendered
    expect(screen.getByTestId('logging-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('log-tester')).toBeInTheDocument();
  });
});