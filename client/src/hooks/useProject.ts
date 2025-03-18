import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProjectInfo, Analysis, Architecture } from '@/types';

export const useProject = (projectId: number) => {
  // Fetch project data
  const { data: rawProject, isLoading: isProjectLoading, error: projectError } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
  });
  
  // Fetch analysis data
  const { data: rawAnalysis, isLoading: isAnalysisLoading, error: analysisError } = useQuery({
    queryKey: [`/api/projects/${projectId}/analysis`],
  });

  // Fetch architecture data
  const { data: rawArchitecture, isLoading: isArchitectureLoading, error: architectureError } = useQuery({
    queryKey: [`/api/projects/${projectId}/architecture`],
  });

  // Parse project data
  const project = useMemo(() => {
    if (!rawProject) return null;
    
    return {
      ...rawProject,
      technologyStack: typeof rawProject.technologyStack === 'string' 
        ? JSON.parse(rawProject.technologyStack) 
        : rawProject.technologyStack
    };
  }, [rawProject]);

  // Parse analysis data
  const analysis = useMemo(() => {
    if (!rawAnalysis) return null;
    
    return {
      ...rawAnalysis,
      identifiedRequirements: typeof rawAnalysis.identifiedRequirements === 'string' 
        ? JSON.parse(rawAnalysis.identifiedRequirements) 
        : rawAnalysis.identifiedRequirements,
      suggestedTechStack: typeof rawAnalysis.suggestedTechStack === 'string' 
        ? JSON.parse(rawAnalysis.suggestedTechStack) 
        : rawAnalysis.suggestedTechStack,
      missingInformation: typeof rawAnalysis.missingInformation === 'string' 
        ? JSON.parse(rawAnalysis.missingInformation) 
        : rawAnalysis.missingInformation,
      nextSteps: typeof rawAnalysis.nextSteps === 'string' 
        ? JSON.parse(rawAnalysis.nextSteps) 
        : rawAnalysis.nextSteps
    };
  }, [rawAnalysis]);

  // Return default data if real data is loading or unavailable
  // This ensures the UI can render immediately
  const defaultProject: ProjectInfo = {
    id: projectId,
    name: 'BS County Values Application',
    description: 'County Tax Assessment SaaS Application',
    type: 'County Tax Assessment SaaS Application',
    targetPlatform: 'Web Application (Responsive)',
    technologyStack: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    status: 'requirements_gathering',
    overview: 'A comprehensive SaaS solution for county tax assessors to manage property values, assessments, and taxpayer information. The system will provide tools for data management, reporting, and integration with existing county systems.',
    progress: 15
  };

  const defaultAnalysis: Analysis = {
    id: 0,
    projectId,
    identifiedRequirements: [
      { name: 'Property data management', status: 'success' },
      { name: 'Regulatory compliance', status: 'success' },
      { name: 'Report generation', status: 'success' },
      { name: 'System integration', status: 'success' },
      { name: 'Authentication needs', status: 'warning' },
    ],
    suggestedTechStack: {
      frontend: { name: 'Frontend', description: 'React with Material UI' },
      backend: { name: 'Backend', description: 'Node.js with Express' },
      database: { name: 'Database', description: 'PostgreSQL with PostGIS' },
      hosting: { name: 'Hosting', description: 'AWS (Pending confirmation)' },
    },
    missingInformation: {
      items: [
        'Cloud hosting preferences',
        'Authentication requirements',
        'Data backup needs',
        'Mobile access requirements',
      ],
    },
    nextSteps: [
      { order: 1, description: 'Complete requirements gathering' },
      { order: 2, description: 'Finalize system architecture' },
      { order: 3, description: 'Define data models and relationships' },
      { order: 4, description: 'Create development plan and timeline' },
    ],
  };

  const defaultArchitecture: Architecture = {
    layers: []
  };

  return {
    project: project || defaultProject,
    analysis: analysis || defaultAnalysis,
    architecture: rawArchitecture || defaultArchitecture,
    isLoading: isProjectLoading || isAnalysisLoading || isArchitectureLoading,
    error: projectError || analysisError || architectureError,
  };
};
