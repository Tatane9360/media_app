'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

import { CloudinaryImage, VideoThumbnail } from '@components';

export default function AdminUpload() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploadedAssets, setUploadedAssets] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestion de la sélection de fichiers
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Vérifier si ce sont des fichiers vidéo
      const videoFiles = selectedFiles.filter(file => file.type.startsWith('video/'));
      
      if (videoFiles.length !== selectedFiles.length) {
        setError('Certains fichiers sélectionnés ne sont pas des vidéos');
      }
      
      setFiles(prevFiles => [...prevFiles, ...videoFiles]);
    }
  };

  // Télécharger des fichiers depuis l'appareil photo
  const handleCaptureVideo = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Supprimer un fichier de la liste
  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Télécharger les fichiers vers le serveur
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Veuillez sélectionner au moins un fichier vidéo');
      return;
    }

    setUploading(true);
    setError(null);
    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Initialiser la progression
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Créer FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // Simuler une progression (dans une vraie application, utiliser XMLHttpRequest)
        const updateProgress = (progress: number) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        };
        
        // Simuler des mises à jour de progression
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[file.name] || 0;
            return { ...prev, [file.name]: Math.min(current + 10, 90) };
          });
        }, 500);
        
        // Envoyer le fichier
        const response = await fetch('/api/video/upload', {
          method: 'POST',
          body: formData
        });
        
        clearInterval(interval);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors du téléchargement');
        }
        
        // Mise à jour finale de la progression
        updateProgress(100);
        
        const data = await response.json();
        uploaded.push(data.videoAsset);
      } catch (err) {
        setError(`Erreur lors du téléchargement de ${file.name}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        
        // Mettre à jour la progression en cas d'erreur
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
      }
    }
    
    setUploadedAssets(uploaded);
    setUploading(false);
  };

  // Créer un nouveau projet avec les vidéos téléchargées
  const handleCreateProject = async () => {
    if (uploadedAssets.length === 0) {
      setError('Aucun asset vidéo disponible');
      return;
    }
    
    try {
      const response = await fetch('/api/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Nouveau projet ${new Date().toLocaleDateString()}`,
          videoAssets: uploadedAssets.map(asset => asset.id),
          timeline: {
            duration: 0,
            clips: [],
            audioTracks: []
          }
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création du projet');
      }
      
      const data = await response.json();
      
      // Rediriger vers le projet créé
      router.push(`/project/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du projet');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Importer des vidéos</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong className="font-bold">Erreur:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
            onClick={handleCaptureVideo}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              onChange={handleFileChange}
              multiple
              className="hidden"
              capture="environment"
            />
            
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              
              <p className="text-lg font-medium mb-2">
                Glissez-déposez des fichiers vidéo ou cliquez pour en sélectionner
              </p>
              
              <p className="text-sm text-gray-500">
                Formats supportés: MP4, MOV, AVI, WebM
              </p>
            </div>
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Fichiers sélectionnés</h2>
            
            <div className="space-y-4">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{file.name}</p>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={uploading}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    
                    {uploadProgress[file.name] !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              uploadProgress[file.name] === -1
                                ? 'bg-red-600'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.max(0, uploadProgress[file.name])}%` }}
                          ></div>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadProgress[file.name] === -1
                            ? 'Échec'
                            : uploadProgress[file.name] === 100
                            ? 'Terminé'
                            : `${uploadProgress[file.name]}%`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex space-x-4">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className={`px-6 py-3 rounded-lg font-medium ${
              files.length === 0 || uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Téléchargement en cours...' : 'Télécharger les vidéos'}
          </button>
          
          <button
            onClick={() => router.push('/admin/dashboard')}
            disabled={uploading}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          >
            Annuler
          </button>
        </div>
      </div>
      
      {uploadedAssets.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Vidéos téléchargées</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {uploadedAssets.map((asset) => (
              <div key={asset.id} className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-200 relative">
                  {asset.metadata.thumbnailUrl ? (
                    <CloudinaryImage
                      src={asset.metadata.thumbnailUrl}
                      alt={asset.originalName}
                      width={320}
                      height={180}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <VideoThumbnail
                      videoUrl={asset.storageUrl}
                      alt={asset.originalName}
                      width={320}
                      height={180}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                <div className="p-3">
                  <p className="font-medium truncate">{asset.originalName}</p>
                  <p className="text-sm text-gray-500">
                    {(asset.fileSize / (1024 * 1024)).toFixed(2)} MB • {formatDuration(asset.duration)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleCreateProject}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Créer un nouveau projet
            </button>
            
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Formater la durée en minutes:secondes
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
