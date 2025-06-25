'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VideoCard, ProjectCard, Button } from '@/components';

interface Project {
  _id: string;
  title: string;
  description?: string;
  status: string;
  updatedAt: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
}

type ProjectStatus = 'published' | 'draft';

const statusLabels: Record<ProjectStatus, string> = {
  published: 'Publiés',
  draft: 'Projects'
};

export default function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [publishedVideos, setPublishedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectStatus>('published');

  // Charger la liste des projets
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // Récupérer les projets
        const response = await fetch('/api/project');
        
        if (!response.ok) {
          throw new Error('Impossible de charger les projets');
        }
        
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  // Charger les vidéos publiées quand l'onglet "published" est actif
  useEffect(() => {
    const fetchPublishedVideos = async () => {
      if (activeTab !== 'published') return;
      
      try {
        setVideosLoading(true);
        const response = await fetch('/api/videos?limit=50'); // Récupérer plus de vidéos
        
        if (response.ok) {
          const data = await response.json();
          setPublishedVideos(data.data.videos || []);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des vidéos:', err);
      } finally {
        setVideosLoading(false);
      }
    };

    fetchPublishedVideos();
  }, [activeTab]);

  // Filtrer les projets selon l'onglet actif
  const filteredProjects = activeTab === 'published' 
    ? projects.filter(project => project.status === 'published')
    : projects.filter(project => project.status !== 'published');

  // Compter les projets par catégorie
  const publishedCount = publishedVideos.length; // Compter les vidéos publiées, pas les projets
  const draftCount = projects.filter(project => project.status !== 'published').length;

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-screen">
          <div className="text-2xl font-bold">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Erreur:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Videos</h1>
        
        <Button onClick={() => router.push('/project/new')}>Nouveau projet</Button>
      </div>
      
      {/* Onglets de filtrage */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(Object.keys(statusLabels) as ProjectStatus[]).map((status) => {
              const count = status === 'published' ? publishedCount : draftCount;
              return (
                <button
                  key={status}
                  onClick={() => setActiveTab(status)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === status
                      ? 'border-main text-main'
                      : 'border-transparent text-foreground hover:text-foreground/80 hover:border-main/50'
                  }`}
                >
                  {statusLabels[status]}
                  <span className="ml-2 bg-foreground text-background py-0.5 px-2 rounded-full text-xs">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {activeTab === 'published' ? (
        // Affichage des vidéos publiées
        videosLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg text-gray-600">Chargement des vidéos...</div>
          </div>
        ) : publishedVideos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xl text-gray-600">Aucune vidéo publiée</p>
            <p className="mt-2 text-gray-500">
              Les vidéos publiées apparaîtront ici une fois que vous aurez terminé et publié vos projets.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {publishedVideos.map((video) => (
              <VideoCard 
                key={video.id}
                video={video}
              />
            ))}
          </div>
        )
      ) : (
        // Affichage des projets brouillons
        filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xl text-gray-600">Aucun projet en brouillon</p>
            <p className="mt-2 text-gray-500">
              Créez un nouveau projet pour commencer
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project._id}
                project={project}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
