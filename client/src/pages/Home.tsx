import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import ErrorDashboard from '@/components/debug/ErrorDashboard';
import { useConversation } from '@/hooks/useConversation';
import { useProject } from '@/hooks/useProject';
import { Activity, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Temporary: Using a hardcoded project ID until we implement project selection
const CURRENT_PROJECT_ID = 1;

const Home: React.FC = () => {
  const { 
    project, 
    analysis, 
    architecture, 
    isLoading: isProjectLoading 
  } = useProject(CURRENT_PROJECT_ID);
  
  const { 
    conversation, 
    sendMessage, 
    isLoading: isConversationLoading 
  } = useConversation(CURRENT_PROJECT_ID);

  const isLoading = isProjectLoading || isConversationLoading;

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Error dashboard state
  const [showErrorDashboard, setShowErrorDashboard] = useState(false);
  
  if (isLoading) {
    // Could add a loading state here
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center justify-between shadow">
          <button 
            type="button" 
            className="h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-2 mr-4">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">BS</span>
            </div>
            <h1 className="text-xl font-semibold">AI Developer</h1>
          </div>
        </div>
        
        {/* Desktop Header with Debug/Log Toggle Button */}
        <div className="hidden md:flex justify-end items-center p-2 border-b">
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={() => setShowErrorDashboard(true)}
          >
            <Activity size={16} />
            <span>System Monitor</span>
          </Button>
        </div>
        
        {/* Main Content */}
        <MainContent
          project={project}
          conversation={conversation}
          analysis={analysis}
          architecture={architecture}
          onSendMessage={sendMessage}
        />
        
        {/* Error Dashboard Modal */}
        {showErrorDashboard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-11/12 max-w-6xl h-5/6 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="text-yellow-500" size={20} />
                  System Monitor & Logs
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowErrorDashboard(false)}
                >
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <ErrorDashboard />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile menu (off-canvas) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xl">BS</span>
                </div>
                <h1 className="ml-2 text-xl font-semibold">AI Developer</h1>
              </div>
              {/* Mobile navigation - clone of Sidebar */}
              <nav className="mt-5 px-2 space-y-1">
                <a href="#" className="flex items-center px-2 py-2 text-base font-medium rounded-md bg-primary text-white">
                  Requirements Analysis
                </a>
                <a href="#" className="flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100">
                  Design & Architecture
                </a>
                <a href="#" className="flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100">
                  Code Generation
                </a>
                <a href="#" className="flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100">
                  Debugging & Testing
                </a>
                <a href="#" className="flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100">
                  Deployment & CI/CD
                </a>
                <a href="#" className="flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100">
                  Documentation
                </a>
              </nav>
            </div>
          </div>
          <div className="flex-shrink-0 w-14">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
