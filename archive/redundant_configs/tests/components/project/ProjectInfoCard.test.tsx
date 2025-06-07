import React from 'react';
import { screen, render } from '../../../tests/utils/test-utils';
import ProjectInfoCard from '@/components/project/ProjectInfoCard';
import { ProjectInfo } from '@/types';

// Mock the Badge component since it might depend on theme context
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode, variant: string }) => (
    <span data-testid={`badge-${variant}`}>{children}</span>
  )
}));

describe('ProjectInfoCard Component', () => {
  // Sample project data for testing
  const mockProject: ProjectInfo = {
    id: 1,
    name: 'BS County Values Application',
    description: 'AI-powered application for county tax assessors',
    type: 'Enterprise Application',
    targetPlatform: 'Web',
    technologyStack: ['React', 'Node.js', 'PostgreSQL', 'Express'],
    status: 'in_progress',
    overview: 'A comprehensive system for automated property assessment and tax calculation.',
    progress: 65
  };

  it('renders project information correctly', () => {
    render(<ProjectInfoCard project={mockProject} />);
    
    // Check project name and title
    expect(screen.getByText('Project Information')).toBeInTheDocument();
    expect(screen.getByText('BS County Values Application')).toBeInTheDocument();
    
    // Check project type
    expect(screen.getByText('Project Type')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Application')).toBeInTheDocument();
    
    // Check target platform
    expect(screen.getByText('Target Platform')).toBeInTheDocument();
    expect(screen.getByText('Web')).toBeInTheDocument();
    
    // Check technology stack
    expect(screen.getByText('Technology Stack')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('Express')).toBeInTheDocument();
    
    // Check status
    expect(screen.getByText('Project Status')).toBeInTheDocument();
    expect(screen.getByText('in progress')).toBeInTheDocument(); // space replaced from in_progress
    
    // Check overview
    expect(screen.getByText('Project Overview')).toBeInTheDocument();
    expect(screen.getByText('A comprehensive system for automated property assessment and tax calculation.')).toBeInTheDocument();
    
    // Check progress
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('handles empty technology stack gracefully', () => {
    const projectWithEmptyStack = {
      ...mockProject,
      technologyStack: []
    };
    
    render(<ProjectInfoCard project={projectWithEmptyStack} />);
    
    // Should still render without errors
    expect(screen.getByText('Technology Stack')).toBeInTheDocument();
  });

  it('handles non-array technology stack gracefully', () => {
    // Create a modified project with a non-array technologyStack
    const projectWithInvalidStack = {
      ...mockProject,
      technologyStack: null as any // Testing the null case
    };
    
    render(<ProjectInfoCard project={projectWithInvalidStack} />);
    
    // Should still render without errors
    expect(screen.getByText('Technology Stack')).toBeInTheDocument();
  });

  it('renders progress bar with correct width', () => {
    render(<ProjectInfoCard project={mockProject} />);
    
    // Get the progress bar element
    const progressBar = screen.getByText('').parentElement?.querySelector('div > div') as HTMLElement;
    
    // Check that the width style is set correctly
    expect(progressBar).toHaveStyle('width: 65%');
  });

  it('formats status by replacing underscores with spaces', () => {
    const projectWithUnderscoreStatus = {
      ...mockProject,
      status: 'pending_approval'
    };
    
    render(<ProjectInfoCard project={projectWithUnderscoreStatus} />);
    
    // Should format the status text
    expect(screen.getByText('pending approval')).toBeInTheDocument();
  });
});