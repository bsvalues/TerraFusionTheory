import { render, screen, fireEvent } from '@testing-library/react';
import ConversationPanel from '@/components/conversation/ConversationPanel';
import { Conversation, Message } from '@/types';

describe('ConversationPanel Component', () => {
  // Sample conversation data for testing
  const mockMessages: Message[] = [
    {
      role: 'user',
      content: 'Can you help me design a property assessment system?',
      timestamp: '2023-03-15T14:30:00Z'
    },
    {
      role: 'assistant',
      content: 'Certainly! A property assessment system typically needs modules for data collection, valuation models, reporting, and appeals management. What specific features are you looking for?',
      timestamp: '2023-03-15T14:31:00Z'
    },
    {
      role: 'user',
      content: 'I need it to integrate with GIS systems and handle batch imports.',
      timestamp: '2023-03-15T14:32:00Z'
    }
  ];

  const mockConversation: Conversation = {
    id: 1,
    projectId: 1,
    messages: mockMessages
  };

  const onSendMessageMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders conversation messages correctly', () => {
    render(
      <ConversationPanel 
        conversation={mockConversation} 
        onSendMessage={onSendMessageMock} 
      />
    );

    // Check for title
    expect(screen.getByText('Project Conversation')).toBeInTheDocument();
    
    // Check for user messages
    expect(screen.getByText('Can you help me design a property assessment system?')).toBeInTheDocument();
    expect(screen.getByText('I need it to integrate with GIS systems and handle batch imports.')).toBeInTheDocument();
    
    // Check for assistant messages
    expect(screen.getByText('Certainly! A property assessment system typically needs modules for data collection, valuation models, reporting, and appeals management. What specific features are you looking for?')).toBeInTheDocument();
    
    // Check for sender labels
    const youLabels = screen.getAllByText('You');
    expect(youLabels.length).toBe(2); // Two user messages
    
    const assistantLabels = screen.getAllByText('BS AI Developer');
    expect(assistantLabels.length).toBe(1); // One assistant message
  });

  it('handles empty message list gracefully', () => {
    const emptyConversation = {
      ...mockConversation,
      messages: []
    };

    render(
      <ConversationPanel 
        conversation={emptyConversation} 
        onSendMessage={onSendMessageMock} 
      />
    );

    // Should still render the panel without errors
    expect(screen.getByText('Project Conversation')).toBeInTheDocument();
  });

  it('handles null message list gracefully', () => {
    const nullMessagesConversation = {
      ...mockConversation,
      messages: null as any
    };

    render(
      <ConversationPanel 
        conversation={nullMessagesConversation} 
        onSendMessage={onSendMessageMock} 
      />
    );

    // Should still render the panel without errors
    expect(screen.getByText('Project Conversation')).toBeInTheDocument();
  });

  it('allows user to type and send a message', () => {
    render(
      <ConversationPanel 
        conversation={mockConversation} 
        onSendMessage={onSendMessageMock} 
      />
    );

    // Find the text area and send button
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    // Type a message
    fireEvent.change(textarea, { target: { value: 'This is a test message' } });
    
    // Click the send button
    fireEvent.click(sendButton);

    // Check if onSendMessage was called with the correct message
    expect(onSendMessageMock).toHaveBeenCalledWith('This is a test message');
    
    // Check if textarea was cleared
    expect(textarea).toHaveValue('');
  });

  it('handles Enter key press to send message', () => {
    render(
      <ConversationPanel 
        conversation={mockConversation} 
        onSendMessage={onSendMessageMock} 
      />
    );

    // Find the text area
    const textarea = screen.getByPlaceholderText('Type your message...');

    // Type a message
    fireEvent.change(textarea, { target: { value: 'Message sent with Enter key' } });
    
    // Press Enter key
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    // Check if onSendMessage was called with the correct message
    expect(onSendMessageMock).toHaveBeenCalledWith('Message sent with Enter key');
    
    // Check if textarea was cleared
    expect(textarea).toHaveValue('');
  });

  it('does not send empty messages', () => {
    render(
      <ConversationPanel 
        conversation={mockConversation} 
        onSendMessage={onSendMessageMock} 
      />
    );

    // Find the send button
    const sendButton = screen.getByText('Send');

    // Click the send button without typing anything
    fireEvent.click(sendButton);

    // Check that onSendMessage was not called
    expect(onSendMessageMock).not.toHaveBeenCalled();
  });

  it('does not send message when pressing Enter with Shift key', () => {
    render(
      <ConversationPanel 
        conversation={mockConversation} 
        onSendMessage={onSendMessageMock} 
      />
    );

    // Find the text area
    const textarea = screen.getByPlaceholderText('Type your message...');

    // Type a message
    fireEvent.change(textarea, { target: { value: 'This should not be sent' } });
    
    // Press Shift+Enter
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

    // Check that onSendMessage was not called
    expect(onSendMessageMock).not.toHaveBeenCalled();
    
    // Text should remain in the textarea
    expect(textarea).toHaveValue('This should not be sent');
  });

  it('formats timestamps correctly', () => {
    // Use a specific date to test timestamp formatting
    const specificDateMessage: Message[] = [
      {
        role: 'user',
        content: 'Test message with specific time',
        timestamp: '2023-03-15T14:30:00Z' // This should be formatted according to the formatTime function
      }
    ];

    const conversationWithSpecificTime = {
      ...mockConversation,
      messages: specificDateMessage
    };

    render(
      <ConversationPanel 
        conversation={conversationWithSpecificTime} 
        onSendMessage={onSendMessageMock} 
      />
    );

    // The exact expected format will depend on the locale and timezone of the test environment
    // But we can at least check if some time text is rendered
    const timeElements = screen.getAllByText(/\d+:\d+/);
    expect(timeElements.length).toBeGreaterThan(0);
  });
});