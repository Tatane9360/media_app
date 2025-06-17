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

export default function Home() {
  const router = useRouter();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les projets récents
  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const response = await fetch('/api/project');
        
        if (!response.ok) {
          // Si non connecté, ne pas afficher d'erreur sur la page d'accueil
          if (response.status === 401) {
            setRecentProjects([]);
            return;
          }
          throw new Error('Impossible de charger les projets');
        }
        
        const data = await response.json();
        // Prendre seulement les 3 projets les plus récents
        setRecentProjects((data.projects || []).slice(0, 3));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentProjects();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Application de Montage Vidéo Admin</h1>
        <p className="text-xl text-gray-600 mb-8">
          Importez, éditez, rendez et publiez vos vidéos facilement
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/project/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Créer un nouveau projet
          </Link>
          
          <Link
            href="/projects"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Voir tous les projets
          </Link>
        </div>
      </div>
      
      {!loading && recentProjects.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Projets récents</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <div key={project._id} className="border rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {project.description || 'Aucune description'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-4">
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
                    
                    <Link
                      href={`/project/${project._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Éditer
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-16 py-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center">Fonctionnalités principales</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Importation</h3>
            <p className="text-gray-600">
              Importez vos rushes vidéo facilement et organisez-les dans votre bibliothèque de médias.
            </p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Montage</h3>
            <p className="text-gray-600">
              Éditez vos vidéos avec notre interface intuitive et créez des montages professionnels.
            </p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Rendu</h3>
            <p className="text-gray-600">
              Rendez vos projets dans différents formats et résolutions selon vos besoins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
