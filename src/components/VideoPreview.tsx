import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Clip, AudioTrack } from '@/interface/iProject';

// Définir les états de chargement pour un suivi plus précis
enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  BUFFERING = 'buffering',
  READY = 'ready',
  ERROR = 'error'
}

// Configuration du préchargement
const PRELOAD_NEXT_CLIPS = 2; // Nombre de clips suivants à précharger

// Configuration des qualités vidéo
type VideoQuality = 'preview' | 'medium' | 'high';
const VIDEO_QUALITIES = {
  preview: { width: 480, height: 270, bitrate: '600k', format: 'auto' }, // Format léger pour l'éditeur
  medium: { width: 720, height: 405, bitrate: '1200k', format: 'auto' }, // Qualité moyenne
  high: { width: 1080, height: 608, bitrate: '2500k', format: 'auto' }   // Haute qualité
};

/**
 * Optimise une URL Cloudinary pour obtenir une version avec la qualité spécifiée
 * @param url URL Cloudinary originale
 * @param quality Qualité souhaitée (preview, medium, high)
 * @returns URL optimisée
 */
function optimizeCloudinaryUrl(url: string, quality: VideoQuality = 'preview'): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url; // Retourner l'URL originale si ce n'est pas une URL Cloudinary
  }

  try {
    // Récupérer les paramètres de qualité
    const { width, height, bitrate, format } = VIDEO_QUALITIES[quality];
    
    // Parser l'URL Cloudinary
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) return url; // Pas une URL Cloudinary standard
    
    // Extraire le cloud name et le public ID
    const cloudName = urlParts[3];
    const publicIdWithExtension = urlParts.slice(uploadIndex + 1).join('/');
    
    // Séparer l'extension du public ID
    let publicId = publicIdWithExtension;
    let extension = 'mp4';
    
    if (publicIdWithExtension.includes('.')) {
      const parts = publicIdWithExtension.split('.');
      extension = parts.pop() || 'mp4';
      publicId = parts.join('.');
    }
    
    // Construire les transformations pour optimisation
    const transformations = [
      'vc_auto', // Codec auto (VP9 si supporté, sinon H.264)
      `w_${width}`,
      `h_${height}`,
      'c_limit',
      `br_${bitrate}`,
      'q_auto',
      format !== 'auto' ? `f_${format}` : ''
    ].filter(Boolean).join(',');
    
    // Construire la nouvelle URL
    return `https://res.cloudinary.com/${cloudName}/video/upload/${transformations}/${publicId}.${extension}`;
  } catch (error) {
    console.error('Erreur lors de l\'optimisation de l\'URL Cloudinary:', error);
    return url; // En cas d'erreur, retourner l'URL originale
  }
}

// Interface pour les props du composant
interface VideoPreviewProps {
  clips: Clip[];
  audioTracks: AudioTrack[];
  currentTime: number;
  playing: boolean;
  onTimeUpdate: (time: number) => void;
  onEnded: () => void;
}

/**
 * Composant de prévisualisation vidéo optimisé avec approche déclarative
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
  
  // États
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const [activeAudioTracks, setActiveAudioTracks] = useState<AudioTrack[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [bufferingProgress, setBufferingProgress] = useState<number>(0);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [videoTime, setVideoTime] = useState<number>(0);
  
  // État pour les pistes audio
  const [audioSources, setAudioSources] = useState<Record<string, string>>({});
  
  // Tableau des clips triés par ordre de temps
  const sortedClips = useMemo(() => {
    return [...clips].sort((a, b) => a.startTime - b.startTime);
  }, [clips]);
  
  // Fonction pour obtenir le clip actif en fonction du temps actuel
  const getActiveClipAtTime = useCallback((time: number, clipList: Clip[]) => {
    // Chercher le clip qui contient le temps actuel
    return clipList.find(clip => time >= clip.startTime && time < clip.endTime) || null;
  }, []);
  
  // Fonction pour obtenir les prochains clips à précharger
  const getNextClipsToPreload = useCallback((currentClip: Clip | null, clipList: Clip[], count: number) => {
    if (!currentClip || clipList.length === 0) return [];
    
    const currentIndex = clipList.findIndex(clip => clip.id === currentClip.id);
    if (currentIndex === -1) return [];
    
    return clipList.slice(currentIndex + 1, currentIndex + 1 + count);
  }, []);
  
  // Gestionnaire pour les mises à jour de temps vidéo
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !activeClip) return;
    
    // Calculer le temps global en fonction de la position dans le clip
    const currentVideoTime = videoRef.current.currentTime;
    const trimStart = activeClip.trimStart || 0;
    const clipTime = currentVideoTime - trimStart;
    const globalTime = activeClip.startTime + clipTime;
    
    // Vérifier si on a atteint la fin du clip
    const clipDuration = activeClip.endTime - activeClip.startTime;
    
    if (clipTime >= clipDuration) {
      // Trouver le prochain clip
      const nextClip = sortedClips.find(c => c.startTime >= activeClip.endTime);
      
      if (nextClip) {
        // Passer au clip suivant
        onTimeUpdate(nextClip.startTime);
      } else {
        // Fin de la timeline
        onEnded();
      }
    } else {
      // Mise à jour normale du temps
      onTimeUpdate(globalTime);
    }
  }, [activeClip, sortedClips, onTimeUpdate, onEnded]);
  
  // Trouver et mettre à jour le clip actif en fonction du temps actuel
  useEffect(() => {
    // Vérifier si nous avons des clips valides
    if (clips.length === 0) {
      setActiveClip(null);
      setLoadingState(LoadingState.IDLE);
      setVideoSource(null);
      return;
    }
    
    // Chercher le clip qui contient le temps actuel
    const newActiveClip = getActiveClipAtTime(currentTime, sortedClips);
    
    // Si le clip trouvé est différent de l'actif
    if (newActiveClip !== activeClip) {
      console.log(`Changement de clip actif à ${currentTime}s:`, 
        newActiveClip ? `ID=${newActiveClip.id}` : 'Aucun clip actif');
      
      if (!newActiveClip) {
        // Si aucun clip n'est trouvé mais que nous avons des clips et que currentTime
        // est avant le premier clip, sélectionner le premier clip par défaut
        if (sortedClips.length > 0 && currentTime < sortedClips[0].startTime) {
          console.log("Sélection du premier clip par défaut");
          setActiveClip(sortedClips[0]);
          return;
        }
      }
      
      // Mettre à jour le clip actif
      setActiveClip(newActiveClip);
      
      // Réinitialiser l'état de chargement seulement si on change vraiment de clip
      if (newActiveClip && (!activeClip || newActiveClip.id !== activeClip.id)) {
        setLoadingState(LoadingState.LOADING);
        setBufferingProgress(0);
        
        // Mettre à jour la source vidéo si le clip est valide
        if (newActiveClip.asset && newActiveClip.asset.storageUrl) {
          // Utiliser l'URL optimisée pour Cloudinary
          const optimizedUrl = optimizeCloudinaryUrl(newActiveClip.asset.storageUrl, 'preview');
          setVideoSource(optimizedUrl);
        } else {
          setVideoSource(null);
          setError(`Erreur: Ressource vidéo non disponible (ID: ${newActiveClip.assetId || 'inconnu'})`);
          setLoadingState(LoadingState.ERROR);
        }
      }
    }
    
    // Chercher les pistes audio actives au temps actuel
    const activeTracks = audioTracks.filter(
      track => currentTime >= track.startTime && currentTime < track.endTime
    );
    
    // Mettre à jour les pistes audio
    setActiveAudioTracks(activeTracks);
    
    // Mettre à jour les sources audio
    const newAudioSources: Record<string, string> = {};
    activeTracks.forEach(track => {
      if (track.asset && track.asset.storageUrl && track.id) {
        newAudioSources[track.id] = track.asset.storageUrl;
      }
    });
    setAudioSources(newAudioSources);
    
    // Mettre à jour la position dans la vidéo active
    if (videoRef.current && activeClip) {
      // Calculer la position dans le clip
      const clipPosition = currentTime - activeClip.startTime + (activeClip.trimStart || 0);
      
      // Ne mettre à jour que si la différence est significative
      if (Math.abs(videoRef.current.currentTime - clipPosition) > 0.1) {
        setVideoTime(clipPosition);
      }
    }
    
  }, [clips, sortedClips, audioTracks, currentTime, activeClip, getActiveClipAtTime]);
  
  // Précharger les prochains clips
  useEffect(() => {
    if (!activeClip) return;
    
    // Obtenir les clips à précharger
    const clipsToPreload = getNextClipsToPreload(activeClip, sortedClips, PRELOAD_NEXT_CLIPS);
    
    // Précharger chaque clip en chargeant l'image
    clipsToPreload.forEach(clip => {
      if (clip.asset && clip.asset.storageUrl) {
        const optimizedUrl = optimizeCloudinaryUrl(clip.asset.storageUrl, 'preview');
        const img = new Image();
        img.src = optimizedUrl.replace(/\.(mp4|webm|mov)$/i, '.jpg');
      }
    });
  }, [activeClip, sortedClips, getNextClipsToPreload]);
  
  // Mettre à jour le temps de la vidéo lorsqu'il change
  useEffect(() => {
    if (videoRef.current && videoTime > 0) {
      videoRef.current.currentTime = videoTime;
    }
  }, [videoTime]);
  
  // Gestion des événements vidéo
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const handleLoadStart = () => {
      setLoadingState(LoadingState.LOADING);
      setBufferingProgress(0);
    };
    
    const handleCanPlay = () => {
      setLoadingState(LoadingState.BUFFERING);
    };
    
    const handleCanPlayThrough = () => {
      setLoadingState(LoadingState.READY);
    };
    
    const handleProgress = () => {
      if (videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
        const duration = videoElement.duration;
        
        if (duration > 0) {
          const progress = Math.min(100, Math.round((bufferedEnd / duration) * 100));
          setBufferingProgress(progress);
        }
      }
    };
    
    const handleVideoError = () => {
      console.error("Erreur vidéo:", videoElement.error);
      setError(`Erreur: ${videoElement.error?.message || 'Problème de lecture'}`);
      setLoadingState(LoadingState.ERROR);
    };
    
    // Ajouter les écouteurs d'événements
    videoElement.addEventListener('loadstart', handleLoadStart);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('canplaythrough', handleCanPlayThrough);
    videoElement.addEventListener('progress', handleProgress);
    videoElement.addEventListener('error', handleVideoError);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    
    // Nettoyer les écouteurs lors du démontage
    return () => {
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('canplaythrough', handleCanPlayThrough);
      videoElement.removeEventListener('progress', handleProgress);
      videoElement.removeEventListener('error', handleVideoError);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [handleTimeUpdate]);
  
  // Gérer le volume de la vidéo
  useEffect(() => {
    if (videoRef.current && activeClip) {
      videoRef.current.volume = activeClip.volume !== undefined ? activeClip.volume : 1;
    }
  }, [activeClip]);
  
  // Gérer la lecture/pause
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || loadingState !== LoadingState.READY) return;
    
    try {
      if (playing) {
        const playPromise = videoElement.play();
        
        // Gérer correctement la promesse de lecture
        if (playPromise !== undefined) {
          playPromise.catch((err: Error) => {
            console.error('Erreur lors de la lecture vidéo:', err);
            setError('Impossible de lire la vidéo. Cliquez pour réessayer.');
          });
        }
      } else {
        videoElement.pause();
      }
    } catch (err) {
      console.error('Exception lors de la lecture/pause vidéo:', err);
    }
  }, [playing, loadingState]);
  
  // Gestion des pistes audio - utilise les réfs pour les éléments audio
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({});
  
  // Mettre à jour les éléments audio
  useEffect(() => {
    // Gérer la position et le volume de chaque piste audio
    activeAudioTracks.forEach(track => {
      if (!track.id) return;
      
      const audioElement = audioRefs.current[track.id];
      if (!audioElement) return;
      
      // Calculer la position dans la piste audio
      const audioPosition = currentTime - track.startTime;
      
      // Mettre à jour la position si nécessaire
      if (Math.abs(audioElement.currentTime - audioPosition) > 0.1) {
        audioElement.currentTime = audioPosition;
      }
      
      // Ajuster le volume
      audioElement.volume = track.volume !== undefined ? track.volume : 1;
      
      // Lecture ou pause
      try {
        if (playing) {
          const playPromise = audioElement.play();
          if (playPromise !== undefined) {
            playPromise.catch((err: Error) => {
              console.error('Erreur lors de la lecture audio:', err);
            });
          }
        } else {
          audioElement.pause();
        }
      } catch (err) {
        console.error('Exception lors de la lecture/pause audio:', err);
      }
    });
  }, [activeAudioTracks, currentTime, playing]);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      // Capturer la référence actuelle pour le nettoyage
      const video = videoRef.current;
      
      // Nettoyer l'élément vidéo
      if (video) {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch (e) {
          console.error('Erreur lors du nettoyage de la vidéo:', e);
        }
      }
      
      // Nettoyer les éléments audio
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          try {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
          } catch (e) {
            console.error('Erreur lors du nettoyage audio:', e);
          }
        }
      });
    };
  }, []);
  
  // Rendu du composant
  return (
    <div className="w-full h-full bg-black relative">
      {/* Élément vidéo principal */}
      <video
        ref={videoRef}
        {...(videoSource ? { src: videoSource } : {})}
        className="w-full h-full object-contain"
        playsInline
        preload="auto"
        muted={false}
        style={{ display: videoSource && !error ? 'block' : 'none' }}
      />
      
      {/* Éléments audio pour chaque piste */}
      {Object.entries(audioSources).map(([trackId, url]) => (
        <audio
          key={trackId}
          ref={(el) => { audioRefs.current[trackId] = el; }}
          src={url}
          preload="auto"
          hidden
        />
      ))}
      
      {/* Interface par dessus la vidéo */}
      {!activeClip && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white">
          {currentTime === 0 ? (
            "Ajoutez des clips à votre timeline"
          ) : (
            "Aucun clip à cette position temporelle"
          )}
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white"
          onClick={() => setError(null)}
        >
          <div className="text-red-500 text-center px-4 py-2 bg-black bg-opacity-50 rounded">
            {error}
            <div className="text-xs text-gray-400 mt-2">
              Cliquez pour réessayer
            </div>
          </div>
        </div>
      )}
      
      {/* Affichage de l'état de chargement */}
      {activeClip && loadingState !== LoadingState.READY && loadingState !== LoadingState.ERROR && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="text-white text-center">
              {loadingState === LoadingState.LOADING && "Chargement de la vidéo..."}
              {loadingState === LoadingState.BUFFERING && "Mise en mémoire tampon..."}
              <div className="w-48 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out" 
                  style={{ width: `${bufferingProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Détails du clip pour debugging (à enlever en production) */}
      {process.env.NODE_ENV === 'development' && activeClip && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded">
          Clip: {activeClip.id} | {Math.round(currentTime * 100) / 100}s
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
