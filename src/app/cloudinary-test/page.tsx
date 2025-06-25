'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CloudinaryTest() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ url: string; thumbnailUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/video/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }
      
      const data = await response.json();
      setResult(data.videoAsset);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h1 className="text-2xl font-bold">Test d'upload Cloudinary</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Sélectionner une vidéo</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading}
          />
        </div>
        
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full py-2 px-4 rounded-md ${
            !file || uploading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          {uploading ? 'Upload en cours...' : 'Uploader vers Cloudinary'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="space-y-4">
          <div className="border rounded p-4 bg-gray-50">
            <h3 className="font-bold">Résultats de l'upload</h3>
            <p className="text-sm"><span className="font-medium">URL:</span> {result.url}</p>
            {result.thumbnailUrl && (
              <>
                <p className="text-sm mt-2"><span className="font-medium">Miniature:</span></p>
                <img 
                  src={result.thumbnailUrl} 
                  alt="Miniature" 
                  className="w-full h-auto mt-2 rounded"
                />
              </>
            )}
          </div>
          
          <div className="border rounded p-4">
            <h3 className="font-bold mb-2">Prévisualisation</h3>
            <video 
              src={result.url} 
              controls 
              className="w-full h-auto rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
