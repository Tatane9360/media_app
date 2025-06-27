'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { Project } from '@interface';
import { VideoCard, BackButton, Button } from '@components';

export default function GenerateVideo() {
  const router = useRouter();
  const pathname = usePathname();
  const projectId = pathname ? pathname.split('/')[2] : null;

  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données du projet
  useEffect(() => {
    if (!projectId) return;
    
    const fetchProject = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/project/${projectId}`);
        if (!response.ok) {
          throw new Error('Impossible de charger le projet');
        }
        
        const data = await response.json();
        setProject(data.project);
        setTitle(data.project.title || '');
        setDescription(data.project.description || '');
        setThumbnailUrl(data.project.thumbnailUrl || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);

  // Upload de miniature vers l'API
  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload de l\'image');
      }

      const data = await response.json();
      setThumbnailUrl(data.url);
    } catch (err) {
      console.error('Erreur upload miniature:', err);
      setError(err instanceof Error ? err.message : 'Erreur d\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  // Mettre à jour les métadonnées du projet
  const updateProjectMetadata = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/project/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          thumbnailUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur de mise à jour');
    }
  };

  // Générer la vidéo
  const handleGenerateVideo = async () => {
    if (!project || !projectId) return;

    try {
      setIsGenerating(true);
      setError(null);

      // Mettre à jour les métadonnées avant de générer
      await updateProjectMetadata();

      // Lancer le rendu
      const response = await fetch(`/api/project/${projectId}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          renderSettings: project.renderSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du démarrage du rendu');
      }

      // Rediriger vers la page de statut
      router.push(`/project/${projectId}/status`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        {/* En-tête */}
        <div className="flex flex-col gap-5">
          <BackButton variant="icon-only" />
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground">
              Générer la vidéo
            </h1>
            <p className="text-foreground">
              Configurez les détails de votre vidéo avant de la générer
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Titre */}
        <div className="flex flex-col gap-2">
          <label htmlFor="title">
            <h2>
              Titre de la vidéo*
            </h2>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="appearance-none rounded-xl w-full p-4 bg-foreground text-secondary leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Entrez le titre de votre vidéo"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className='flex justify-between' htmlFor="description">
            <h2>
              Description
            </h2>
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${
                description.length > 1100 
                  ? 'text-red-500' 
                  : 'text-foreground'
              }`}>
                {description.length}/1200
              </span>
            </div>
          </label>
          <div className="relative">
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 1200) {
                  setDescription(e.target.value);
                }
              }}
              rows={4}
              className="appearance-none rounded-xl w-full p-4 bg-foreground text-secondary leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Décrivez votre vidéo..."
              maxLength={1200}
            />
          </div>
        </div>

        {/* Upload de miniature */}
        <div className="flex flex-col gap-3">
          <h2 className="text-foreground">
            Miniature de la vidéo
          </h2>
          <div className="bg-foreground rounded-xl p-4 flex flex-col gap-3">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button
                type="button"
                className="bg-secondary text-foreground px-4 py-2 rounded-md font-medium hover:bg-secondary/90 transition-colors"
                disabled={isUploading}
              >
                Sélectionner des fichiers
              </button>
            </div>
            
            <div className="text-background text-sm">
              {!thumbnailUrl ? (
                <p>Aucun fichier</p>
              ) : (
                <p>Image sélectionnée</p>
              )}
            </div>
          </div>
          
          <p className="text-foreground/70 text-xs">
            Formats acceptés : JPG, PNG, WebP (max 5MB)
          </p>
        </div>

        {/* Aperçu avec VideoCard */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-foreground">
            Aperçu
          </h2>
          
          <div className="max-w-md">
            <VideoCard
              video={{
                id: projectId || '',
                title: title || 'Titre de la vidéo',
                description: description || 'Description de la vidéo',
                thumbnailUrl: thumbnailUrl || '/placeholders/video-placeholder.svg',
              }}
            />
          </div>
        </div>

        <div className="w-full flex justify-between gap-4">
          <Button
            variant="primary"
            onClick={handleGenerateVideo}
            disabled={isGenerating || !project?.timeline?.clips?.length}
            className='w-full'
            >
            {isGenerating ? 'Chargement...' : 'Publier'}
          </Button>
          <Button
            variant="white"
            onClick={updateProjectMetadata}
            disabled={isGenerating}
            className='w-full'
            >
            Brouillon
          </Button>
        </div>
      </div>
    </>
  );
}
