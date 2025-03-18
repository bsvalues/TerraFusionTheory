import React from 'react';
import { ProjectInfo } from '@/types';
import { Badge } from '../ui/badge';

interface ProjectInfoCardProps {
  project: ProjectInfo;
}

const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({ project }) => {
  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Project Information</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">{project.name}</p>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Project Type</label>
            <div className="mt-1 text-sm text-gray-900">{project.type}</div>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Target Platform</label>
            <div className="mt-1 text-sm text-gray-900">{project.targetPlatform}</div>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Technology Stack</label>
            <div className="mt-1 text-sm text-gray-900">
              {project.technologyStack.map((tech, index) => (
                <Badge
                  key={index}
                  variant={
                    tech.toLowerCase().includes('react') ? 'info' :
                    tech.toLowerCase().includes('node') ? 'success' :
                    tech.toLowerCase().includes('postgre') ? 'purple' :
                    'warning'
                  }
                  className="mr-1"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Project Status</label>
            <div className="mt-1">
              <Badge variant="success">
                {project.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700">Project Overview</label>
            <div className="mt-1 text-sm text-gray-900">
              {project.overview}
            </div>
          </div>
          <div className="sm:col-span-6">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Progress</label>
              <span className="text-sm text-gray-500">{project.progress}%</span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoCard;
