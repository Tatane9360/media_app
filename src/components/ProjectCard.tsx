import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { BackButton } from '@components';

interface Project {
  _id: string;
  title: string;
  description?: string;
  status: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

interface ProjectCardProps {
  project: Project;
  className?: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-800',
  rendering: 'bg-yellow-200 text-yellow-800',
  completed: 'bg-green-200 text-green-800',
  published: 'bg-blue-200 text-blue-800',
  error: 'bg-red-200 text-red-800'
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'draft': return 'Brouillon';
    case 'rendering': return 'En cours de rendu';
    case 'completed': return 'Terminé';
    case 'published': return 'Publié';
    case 'error': return 'Erreur';
    default: return status;
  }
};

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  className = '',
}) => {
  // Utilise une image placeholder si pas de thumbnail
  const thumbnailUrl = project.thumbnailUrl || '/placeholders/video-placeholder.svg';

  return (
    <div className={`group ${className}`}>
      <Link href={`/project/${project._id}`}>
        <div className="flex flex-col gap-3">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-4xl overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt={project.title}
              fill
              className="object-cover"
              sizes="100vw"
            />

            {/* Status badge overlay */}
            <div className="absolute top-3 left-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusColors[project.status] || 'bg-gray-200 text-gray-800'
              }`}>
                {getStatusLabel(project.status)}
              </span>
            </div>

            <BackButton 
              variant='icon-only' 
              href={`/project/${project._id}`} 
              className='rotate-180 absolute bottom-3 right-3' 
            />
          </div>
          
          {/* Title and description below thumbnail */}
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-bold uppercase tracking-wide">
              {project.title}
            </h3>
            {project.description && (
              <p className="text-sm text-foreground/70 line-clamp-1">
                {project.description}
              </p>
            )}
            <span className="text-xs text-foreground/50 mt-1">
              Mis à jour le {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProjectCard;
