import React, { useRef, useEffect, useState } from 'react';
import { Clip, AudioTrack } from '@/interface/iProject';

interface VideoPreviewProps {
  clips: Clip[];
  audioTracks: AudioTrack[];
  currentTime: number;
  playing: boolean;
  onTimeUpdate: (time: number) => void;
  onEnded: () => void;
}

/**
 * Composant de prévisualisation vidéo
 * Affiche la vidéo active en fonction de la position temporelle actuelle
 */
const VideoPreview: React.FC<VideoPreviewProps> = ({
  clips,
  audioTracks,
  currentTime,
  playing,
  onTimeUpdate,
  onEnded
}) => {
  // Référence vers l'élément vidéo
  const videoRef = useRef<HTMLVideoElement>(null);
  // Référence pour les éléments audio
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  // État pour suivre le clip actif
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  // État pour suivre les pistes audio actives
  const [activeAudioTracks, setActiveAudioTracks] = useState<AudioTrack[]>([]);
  // État pour gérer les erreurs de chargement
  const [error, setError] = useState<string | null>(null);
  // État pour suivre si la vidéo est prête
  const [isReady, setIsReady] = useState(false);
  
  // Trouver le clip actif en fonction du temps actuel
  useEffect(() => {
    // Chercher le clip qui contient le temps actuel
    const clip = clips.find(
      c => currentTime >= c.startTime && currentTime < c.endTime
    );
    
    if (clip !== activeClip) {
      setActiveClip(clip || null);
      setIsReady(false);
    }
    
    // Chercher les pistes audio actives au temps actuel
    const activeTracks = audioTracks.filter(
      track => currentTime >= track.startTime && currentTime < track.endTime
    );
    
    setActiveAudioTracks(activeTracks);
  }, [clips, audioTracks, currentTime, activeClip]);
  
  // Gérer le chargement et la lecture de la vidéo active
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeClip) return;
    
    // Si l'asset est manquant ou indéfini, afficher une erreur et arrêter
    if (!activeClip.asset || !activeClip.asset.storageUrl) {
      console.error("Asset manquant ou URL non définie pour le clip:", activeClip);
      setError(`Erreur: Ressource vidéo non disponible ou corrompue (ID: ${activeClip.assetId || 'inconnu'})`);
      return;
    }
    
    // Réinitialiser les erreurs
    setError(null);
    
    try {
      // Changer la source vidéo
      video.src = activeClip.asset.storageUrl;
      
      // Charger la vidéo
      video.load();
      
      const handleCanPlay = () => {
        setIsReady(true);
        
        // Positionner la vidéo au bon endroit
        const clipPosition = currentTime - activeClip.startTime + (activeClip.trimStart || 0);
        video.currentTime = clipPosition;
        
        // Ajuster le volume selon les paramètres du clip
        video.volume = activeClip.volume !== undefined ? activeClip.volume : 1;
        
        // Démarrer ou mettre en pause selon l'état de lecture
        if (playing) {
          video.play().catch(error => {
            console.error('Erreur lors de la lecture :', error);
            setError('Impossible de lire la vidéo. Cliquez pour réessayer.');
          });
        } else {
          video.pause();
        }
      };
      
      video.addEventListener('canplay', handleCanPlay);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    } catch (error) {
      console.error("Erreur lors du chargement de la vidéo:", error);
      setError(`Erreur lors du chargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [activeClip, currentTime, playing]);
  
  // Gérer les pistes audio
  useEffect(() => {
    // Arrêter toutes les pistes audio qui ne sont plus actives
    Object.keys(audioRefs.current).forEach(id => {
      if (!activeAudioTracks.find(track => track.id === id)) {
        const audioElement = audioRefs.current[id];
        if (audioElement) {
          audioElement.pause();
        }
      }
    });
    
    // Gérer les pistes audio actives
    activeAudioTracks.forEach(track => {
      // S'assurer que nous avons un élément audio pour cette piste
      if (!audioRefs.current[track.id || '']) {
        const audioElement = new Audio();
        audioRefs.current[track.id || ''] = audioElement;
      }
      
      const audioElement = audioRefs.current[track.id || ''];
      if (!audioElement || !track.asset) return;
      
      // Configurer la source audio si elle a changé
      if (audioElement.src !== track.asset.storageUrl) {
        audioElement.src = track.asset.storageUrl;
        audioElement.load();
      }
      
      // Calculer la position dans la piste audio
      const audioPosition = currentTime - track.startTime;
      
      // Mettre à jour la position si nécessaire
      if (Math.abs(audioElement.currentTime - audioPosition) > 0.1) {
        audioElement.currentTime = audioPosition;
      }
      
      // Ajuster le volume
      audioElement.volume = track.volume !== undefined ? track.volume : 1;
      
      // Lecture ou pause
      if (playing) {
        audioElement.play().catch(err => {
          console.error('Erreur lors de la lecture audio :', err);
        });
      } else {
        audioElement.pause();
      }
    });
    
    // Nettoyage lors du démontage
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      audioRefs.current = {};
    };
  }, [activeAudioTracks, currentTime, playing]);
  
  // Gérer la lecture/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;
    
    if (playing) {
      video.play().catch(err => {
        console.error('Erreur lors de la lecture :', err);
      });
    } else {
      video.pause();
    }
  }, [playing, isReady]);
  
  // Gérer les mises à jour de temps
  const handleTimeUpdate = () => {
    if (!videoRef.current || !activeClip) return;
    
    // Calculer le temps global en fonction de la position dans le clip
    const clipTime = videoRef.current.currentTime - (activeClip.trimStart || 0);
    const globalTime = activeClip.startTime + clipTime;
    
    // Vérifier si on a atteint la fin du clip
    if (clipTime >= (activeClip.endTime - activeClip.startTime)) {
      // Passer au clip suivant si disponible
      const nextClip = clips.find(c => c.startTime >= activeClip.endTime);
      if (nextClip) {
        onTimeUpdate(nextClip.startTime);
      } else {
        onEnded();
      }
    } else {
      onTimeUpdate(globalTime);
    }
  };
  
  // Afficher un message d'erreur ou un état de chargement si nécessaire
  if (!activeClip) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        {currentTime === 0 ? (
          "Ajoutez des clips à votre timeline"
        ) : (
          "Aucun clip à cette position temporelle"
        )}
      </div>
    );
  }
  
  // Vérifier si l'asset est valide
  if (!activeClip.asset || !activeClip.asset.storageUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
        <div className="text-red-500 mb-4 text-xl">Ressource vidéo non disponible</div>
        <div className="text-sm text-gray-400 max-w-md text-center px-4">
          L&apos;asset vidéo de ce clip est manquant ou corrompu. Assurez-vous que tous les assets sont correctement chargés 
          et que les références sont valides. Essayez de recharger la page ou de réajouter ce clip à la timeline.
        </div>
        <div className="mt-4 text-xs text-gray-500">
          ID Asset: {activeClip.assetId || "Non spécifié"}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white" onClick={() => setError(null)}>
        {error}
      </div>
    );
  }
  
  if (!isReady) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Chargement de la vidéo...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onError={() => setError("Erreur lors du chargement de la vidéo")}
      />
    </div>
  );
};

export default VideoPreview;
