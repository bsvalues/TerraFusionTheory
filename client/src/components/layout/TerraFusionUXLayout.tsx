/**
 * TerraFusionUXLayout.tsx
 * 
 * A modern grid layout component for TerraFusion with dedicated zones for:
 * - Form inputs
 * - Agent feed (AI interactions)
 * - Header
 * 
 * This component provides a structured layout pattern for TerraFusion pages
 * that interact with AI agents and require user inputs.
 */

import React, { ReactNode } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, MessageCircle, Brain } from 'lucide-react';

interface TerraFusionUXLayoutProps {
  /** Optional children to render in a default container */
  children?: ReactNode;
  /** Content for the form zone */
  formContent?: ReactNode;
  /** Content for the agent feed zone */
  agentFeed?: ReactNode;
  /** Page title to display in the header */
  title?: string;
  /** Optional URL for back navigation */
  backLink?: string;
  /** Optional text for back navigation */
  backText?: string;
  /** Grid layout style */
  layout?: 'split' | 'form-dominant' | 'agent-dominant';
  /** Whether to use full width container */
  fluid?: boolean;
  /** Additional actions to show in the header */
  headerActions?: ReactNode;
}

/**
 * TerraFusionUXLayout Component
 * 
 * A modern layout for TerraFusion pages with dedicated zones for form inputs and AI agent interactions.
 */
const TerraFusionUXLayout: React.FC<TerraFusionUXLayoutProps> = ({
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
  const getGridTemplateStyle = () => {
    switch (layout) {
      case 'form-dominant':
        return { gridTemplateColumns: '2fr 1fr' };
      case 'agent-dominant':
        return { gridTemplateColumns: '1fr 2fr' };
      case 'split':
      default:
        return { gridTemplateColumns: '1fr 1fr' };
    }
  };

  return (
    <div className="tf-theme min-h-screen flex flex-col">
      {/* Header Zone */}
      <header className="tf-header">
        <div className="flex items-center">
          {backLink && (
            <Link href={backLink} className="flex items-center text-tf-text-primary mr-4 hover:text-tf-primary transition-colors">
              <ChevronLeft className="mr-1" size={18} />
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
          <div className="tf-container" style={{ gridTemplateRows: "1fr", ...getGridTemplateStyle() }}>
            {/* Form Zone */}
            <div className="tf-form-zone">
              <div className="flex items-center mb-4 text-tf-text-secondary">
                <MessageCircle size={16} className="mr-2" />
                <span className="text-sm font-medium">Input Zone</span>
              </div>
              {formContent}
            </div>
            
            {/* Agent Feed Zone */}
            <div className="tf-agent-feed">
              <div className="flex items-center mb-4 text-tf-accent">
                <Brain size={16} className="mr-2" />
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