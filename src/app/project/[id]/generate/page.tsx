'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

import { Project } from '@interface';

export default function GenerateVideo() {
  const router = useRouter();
  const pathname = usePathname();
  const projectId = pathname ? pathname.split('/')[2] : null; // Extraire l'ID du projet

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Générer la vidéo
              </h1>
              <p className="text-gray-600">
                Configurez les détails de votre vidéo avant de la générer
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Formulaire */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Détails de la vidéo
                </h2>

                {/* Titre */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de la vidéo
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Entrez le titre de votre vidéo"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez votre vidéo..."
                  />
                </div>

                {/* Upload de miniature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Miniature de la vidéo
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={isUploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {isUploading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Formats acceptés : JPG, PNG, WebP (max 5MB)
                  </p>
                </div>
              </div>

              {/* Aperçu */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Aperçu
                </h2>

                {/* Aperçu de la miniature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Miniature
                  </label>
                  <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt="Miniature de la vidéo"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-500 mt-2">Aucune miniature</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Aperçu du titre et description */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {title || 'Titre de la vidéo'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {description || 'Description de la vidéo'}
                  </p>
                </div>

                {/* Informations du projet */}
                {project && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Informations du projet</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>Clips dans la timeline : {project.timeline?.clips?.length || 0}</p>
                      <p>Durée estimée : {Math.round((project.timeline?.duration || 0) / 60)} minutes</p>
                      <p>Statut : {project.status || 'En attente'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {project?.timeline?.clips?.length === 0 && (
                <span className="text-red-500">
                  ⚠️ Aucun clip dans la timeline. Ajoutez du contenu avant de générer.
                </span>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={updateProjectMetadata}
                disabled={isGenerating}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Sauvegarder les modifications
              </button>
              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating || !project?.timeline?.clips?.length}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Génération en cours...
                  </>
                ) : (
                  'Générer la vidéo'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
