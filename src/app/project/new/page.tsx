'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoUpload } from '@/components';

export default function NewProject() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Le titre du projet est requis');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création du projet');
      }
      
      const data = await response.json();
      
      // Stocker l'ID du projet créé et afficher l'upload de vidéos
      setCreatedProjectId(data.project._id);
      setShowVideoUpload(true);
      
      // Ne pas rediriger immédiatement pour permettre l'upload de vidéos
      // router.push(`/project/${data.project._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Nouveau Projet</h1>
          
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Retour
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Erreur:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        
        {!showVideoUpload ? (
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Titre *
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Titre du projet"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description du projet"
                rows={4}
              />
            </div>
            
            <div className="flex items-center justify-end">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Création en cours...' : 'Créer le projet'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <strong className="font-bold">Projet créé avec succès!</strong>
              <p className="mt-2">Vous pouvez maintenant ajouter des vidéos à votre projet.</p>
            </div>
            
            <VideoUpload projectId={createdProjectId} />
            
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => router.push('/projects')}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Voir tous les projets
              </button>
              
              <button
                onClick={() => createdProjectId && router.push(`/project/${createdProjectId}`)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Aller à l'éditeur de projet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
