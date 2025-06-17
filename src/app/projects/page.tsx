'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Project {
  _id: string;
  title: string;
  description?: string;
  status: string;
  updatedAt: string;
}

export default function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des projets
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // Récupérer les projets
        const response = await fetch('/api/project');
        
        if (!response.ok) {
          throw new Error('Impossible de charger les projets');
        }
        
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-screen">
          <div className="text-2xl font-bold">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Erreur:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projets</h1>
        
        <button
          onClick={() => router.push('/project/new')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Nouveau projet
        </button>
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xl text-gray-600">Aucun projet trouvé</p>
          <p className="mt-2 text-gray-500">Créez un nouveau projet pour commencer</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project._id} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{project.description || 'Aucune description'}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-xs ${
                    project.status === 'draft' ? 'bg-gray-200' :
                    project.status === 'rendering' ? 'bg-yellow-200' :
                    project.status === 'completed' ? 'bg-green-200' :
                    'bg-gray-200'
                  }`}>
                    {project.status === 'draft' ? 'Brouillon' :
                     project.status === 'rendering' ? 'En cours de rendu' :
                     project.status === 'completed' ? 'Terminé' :
                     project.status}
                  </span>
                  
                  <span className="text-xs text-gray-500">
                    Mis à jour le {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <Link href={`/project/${project._id}`} className="text-blue-500 hover:underline">
                    Éditer
                  </Link>
                  
                  <div className="text-xs text-gray-500">
                    ID: {project._id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
