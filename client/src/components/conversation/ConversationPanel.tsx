import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '@/types';

interface ConversationPanelProps {
  conversation: Conversation;
  onSendMessage: (message: string) => void;
}

const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversation,
  onSendMessage,
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Project Conversation</h3>
        <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary hover:bg-primary-50 focus:outline-none">
          <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>
      <div className="px-4 py-4 h-96 overflow-y-auto">
        {/* Message Thread */}
        <div className="space-y-4">
          {conversation.messages.map((msg, idx) => (
            <div key={idx} className="flex items-start">
              <div className="flex-shrink-0">
                <span className={`inline-flex h-8 w-8 rounded-full ${
                  msg.role === 'user' ? 'bg-gray-500' : 'bg-primary'
                } text-white items-center justify-center`}>
                  {msg.role === 'user' ? (
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <span className="font-bold">BS</span>
                  )}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">
                  {msg.role === 'user' ? 'You' : 'BS AI Developer'}
                </div>
                <div className={`mt-1 text-sm text-gray-700 ${
                  msg.role === 'user' ? 'bg-gray-100' : 'bg-blue-50'
                } px-4 py-3 rounded-lg whitespace-pre-wrap`}>
                  {msg.content}
                </div>
                <div className="mt-1 text-xs text-gray-500">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex space-x-3">
          <div className="flex-grow">
            <label htmlFor="message" className="sr-only">Message</label>
            <textarea
              id="message"
              name="message"
              rows={2}
              className="shadow-sm block w-full focus:ring-primary focus:border-primary sm:text-sm border border-gray-300 rounded-md p-2"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            ></textarea>
          </div>
          <div className="flex-shrink-0 self-end">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationPanel;
