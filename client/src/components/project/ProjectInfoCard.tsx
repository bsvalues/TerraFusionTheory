import React from 'react';
import { ProjectInfo, BadgeWithProgress } from '@/types';
import { Badge } from '../ui/badge';
import UserBadges from '../badges/UserBadges';
import { useBadges } from '@/hooks/useBadges';

interface ProjectInfoCardProps {
  project: ProjectInfo;
  userId?: number;
}

const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({ project, userId = 1 }) => {
  const { badges, isLoading } = useBadges(userId, project.id);
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
              {Array.isArray(project.technologyStack) ? project.technologyStack.map((tech, index) => (
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
              )) : null}
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
          
          <div className="sm:col-span-6 mt-4">
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Earned Badges</label>
              {isLoading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <UserBadges badges={badges} showProgress={true} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoCard;
