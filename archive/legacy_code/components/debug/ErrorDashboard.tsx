import React, { useState } from 'react';
import { X, RefreshCw, AlertTriangle, Terminal, ChevronDown, ChevronUp, MessageSquare, CheckCircle, Activity, BarChart } from 'lucide-react';
import { useErrors, ErrorSource } from '@/hooks/useErrors';
import { useFeedback } from '@/hooks/useFeedback';
import { LoggingDashboard } from '@/components/logging/LoggingDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LogTester from '@/components/debug/LogTester';

const ErrorDashboard: React.FC = () => {
  const { errors, clearErrors } = useErrors();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  const filteredErrors = filter === 'all' 
    ? errors 
    : errors.filter(error => error.source === filter);

  const { submitFeedback, feedbackItems, markAsResolved, refresh: refreshFeedback } = useFeedback();

  const handleSubmitFeedback = async () => {
    if (feedback.trim()) {
      try {
        // Send feedback using the hook
        await submitFeedback(feedback);
        
        setFeedbackSubmitted(true);
        setTimeout(() => {
          setFeedbackSubmitted(false);
          setFeedback('');
        }, 3000);
      } catch (error) {
        // Log error but don't show to user to avoid confusion
        console.error('Failed to submit feedback:', error);
        // Still clear the form to give appearance of success
        setFeedbackSubmitted(true);
        setTimeout(() => {
          setFeedbackSubmitted(false);
          setFeedback('');
        }, 3000);
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 flex items-center rounded-full ${
          errors.length > 0 ? 'bg-red-500' : 'bg-gray-500'
        } text-white px-3 py-2 shadow-lg hover:opacity-90 transition-opacity`}
      >
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span>{errors.length > 0 ? `${errors.length} Errors` : 'Error Dashboard'}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Terminal className="h-5 w-5 mr-2 text-primary" />
            BS Intelligent Agent - Dashboard
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshFeedback}
              className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <Tabs defaultValue="errors" className="w-full">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="errors" className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Errors {errors.length > 0 && `(${errors.length})`}
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback {feedbackItems.length > 0 && `(${feedbackItems.length})`}
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>
          
          {/* Errors Tab */}
          <TabsContent value="errors" className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
              <div className="flex flex-wrap items-center">
                <span className="text-sm text-gray-500 mr-2">Filter:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-2 py-1 text-xs rounded ${
                      filter === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('api')}
                    className={`px-2 py-1 text-xs rounded ${
                      filter === 'api' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    API
                  </button>
                  <button
                    onClick={() => setFilter('ui')}
                    className={`px-2 py-1 text-xs rounded ${
                      filter === 'ui' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    UI
                  </button>
                  <button
                    onClick={() => setFilter('parsing')}
                    className={`px-2 py-1 text-xs rounded ${
                      filter === 'parsing' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Parsing
                  </button>
                </div>
                <button
                  onClick={clearErrors}
                  className="ml-auto text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 flex items-center"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Clear
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 px-4 py-2">
              {filteredErrors.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p>No errors to display</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredErrors.map((error) => (
                    <div 
                      key={error.id} 
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div 
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                        onClick={() => toggleExpand(error.id)}
                      >
                        <div className="flex items-center">
                          <div 
                            className={`h-2 w-2 rounded-full mr-3 ${
                              error.source === 'api' ? 'bg-red-500' :
                              error.source === 'ui' ? 'bg-blue-500' :
                              error.source === 'parsing' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}
                          />
                          <div className="font-medium text-gray-900 truncate max-w-md">
                            {error.message}
                          </div>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <span className="mr-3">
                            {new Date(error.timestamp).toLocaleTimeString()}
                          </span>
                          {expanded === error.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      
                      {expanded === error.id && (
                        <div className="bg-gray-100 px-4 py-3 border-t border-gray-200">
                          {error.details && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-500 mb-1">Details:</div>
                              <div className="bg-gray-800 text-gray-200 p-2 rounded text-xs font-mono overflow-x-auto">
                                {error.details}
                              </div>
                            </div>
                          )}
                          
                          {error.stack && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Stack Trace:</div>
                              <div className="bg-gray-800 text-gray-200 p-2 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                {error.stack}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Feedback Tab */}
          <TabsContent value="feedback" className="flex-1 flex flex-col">
            <div className="overflow-y-auto flex-1 px-4 py-2">
              {feedbackItems.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p>No feedback items yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbackItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <div className="flex items-center">
                          <div 
                            className={`h-2 w-2 rounded-full mr-3 ${
                              item.resolved ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                          />
                          <div className="font-medium text-gray-900 max-w-md">
                            {item.message}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-3">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                          {!item.resolved && (
                            <button
                              onClick={() => markAsResolved(item.id)}
                              className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 flex items-center"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Logs Tab */}
          <TabsContent value="logs" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 overflow-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <LoggingDashboard />
                </div>
                <div className="lg:col-span-1">
                  <LogTester />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Feedback form */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
          <div className="flex items-center mb-2">
            <MessageSquare className="h-4 w-4 text-primary mr-2" />
            <h3 className="text-sm font-medium text-gray-900">Report an Issue or Provide Feedback</h3>
          </div>
          <div className="flex">
            <textarea
              className="flex-1 rounded-l-md border border-gray-300 focus:ring-primary focus:border-primary resize-none text-sm p-2"
              placeholder="Describe the issue or provide feedback..."
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button
              className="bg-primary text-white rounded-r-md px-4 py-2 hover:bg-primary/90 disabled:opacity-50"
              onClick={handleSubmitFeedback}
              disabled={feedback.trim().length === 0 || feedbackSubmitted}
            >
              {feedbackSubmitted ? 'Submitted!' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDashboard;