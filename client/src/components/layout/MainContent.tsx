import React, { useState } from 'react';
import ProjectInfoCard from '../project/ProjectInfoCard';
import ConversationPanel from '../conversation/ConversationPanel';
import AnalysisPanel from '../analysis/AnalysisPanel';
import ArchitectureSketch from '../architecture/ArchitectureSketch';
import { ProjectInfo, Conversation, Analysis, Architecture } from '@/types';

type Tab = 'overview' | 'requirements' | 'design' | 'development';

interface MainContentProps {
  project: ProjectInfo;
  conversation: Conversation;
  analysis: Analysis;
  architecture: Architecture;
  onSendMessage: (message: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  project,
  conversation,
  analysis,
  architecture,
  onSendMessage,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <main className="flex-1 relative overflow-y-auto focus:outline-none">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Requirements Analysis</h1>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none">
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Project
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Tabs */}
          <div className="mt-6 mb-4 border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm`}
              >
                Project Overview
              </button>
              <button
                onClick={() => handleTabChange('requirements')}
                className={`${
                  activeTab === 'requirements'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm`}
              >
                Requirements Gathering
              </button>
              <button
                onClick={() => handleTabChange('design')}
                className={`${
                  activeTab === 'design'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm`}
              >
                Design Proposal
              </button>
              <button
                onClick={() => handleTabChange('development')}
                className={`${
                  activeTab === 'development'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm`}
              >
                Development Plan
              </button>
            </nav>
          </div>
          
          {/* Project Information Card */}
          <ProjectInfoCard project={project} />
          
          {/* Conversation and AI Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Conversation Panel */}
            <div className="lg:col-span-2">
              <ConversationPanel
                conversation={conversation}
                onSendMessage={onSendMessage}
              />
            </div>
            
            {/* Analysis Panel */}
            <div className="lg:col-span-1">
              <AnalysisPanel analysis={analysis} />
            </div>
          </div>
          
          {/* Initial Architecture Sketch */}
          <ArchitectureSketch architecture={architecture} />
        </div>
      </div>
    </main>
  );
};

export default MainContent;
