/**
 * TerraFusionUXLayout.jsx
 * 
 * A modern grid layout component for TerraFusion with dedicated zones for:
 * - Form inputs
 * - Agent feed (AI interactions)
 * - Header
 * 
 * This component provides a structured layout pattern for TerraFusion pages
 * that interact with AI agents and require user inputs.
 */

import React from 'react';
import { Link } from 'wouter';

// Import optional icons if available (will use fallbacks if not)
let ChevronLeftIcon, MessageCircleIcon, BrainIcon;
try {
  // Dynamic import for Lucide icons
  const { ChevronLeft, MessageCircle, Brain } = require('lucide-react');
  ChevronLeftIcon = ChevronLeft;
  MessageCircleIcon = MessageCircle;
  BrainIcon = Brain;
} catch (error) {
  // Fallback SVG icons if lucide isn't available
  ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
  MessageCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  );
  BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 2 17.5v-15a2.5 2.5 0 0 1 5-.44A2.5 2.5 0 0 1 9.5 2Z"></path>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 22 17.5v-15a2.5 2.5 0 0 0-5-.44A2.5 2.5 0 0 0 14.5 2Z"></path>
    </svg>
  );
}

/**
 * TerraFusionUXLayout Component
 * 
 * @param {Object} props Component props
 * @param {ReactNode} props.children Optional children to render in a default container
 * @param {ReactNode} props.formContent Content for the form zone
 * @param {ReactNode} props.agentFeed Content for the agent feed zone
 * @param {string} props.title Page title to display in the header
 * @param {string} props.backLink Optional URL for back navigation
 * @param {string} props.backText Optional text for back navigation
 * @param {string} props.layout Grid layout style ('split' or 'form-dominant' or 'agent-dominant')
 * @param {boolean} props.fluid Whether to use full width container
 * @param {ReactNode} props.headerActions Additional actions to show in the header
 */
const TerraFusionUXLayout = ({
  children,
  formContent,
  agentFeed,
  title = "TerraFusion",
  backLink,
  backText = "Back",
  layout = "split",
  fluid = false,
  headerActions
}) => {
  // Determine grid template based on layout prop
  let gridTemplate;
  switch (layout) {
    case 'form-dominant':
      gridTemplate = 'grid-template-columns: 2fr 1fr;';
      break;
    case 'agent-dominant':
      gridTemplate = 'grid-template-columns: 1fr 2fr;';
      break;
    case 'split':
    default:
      gridTemplate = 'grid-template-columns: 1fr 1fr;';
      break;
  }

  return (
    <div className="tf-theme min-h-screen flex flex-col">
      {/* Header Zone */}
      <header className="tf-header">
        <div className="flex items-center">
          {backLink && (
            <Link to={backLink} className="flex items-center text-tf-text-primary mr-4 hover:text-tf-primary transition-colors">
              <ChevronLeftIcon className="mr-1" size={18} />
              <span>{backText}</span>
            </Link>
          )}
          <h1 className="tf-header-title">{title}</h1>
        </div>
        
        {headerActions && (
          <div className="flex items-center space-x-2">
            {headerActions}
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className={`flex-1 p-4 ${fluid ? 'container-fluid' : 'container mx-auto'}`}>
        {/* If both formContent and agentFeed are provided, use the grid layout */}
        {formContent && agentFeed ? (
          <div className="tf-container" style={{ gridTemplateRows: "1fr", [gridTemplate]: true }}>
            {/* Form Zone */}
            <div className="tf-form-zone">
              <div className="flex items-center mb-4 text-tf-text-secondary">
                <MessageCircleIcon size={16} className="mr-2" />
                <span className="text-sm font-medium">Input Zone</span>
              </div>
              {formContent}
            </div>
            
            {/* Agent Feed Zone */}
            <div className="tf-agent-feed">
              <div className="flex items-center mb-4 text-tf-accent">
                <BrainIcon size={16} className="mr-2" />
                <span className="text-sm font-medium">AI Assistant</span>
                <span className="tf-ai-badge ml-2">Live</span>
              </div>
              {agentFeed}
            </div>
          </div>
        ) : (
          // If only one or neither zone is provided, render children or individual zones
          <>
            {formContent && <div className="tf-form-zone mb-4">{formContent}</div>}
            {agentFeed && <div className="tf-agent-feed mb-4">{agentFeed}</div>}
            {children}
          </>
        )}
      </main>
    </div>
  );
};

export default TerraFusionUXLayout;