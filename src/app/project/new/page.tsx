'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { BackButton, VideoUpload, Button } from '@components';

export default function NewProject() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'description' && value.length > 1200) {
      return;
    }
    
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
      
      setCreatedProjectId(data.project._id);
      
      router.push(`/project/${data.project._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClick = () => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  return (
    <div className='mt-6 p-4'>
      <div className="max-w-2xl mx-auto flex flex-col gap-10">
        <div className='flex flex-col gap-4'>
          <BackButton variant='icon-only' />
          <h1 className="text-3xl font-bold">Nouveau Projet</h1>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Erreur:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="title">
                <h2>
                  Titre*
                </h2>
              </label>
              <input
                className="appearance-none rounded-xl w-full p-4 bg-foreground text-secondary leading-tight focus:outline-none focus:shadow-outline"
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Titre du projet"
                required
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className='flex justify-between' htmlFor="description">
                <h2>
                  Description
                </h2>
                <div className="flex justify-end mt-1">
                  <span className={`text-xs ${
                    formData.description.length > 1100 
                      ? 'text-red-500' 
                      : 'text-foreground'
                  }`}>
                    {formData.description.length}/1200
                  </span>
                </div>
              </label>
              <div className="relative">
                <textarea
                  className="appearance-none rounded-xl w-full p-4 bg-foreground text-secondary leading-tight focus:outline-none focus:shadow-outline"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description du projet"
                  rows={4}
                  maxLength={1200}
                />
              </div>
            </div>

            <VideoUpload projectId={createdProjectId} />
            
            <div className="flex justify-between gap-4">
              <Button
                variant="primary"
                onClick={handleSubmitClick}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Création en cours...' : 'Enregistrer'}
              </Button>
              <Button
                variant="white"
                onClick={() => router.push('/projects')}
                disabled={loading}
                className="w-full"
              >
                Annuler
              </Button>
            </div>
          </form>
      </div>
    </div>
  );
}
