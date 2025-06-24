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

type ProjectStatus = 'published' | 'draft';

const statusLabels: Record<ProjectStatus, string> = {
  published: 'Publiés',
  draft: 'Brouillons'
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-800',
  rendering: 'bg-yellow-200 text-yellow-800',
  completed: 'bg-green-200 text-green-800',
  published: 'bg-blue-200 text-blue-800',
  error: 'bg-red-200 text-red-800'
};

export default function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectStatus>('published');

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

  // Filtrer les projets selon l'onglet actif
  const filteredProjects = activeTab === 'published' 
    ? projects.filter(project => project.status === 'published')
    : projects.filter(project => project.status !== 'published');

  // Compter les projets par catégorie
  const publishedCount = projects.filter(project => project.status === 'published').length;
  const draftCount = projects.filter(project => project.status !== 'published').length;

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
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Nouveau projet
        </button>
      </div>
      
      {/* Onglets de filtrage */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(Object.keys(statusLabels) as ProjectStatus[]).map((status) => {
              const count = status === 'published' ? publishedCount : draftCount;
              return (
                <button
                  key={status}
                  onClick={() => setActiveTab(status)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === status
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {statusLabels[status]}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {filteredProjects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xl text-gray-600">
            {`Aucun projet ${statusLabels[activeTab].toLowerCase()}`}
          </p>
          <p className="mt-2 text-gray-500">
            {activeTab === 'draft' 
              ? 'Créez un nouveau projet pour commencer' 
              : 'Aucun projet publié pour le moment'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div key={project._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{project.description || 'Aucune description'}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[project.status] || 'bg-gray-200 text-gray-800'
                  }`}>
                    {project.status === 'draft' ? 'Brouillon' :
                     project.status === 'rendering' ? 'En cours de rendu' :
                     project.status === 'completed' ? 'Terminé' :
                     project.status === 'published' ? 'Publié' :
                     project.status === 'error' ? 'Erreur' :
                     project.status}
                  </span>
                  
                  <span className="text-xs text-gray-500">
                    Mis à jour le {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <Link 
                    href={`/project/${project._id}`} 
                    className="text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                  >
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
