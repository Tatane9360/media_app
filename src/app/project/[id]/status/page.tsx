'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { Project } from '@interface';
import { Button } from '@components';

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

    const interval = setInterval(fetchProject, 3000);

    return () => clearInterval(interval);
  }, [projectId]);

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
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto mt-12">
        <div className='flex flex-col gap-20'>
          {/* En-tête */}
          <h1 className="text-foreground uppercase">
            Génération de la vidéo
          </h1>

          {/* Statut */}
          <div className="flex flex-col items-center justify-center px-8">
            <div className="flex flex-col w-full items-center gap-5">
              <h2 className='text-center'>
                {getStatusText(project.status)}
              </h2>

              {/* Barre de progression */}
              {project.status === 'rendering' && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="bg-gray-200 rounded-full h-4 w-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${project.renderProgress || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-foreground">
                    Progression : {project.renderProgress || 0}%
                  </p>
                </div>
              )}

              {/* Messages selon le statut */}
              {project.status === 'rendering' && (
                <div className="flex flex-col gap-2 text-center">
                  <p className="text-foreground">
                    Votre vidéo est en cours de génération...
                  </p>
                  <p className="text-sm text-foreground italic">
                    Cela peut prendre quelques minutes selon la complexité de votre projet.
                  </p>
                </div>
              )}

              {project.status === 'completed' && (
                <div className="text-center mb-6">
                  <div className="mb-4">
                    <svg className="mx-auto h-16 w-16 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Vidéo générée avec succès !
                  </h3>
                  <p className="text-foreground mb-4">
                    Votre vidéo est maintenant disponible dans votre bibliothèque.
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Erreur lors de la génération
                  </h3>
                  {project.renderError && (
                    <p className="text-red-600 mb-4">{project.renderError}</p>
                  )}
                  <p className="text-foreground">
                    Une erreur s&apos;est produite lors de la génération de votre vidéo.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center space-x-4">
                {project.status === 'completed' && project.publishedUrl && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => router.push('/videos')}
                      className='w-full'
                      >
                      Voir mes vidéos
                    </Button>
                    <Button
                      variant="white"
                      onClick={() => project.publishedUrl && router.push(project.publishedUrl)}
                      className='w-full'
                    >
                      Voir la vidéo
                    </Button>
                  </>
                )}

                {project.status === 'error' && (
                  <>
                    <Button 
                      variant="primary"
                      onClick={() => router.push(`/project/${projectId}/generate`)}
                      className='w-full'
                      >
                      Réessayer
                    </Button>
                    <Button
                      variant="white"
                      onClick={() => router.push(`/project/${projectId}`)}
                      className='w-full'
                      >
                      Retour au projet
                    </Button>
                  </>
                )}

                {project.status === 'rendering' && (
                  <Button
                    variant='white'
                    onClick={() => router.push('/projects')}
                  >
                    Retour aux projets
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
