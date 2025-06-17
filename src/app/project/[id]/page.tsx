'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TimelineEditor } from '@/components';
import { Project, Timeline, VideoAsset } from '@/interface';

export default function ProjectEdit() {
  const router = useRouter();
  const pathname = usePathname();
  // Extraire l'ID du projet depuis le chemin d'URL au lieu de params
  const projectId = pathname ? pathname.split('/').pop() : null;
  const [project, setProject] = useState<Project | null>(null);
  const [videoAssets, setVideoAssets] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les données du projet
  useEffect(() => {
    if (!projectId) return;
    
    // Vérifier si l'ID est un ID MongoDB valide (24 caractères hexadécimaux)
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(projectId);
    
    if (!isValidMongoId) {
      setError('ID de projet non valide. L\'ID doit être au format MongoDB ObjectId.');
      setLoading(false);
      return;
    }
    
    const fetchProject = async () => {
      try {
        setLoading(true);
        
        // Récupérer le projet
        const response = await fetch(`/api/project/${projectId}`);
        if (!response.ok) {
          throw new Error('Impossible de charger le projet');
        }
        
        const data = await response.json();
        setProject(data.project);
        
        // Récupérer les assets vidéo
        const assetsResponse = await fetch('/api/video/assets');
        if (!assetsResponse.ok) {
          throw new Error('Impossible de charger les assets vidéo');
        }
        
        const assetsData = await assetsResponse.json();
        setVideoAssets(assetsData.videoAssets);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);
  
  // Mettre à jour la timeline du projet
  const handleTimelineChange = async (newTimeline: Timeline) => {
    if (!project || !projectId) return;
    
    try {
      setSaving(true);
      
      const updatedProject = {
        ...project,
        timeline: newTimeline
      };
      
      setProject(updatedProject);
      
      // Sauvegarder en arrière-plan
      const response = await fetch(`/api/project/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeline: newTimeline
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };
  
  // Lancer le rendu de la vidéo
  const handleRenderVideo = async () => {
    if (!project || !projectId) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/project/${projectId}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          renderSettings: project.renderSettings
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du démarrage du rendu');
      }
      
      // Rediriger vers la page de statut du rendu
      router.push(`/project/${projectId}/status`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rendu');
      setLoading(false);
    }
  };
  
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
        <button
          onClick={() => router.back()}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
        >
          Retour
        </button>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-xl">Projet non trouvé</div>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Édition: {project.title}
        </h1>
        
        <div className="flex space-x-4">
          {saving && (
            <span className="text-gray-500">Sauvegarde en cours...</span>
          )}
          
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Retour
          </button>
          
          <button
            onClick={handleRenderVideo}
            className="bg-green-600 text-white px-4 py-2 rounded"
            disabled={loading || project.timeline.clips.length === 0}
          >
            Générer la vidéo
          </button>
        </div>
      </div>
      
      <div className="bg-gray-100 rounded-lg overflow-hidden">
        {/* Éditeur de timeline */}
        <TimelineEditor
          timeline={project.timeline}
          videoAssets={videoAssets}
          onChange={handleTimelineChange}
        />
      </div>
    </div>
  );
}
