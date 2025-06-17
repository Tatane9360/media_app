'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoUpload({ projectId = null }: { projectId?: string | null }) {
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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier vidéo');
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
        const uploadPromise = new Promise<any>((resolve, reject) => {
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
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Upload de Vidéos</h2>
      
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
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Sélectionner des fichiers vidéo
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileChange}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={uploading}
        />
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-2">Fichiers sélectionnés:</h3>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li key={index} className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                {uploadProgress[file.name] > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    ></div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className={`px-4 py-2 rounded font-bold ${
            uploading || selectedFiles.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          {uploading ? 'Upload en cours...' : 'Uploader'}
        </button>
      </div>
    </div>
  );
}
