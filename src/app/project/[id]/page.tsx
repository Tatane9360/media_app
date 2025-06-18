'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TimelineEditor, VideoUpload } from '@/components';
import { Project, Timeline, VideoAsset, Clip } from '@/interface';

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

  const [showUploadModal, setShowUploadModal] = useState(false);
  
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
        
        // Récupérer les assets vidéo
        const assetsResponse = await fetch('/api/video/assets');
        if (!assetsResponse.ok) {
          throw new Error('Impossible de charger les assets vidéo');
        }
        
        const assetsData = await assetsResponse.json();
        const assets = assetsData.videoAssets;
        
        // Pré-associer les assets aux clips de la timeline si nécessaire
        if (data.project && data.project.timeline && data.project.timeline.clips) {
          const assetsMap = new Map();
          
          // Créer un map pour un accès rapide
          assets.forEach(asset => {
            const assetId = asset._id?.toString() || asset.id?.toString();
            if (assetId) {
              assetsMap.set(assetId, asset);
            }
          });
          
          // Associer les assets aux clips et s'assurer qu'ils ont tous un id
          data.project.timeline.clips = data.project.timeline.clips.map((clip: Clip, index: number) => {
            // Créer une copie du clip pour éviter de modifier l'original directement
            const updatedClip = { ...clip };
            
            // S'assurer que chaque clip a un id
            if (!updatedClip.id && updatedClip._id) {
              updatedClip.id = updatedClip._id.toString();
            } else if (!updatedClip.id && !updatedClip._id) {
              // Si aucun id n'est présent, en générer un
              updatedClip.id = `clip-${Date.now()}-${index}`;
            }
            
            // Associer l'asset si nécessaire
            if (!updatedClip.asset && updatedClip.assetId) {
              const assetId = updatedClip.assetId.toString();
              const asset = assetsMap.get(assetId);
              if (asset) {
                return { ...updatedClip, asset };
              }
            }
            return updatedClip;
          });
          
          console.log("Clips après association:", data.project.timeline.clips.length);
          console.log("Exemple de clip:", data.project.timeline.clips[0]);
        }
        
        setProject(data.project);
        setVideoAssets(assets);
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
            onClick={() => setShowUploadModal(!showUploadModal)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Ajouter des vidéos
          </button>
          
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
      
      {/* Modal d'upload de vidéos */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Ajouter des vidéos</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <VideoUpload projectId={projectId} />
            </div>
            <div className="p-4 border-t flex justify-end">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
