'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function MediaUpload({ projectId = null }: { projectId?: string | null }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      
      // Réinitialiser les états
      setError(null);
      setSuccess(null);
      setUploadProgress({});
    }
  };

  const getFileType = (file: File): 'video' | 'audio' => {
    return file.type.startsWith('video/') ? 'video' : 'audio';
  };

  const getFileIcon = (file: File): string => {
    const type = getFileType(file);
    return type === 'video' ? '🎬' : '🎵';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier vidéo ou audio');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    // Initialiser le progrès d'upload pour chaque fichier
    const initialProgress = selectedFiles.reduce((acc, file) => {
      acc[file.name] = 0;
      return acc;
    }, {} as { [key: string]: number });
    
    setUploadProgress(initialProgress);

    try {
      const uploadedAssets = [];

      // Upload chaque fichier séquentiellement
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        if (projectId) {
          formData.append('projectId', projectId);
        }

        const xhr = new XMLHttpRequest();
        
        // Créer une promesse pour gérer l'upload avec XMLHttpRequest
        const uploadPromise = new Promise<unknown>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: progress
              }));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response.videoAsset);
              } catch (e) {
                reject(new Error(`Erreur lors du parsing de la réponse ${e}`));
              }
            } else {
              reject(new Error(`Erreur ${xhr.status}: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Erreur réseau lors de l\'upload'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload annulé'));
          });

          xhr.open('POST', '/api/video/upload', true);
          xhr.send(formData);
        });

        try {
          const asset = await uploadPromise;
          uploadedAssets.push(asset);
        } catch (err) {
          throw err;
        }
      }

      setSuccess(`${uploadedAssets.length} fichier(s) uploadé(s) avec succès`);
      setSelectedFiles([]);
      
      // Rediriger vers la page du projet si un ID est fourni
      if (projectId) {
        router.push(`/project/${projectId}`);
      }
      
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-foreground rounded-xl p-4 flex flex-col justify-between">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Erreur:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Succès:</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        <h2 className="text-background">
          Sélectionner des fichiers
        </h2>
        <div className="text-background text-xs opacity-75 mb-2">
          Formats supportés : Vidéo (MP4, AVI, MOV, etc.) • Audio (MP3, WAV, AAC, etc.)
        </div>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <button
            type="button"
            className="bg-secondary text-foreground px-4 py-2 rounded-md font-medium hover:bg-secondary/90 transition-colors"
            disabled={uploading}
          >
            Sélectionner des fichiers
          </button>
        </div>
        
        <div className="text-background text-sm">
          {selectedFiles.length === 0 ? (
            <p>Aucun fichier</p>
          ) : (
            <div className="flex flex-col gap-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm">{getFileIcon(file)}</span>
                    <span className="truncate">{file.name}</span>
                    <span className="text-xs text-background/50 bg-background/10 px-2 py-1 rounded">
                      {getFileType(file)}
                    </span>
                  </div>
                  <span className="text-xs text-background/70">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {selectedFiles.length > 0 && uploadProgress && Object.keys(uploadProgress).length > 0 && (
        <div className="mb-4">
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              uploadProgress[file.name] > 0 && (
                <div key={index} className="text-background">
                  <div className="flex justify-between text-xs mb-1">
                    <div className="flex items-center gap-1">
                      <span>{getFileIcon(file)}</span>
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span>{uploadProgress[file.name]}%</span>
                  </div>
                  <div className="w-full bg-background/20 rounded-full h-2">
                    <div 
                      className="bg-main h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    />
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className={`px-7 py-2 rounded font-bold ${
            uploading || selectedFiles.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-main hover:bg-main/90 text-foreground'
          }`}
        >
          {uploading ? 'import en cours...' : 'IMPORTER'}
        </button>
      </div>
    </div>
  );
}
