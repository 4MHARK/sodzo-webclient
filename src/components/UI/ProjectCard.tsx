import React from 'react';
import { Calendar, Users, MoreVertical } from 'lucide-react';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{project.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{project.description}</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        </div>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{project.dueDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>{project.team.length}</span>
          </div>
        </div>
        
        <div className="flex -space-x-2">
          {project.team.slice(0, 3).map((member, index) => (
            <img
              key={member.id}
              src={member.avatar}
              alt={member.name}
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
              title={member.name}
            />
          ))}
          {project.team.length > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">+{project.team.length - 3}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}