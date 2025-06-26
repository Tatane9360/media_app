'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { Project } from '@interface';

export default function RenderStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const projectId = pathname ? pathname.split('/')[2] : null;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/project/${projectId}`);
        if (!response.ok) {
          throw new Error('Impossible de charger le projet');
        }
        
        const data = await response.json();
        setProject(data.project);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();

    // Polling pour mettre à jour le statut toutes les 3 secondes
    const interval = setInterval(fetchProject, 3000);

    return () => clearInterval(interval);
  }, [projectId]);

  // Rediriger vers les vidéos quand le rendu est terminé
  useEffect(() => {
    if (project?.status === 'completed' && project.publishedUrl) {
      // Redirection automatique après 2 secondes
      const timer = setTimeout(() => {
        router.push('/videos');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [project, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rendering': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'rendering': return 'Génération en cours';
      case 'completed': return 'Génération terminée';
      case 'error': return 'Erreur de génération';
      default: return 'En attente';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du statut...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur</h2>
          <p className="text-red-600 mb-4">{error || 'Projet non trouvé'}</p>
          <button
            onClick={() => router.push('/projects')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retour aux projets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* En-tête */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Génération de la vidéo
            </h1>
            <p className="text-gray-600">{project.title}</p>
          </div>

          {/* Statut */}
          <div className="p-6">
            <div className="text-center">
              {/* Statut actuel */}
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6 ${getStatusColor(project.status)}`}>
                {project.status === 'rendering' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                )}
                {getStatusText(project.status)}
              </div>

              {/* Barre de progression */}
              {project.status === 'rendering' && (
                <div className="mb-6">
                  <div className="bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${project.renderProgress || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Progression : {project.renderProgress || 0}%
                  </p>
                </div>
              )}

              {/* Messages selon le statut */}
              {project.status === 'rendering' && (
                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-2">
                    Votre vidéo est en cours de génération...
                  </p>
                  <p className="text-sm text-gray-500">
                    Cela peut prendre quelques minutes selon la complexité de votre projet.
                  </p>
                </div>
              )}

              {project.status === 'completed' && (
                <div className="text-center mb-6">
                  <div className="mb-4">
                    <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Vidéo générée avec succès !
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Votre vidéo est maintenant disponible dans votre bibliothèque.
                  </p>
                  <p className="text-sm text-gray-500">
                    Redirection automatique dans quelques secondes...
                  </p>
                </div>
              )}

              {project.status === 'error' && (
                <div className="text-center mb-6">
                  <div className="mb-4">
                    <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Erreur lors de la génération
                  </h3>
                  {project.renderError && (
                    <p className="text-red-600 mb-4">{project.renderError}</p>
                  )}
                  <p className="text-gray-600">
                    Une erreur s&apos;est produite lors de la génération de votre vidéo.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center space-x-4">
                {project.status === 'completed' && project.publishedUrl && (
                  <>
                    <button
                      onClick={() => router.push('/videos')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Voir mes vidéos
                    </button>
                    <a
                      href={project.publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Voir la vidéo
                    </a>
                  </>
                )}

                {project.status === 'error' && (
                  <>
                    <button
                      onClick={() => router.push(`/project/${projectId}/generate`)}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Réessayer
                    </button>
                    <button
                      onClick={() => router.push(`/project/${projectId}`)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Retour au projet
                    </button>
                  </>
                )}

                {project.status === 'rendering' && (
                  <button
                    onClick={() => router.push('/projects')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Retour aux projets
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Informations du projet */}
          <div className="bg-gray-50 px-6 py-4">
            <h4 className="font-medium text-gray-900 mb-2">Détails du projet</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Clips : {project.timeline?.clips?.length || 0}</p>
              <p>Durée : {Math.round((project.timeline?.duration || 0) / 60)} minutes</p>
              <p>Format : {project.renderSettings?.format?.toUpperCase() || 'MP4'}</p>
              <p>Qualité : {project.renderSettings?.quality || 'medium'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
