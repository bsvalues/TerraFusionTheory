import { render, screen, fireEvent } from '@testing-library/react';
import MainContent from '@/components/layout/MainContent';
import { ProjectInfo, Conversation, Analysis, Architecture, Message } from '@/types';

// Mock the child components to simplify testing
jest.mock('@/components/project/ProjectInfoCard', () => ({
  __esModule: true,
  default: ({ project }: { project: ProjectInfo }) => (
    <div data-testid="project-info-card">{project.name}</div>
  ),
}));

jest.mock('@/components/conversation/ConversationPanel', () => ({
  __esModule: true,
  default: ({ conversation, onSendMessage }: { conversation: Conversation, onSendMessage: (message: string) => void }) => (
    <div data-testid="conversation-panel">
      <button onClick={() => onSendMessage('Test message')} data-testid="send-button">
        Send Message
      </button>
    </div>
  ),
}));

jest.mock('@/components/analysis/AnalysisPanel', () => ({
  __esModule: true,
  default: ({ analysis }: { analysis: Analysis }) => (
    <div data-testid="analysis-panel">Analysis ID: {analysis.id}</div>
  ),
}));

jest.mock('@/components/architecture/ArchitectureSketch', () => ({
  __esModule: true,
  default: ({ architecture }: { architecture: Architecture }) => (
    <div data-testid="architecture-sketch">
      Architecture Layers: {architecture.layers.length}
    </div>
  ),
}));

describe('MainContent Component', () => {
  // Sample mock data
  const mockMessages: Message[] = [
    {
      role: 'user',
      content: 'Sample message',
      timestamp: '2023-03-15T14:30:00Z'
    }
  ];

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

  const mockConversation: Conversation = {
    id: 1,
    projectId: 1,
    messages: mockMessages
  };

  const mockAnalysis: Analysis = {
    id: 1,
    projectId: 1,
    identifiedRequirements: [
      { name: 'User Authentication', status: 'success' }
    ],
    suggestedTechStack: {
      frontend: { name: 'React', description: 'React with TypeScript' },
      backend: { name: 'Node.js', description: 'Node.js with Express' },
      database: { name: 'PostgreSQL', description: 'PostgreSQL for data storage' },
      hosting: { name: 'AWS', description: 'AWS for cloud hosting' }
    },
    missingInformation: {
      items: ['Legacy system integration details']
    },
    nextSteps: [
      { order: 1, description: 'Define data models' }
    ]
  };

  const mockArchitecture: Architecture = {
    layers: [
      {
        name: 'User Interface',
        components: [
          { name: 'Admin Portal', type: 'ui' }
        ]
      }
    ]
  };

  const onSendMessageMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all sections and project title', () => {
    render(
      <MainContent 
        project={mockProject}
        conversation={mockConversation}
        analysis={mockAnalysis}
        architecture={mockArchitecture}
        onSendMessage={onSendMessageMock}
      />
    );
    
    // Check title
    expect(screen.getByText('Requirements Analysis')).toBeInTheDocument();
    
    // Check that all main components are rendered
    expect(screen.getByTestId('project-info-card')).toBeInTheDocument();
    expect(screen.getByTestId('conversation-panel')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-panel')).toBeInTheDocument();
    expect(screen.getByTestId('architecture-sketch')).toBeInTheDocument();
    
    // Check project name is passed to ProjectInfoCard
    expect(screen.getByText('BS County Values Application')).toBeInTheDocument();
    
    // Check analysis ID is passed to AnalysisPanel
    expect(screen.getByText('Analysis ID: 1')).toBeInTheDocument();
    
    // Check architecture layer count is passed to ArchitectureSketch
    expect(screen.getByText('Architecture Layers: 1')).toBeInTheDocument();
  });

  it('renders all tabs correctly', () => {
    render(
      <MainContent 
        project={mockProject}
        conversation={mockConversation}
        analysis={mockAnalysis}
        architecture={mockArchitecture}
        onSendMessage={onSendMessageMock}
      />
    );
    
    // Check all tabs are rendered
    expect(screen.getByText('Project Overview')).toBeInTheDocument();
    expect(screen.getByText('Requirements Gathering')).toBeInTheDocument();
    expect(screen.getByText('Design Proposal')).toBeInTheDocument();
    expect(screen.getByText('Development Plan')).toBeInTheDocument();
  });

  it('changes tab when clicked', () => {
    render(
      <MainContent 
        project={mockProject}
        conversation={mockConversation}
        analysis={mockAnalysis}
        architecture={mockArchitecture}
        onSendMessage={onSendMessageMock}
      />
    );
    
    // Default active tab should be 'overview'
    const defaultActiveTab = screen.getByText('Project Overview');
    expect(defaultActiveTab).toHaveClass('border-primary');
    
    // Click on 'Requirements Gathering' tab
    fireEvent.click(screen.getByText('Requirements Gathering'));
    
    // Now 'Requirements Gathering' should be active
    expect(screen.getByText('Requirements Gathering')).toHaveClass('border-primary');
    
    // And 'Project Overview' should not be active anymore
    expect(defaultActiveTab).not.toHaveClass('border-primary');
  });

  it('passes onSendMessage callback to ConversationPanel', () => {
    render(
      <MainContent 
        project={mockProject}
        conversation={mockConversation}
        analysis={mockAnalysis}
        architecture={mockArchitecture}
        onSendMessage={onSendMessageMock}
      />
    );
    
    // Click the send button in the ConversationPanel mock
    fireEvent.click(screen.getByTestId('send-button'));
    
    // Check if onSendMessage was called with the test message
    expect(onSendMessageMock).toHaveBeenCalledWith('Test message');
  });

  it('renders New Project and Share buttons', () => {
    render(
      <MainContent 
        project={mockProject}
        conversation={mockConversation}
        analysis={mockAnalysis}
        architecture={mockArchitecture}
        onSendMessage={onSendMessageMock}
      />
    );
    
    // Check if buttons are rendered
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });
});