'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VideoCard, ProjectCard, Button } from '@/components';
import { useVideosData, useProjectsData } from '@/hooks';

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
  description?: string;
  videoUrl?: string;
  thumbnailUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

type ProjectStatus = 'published' | 'draft';

const statusLabels: Record<ProjectStatus, string> = {
  published: 'Publiés',
  draft: 'Projects'
};

export default function ProjectList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProjectStatus>('published');
  
  // Hooks de cache pour les données
  const videosData = useVideosData();
  const projectsData = useProjectsData();
  
  // États locaux
  const [publishedVideos, setPublishedVideos] = useState<Video[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Charger la liste des projets
  useEffect(() => {
    const loadProjects = async () => {
      const result = await projectsData.fetchProjects();
      if (result) {
        setProjects(result.projects);
      }
    };
    
    loadProjects();
  }, [projectsData]);

  // Charger les vidéos publiées quand l'onglet "published" est actif
  useEffect(() => {
    const loadPublishedVideos = async () => {
      if (activeTab !== 'published') return;
      
      const result = await videosData.fetchVideos(currentPage, 12);
      if (result) {
        setPublishedVideos(result.videos);
        setPagination(result.pagination);
        
        // Précharger la page suivante si elle existe
        if (result.pagination.hasNext) {
          videosData.prefetchNextPage(currentPage, 12, true);
        }
      }
    };

    loadPublishedVideos();
  }, [activeTab, currentPage, videosData]);

  // États de chargement et d'erreur combinés
  const loading = projectsData.loading;
  const videosLoading = videosData.loading;
  const error = projectsData.error || videosData.error;

  // Filtrer les projets selon l'onglet actif
  const filteredProjects = activeTab === 'published' 
    ? projects.filter(project => project.status === 'published')
    : projects.filter(project => project.status !== 'published');

  // Compter les projets par catégorie
  const publishedCount = publishedVideos.length;
  const draftCount = projects.filter(project => project.status !== 'published').length;

  if (loading && projects.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-screen">
          <div className="text-2xl font-bold">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error && projects.length === 0 && publishedVideos.length === 0) {
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
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {publishedVideos.map((video) => (
                <VideoCard 
                  key={video.id}
                  video={video}
                />
              ))}
            </div>
            
            {/* Pagination pour les vidéos */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev || videosLoading}
                  className="px-4 py-2 bg-main text-background rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-main/90 transition-colors"
                >
                  Précédent
                </button>
                
                <span className="text-foreground">
                  Page {pagination.page} sur {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext || videosLoading}
                  className="px-4 py-2 bg-main text-background rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-main/90 transition-colors"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
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
