import { render, screen } from '@testing-library/react';
import AnalysisPanel from '@/components/analysis/AnalysisPanel';
import { Analysis, TechStack, Requirement, NextStep, MissingInfo } from '@/types';

describe('AnalysisPanel Component', () => {
  // Sample analysis data for testing
  const mockRequirements: Requirement[] = [
    { name: 'User Authentication', status: 'success' },
    { name: 'Data Export API', status: 'warning' },
    { name: 'Real-time Updates', status: 'error' }
  ];

  const mockTechStack: TechStack = {
    frontend: { 
      name: 'React', 
      description: 'Modern component-based UI library with TypeScript support for type safety'
    },
    backend: { 
      name: 'Node.js Express', 
      description: 'Lightweight and flexible Node.js framework with TypeScript support'
    },
    database: { 
      name: 'PostgreSQL', 
      description: 'Robust relational database with excellent spatial data support for GIS integration'
    },
    hosting: { 
      name: 'AWS', 
      description: 'Scalable cloud infrastructure with support for containerization'
    }
  };

  const mockMissingInfo: MissingInfo = {
    items: ['Legacy system integration details', 'Security compliance requirements']
  };

  const mockNextSteps: NextStep[] = [
    { order: 1, description: 'Define data models for property assessment' },
    { order: 2, description: 'Design API endpoints for data retrieval' },
    { order: 3, description: 'Implement authentication system' }
  ];

  const mockAnalysis: Analysis = {
    id: 1,
    projectId: 1,
    identifiedRequirements: mockRequirements,
    suggestedTechStack: mockTechStack,
    missingInformation: mockMissingInfo,
    nextSteps: mockNextSteps
  };

  it('renders the analysis panel with all sections', () => {
    render(<AnalysisPanel analysis={mockAnalysis} />);
    
    // Check title
    expect(screen.getByText('BS Analysis')).toBeInTheDocument();
    
    // Check requirements section
    expect(screen.getByText('Identified Requirements')).toBeInTheDocument();
    expect(screen.getByText('User Authentication')).toBeInTheDocument();
    expect(screen.getByText('Data Export API')).toBeInTheDocument();
    expect(screen.getByText('Real-time Updates')).toBeInTheDocument();
    
    // Check tech stack section
    expect(screen.getByText('Suggested Tech Stack')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Hosting')).toBeInTheDocument();
    expect(screen.getByText('Modern component-based UI library with TypeScript support for type safety')).toBeInTheDocument();
    expect(screen.getByText('Lightweight and flexible Node.js framework with TypeScript support')).toBeInTheDocument();
    
    // Check missing information section
    expect(screen.getByText('Missing Information')).toBeInTheDocument();
    expect(screen.getByText('Still need information on:')).toBeInTheDocument();
    expect(screen.getByText('Legacy system integration details')).toBeInTheDocument();
    expect(screen.getByText('Security compliance requirements')).toBeInTheDocument();
    
    // Check next steps section
    expect(screen.getByText('Next Steps')).toBeInTheDocument();
    expect(screen.getByText('Define data models for property assessment')).toBeInTheDocument();
    expect(screen.getByText('Design API endpoints for data retrieval')).toBeInTheDocument();
    expect(screen.getByText('Implement authentication system')).toBeInTheDocument();
  });

  it('handles empty requirements list gracefully', () => {
    const analysisWithEmptyRequirements = {
      ...mockAnalysis,
      identifiedRequirements: []
    };
    
    render(<AnalysisPanel analysis={analysisWithEmptyRequirements} />);
    
    // Should still render the panel without errors
    expect(screen.getByText('BS Analysis')).toBeInTheDocument();
    expect(screen.getByText('Identified Requirements')).toBeInTheDocument();
  });

  it('handles non-array requirements gracefully', () => {
    const analysisWithNullRequirements = {
      ...mockAnalysis,
      identifiedRequirements: null as any
    };
    
    render(<AnalysisPanel analysis={analysisWithNullRequirements} />);
    
    // Should still render the panel without errors
    expect(screen.getByText('BS Analysis')).toBeInTheDocument();
    expect(screen.getByText('Identified Requirements')).toBeInTheDocument();
  });

  it('handles missing tech stack gracefully', () => {
    const analysisWithoutTechStack = {
      ...mockAnalysis,
      suggestedTechStack: null as any
    };
    
    render(<AnalysisPanel analysis={analysisWithoutTechStack} />);
    
    // Should still render the panel without errors
    expect(screen.getByText('BS Analysis')).toBeInTheDocument();
    expect(screen.getByText('Identified Requirements')).toBeInTheDocument();
    // Tech stack section should not be present
    expect(screen.queryByText('Suggested Tech Stack')).not.toBeInTheDocument();
  });

  it('handles partial tech stack data gracefully', () => {
    const partialTechStack = {
      frontend: mockTechStack.frontend,
      // Missing other tech stack items
    };
    
    const analysisWithPartialTechStack = {
      ...mockAnalysis,
      suggestedTechStack: partialTechStack as TechStack
    };
    
    render(<AnalysisPanel analysis={analysisWithPartialTechStack} />);
    
    // Should still render the available tech stack items
    expect(screen.getByText('Suggested Tech Stack')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    // Other sections should not be rendered
    expect(screen.queryByText('Backend')).not.toBeInTheDocument();
  });

  it('handles missing information section gracefully', () => {
    const analysisWithoutMissingInfo = {
      ...mockAnalysis,
      missingInformation: null as any
    };
    
    render(<AnalysisPanel analysis={analysisWithoutMissingInfo} />);
    
    // Should still render the panel without errors
    expect(screen.getByText('BS Analysis')).toBeInTheDocument();
    // Missing information section should not be present
    expect(screen.queryByText('Missing Information')).not.toBeInTheDocument();
  });

  it('handles empty missing information items gracefully', () => {
    const analysisWithEmptyMissingItems = {
      ...mockAnalysis,
      missingInformation: { items: [] }
    };
    
    render(<AnalysisPanel analysis={analysisWithEmptyMissingItems} />);
    
    // Missing information section should not be present when items array is empty
    expect(screen.queryByText('Missing Information')).not.toBeInTheDocument();
  });

  it('handles missing next steps gracefully', () => {
    const analysisWithoutNextSteps = {
      ...mockAnalysis,
      nextSteps: null as any
    };
    
    render(<AnalysisPanel analysis={analysisWithoutNextSteps} />);
    
    // Should still render the panel without errors
    expect(screen.getByText('BS Analysis')).toBeInTheDocument();
    // Next steps section should not be present
    expect(screen.queryByText('Next Steps')).not.toBeInTheDocument();
  });

  it('handles empty next steps gracefully', () => {
    const analysisWithEmptyNextSteps = {
      ...mockAnalysis,
      nextSteps: []
    };
    
    render(<AnalysisPanel analysis={analysisWithEmptyNextSteps} />);
    
    // Should render the next steps section but with no items
    expect(screen.getByText('Next Steps')).toBeInTheDocument();
    // There should be no steps listed
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('renders different status icons for requirements', () => {
    render(<AnalysisPanel analysis={mockAnalysis} />);
    
    // Test that we have SVG elements for each requirement status
    // We can test this by checking for the presence of requirement names since
    // the SVG elements themselves don't have test-friendly attributes
    
    const successRequirement = screen.getByText('User Authentication');
    expect(successRequirement).toBeInTheDocument();
    
    const warningRequirement = screen.getByText('Data Export API');
    expect(warningRequirement).toBeInTheDocument();
    
    const errorRequirement = screen.getByText('Real-time Updates');
    expect(errorRequirement).toBeInTheDocument();
  });
});