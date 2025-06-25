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
  isDragging?: boolean;
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
  isDragging = false,
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
  
  // Mécanisme de suivi du temps continu via référence (pour éviter les re-rendus)
  const continuousTimeRef = useRef<number>(0);
  const lastTimeUpdateRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  
  // État pour les pistes audio
  const [audioSources, setAudioSources] = useState<Record<string, string>>({});
  
  // Tableau des clips triés par ordre de temps
  const sortedClips = useMemo(() => {
    return [...clips].sort((a, b) => a.startTime - b.startTime);
  }, [clips]);
  
  // Fonction pour obtenir le clip actif en fonction du temps actuel
  const getActiveClipAtTime = useCallback((time: number, clipList: Clip[]) => {
    // Tolérance de 1ms pour gérer les limites exactes des clips
    const EPSILON = 0.001;
    
    // Chercher le clip qui contient précisément le temps actuel
    const clip = clipList.find(clip => {
      // Cas standard: le temps est clairement dans l'intervalle du clip
      if (time >= clip.startTime && time < clip.endTime - EPSILON) {
        return true;
      }
      
      // Cas spécial: si on est exactement à la fin du clip (à 1ms près), on considère qu'on n'est plus dedans
      // pour permettre la transition vers le clip suivant ou vers l'écran noir
      if (Math.abs(time - clip.endTime) < EPSILON) {
        return false;
      }
      
      return false;
    });
    
    return clip || null;
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
    // Mise à jour du temps global, même sans clip actif
    if (!videoRef.current) return;
    
    // Si nous sommes en train de mettre à jour manuellement le temps, ignorer cet événement
    if (manualTimeUpdateRef.current) {
      return;
    }
    
    if (activeClip) {
      // Calculer le temps global en fonction de la position dans le clip
      const currentVideoTime = videoRef.current.currentTime;
      const trimStart = activeClip.trimStart || 0;
      
      // Le temps dans le clip est le temps actuel vidéo moins le trimStart
      // Mais il faut s'assurer que ce temps n'est pas négatif (pas avant le trimStart)
      const clipTime = Math.max(0, currentVideoTime - trimStart);
      const globalTime = activeClip.startTime + clipTime;
      
      // Log pour debug avec vérification pour limiter les logs
      if (Math.floor(currentVideoTime * 10) % 10 === 0) { // Log toutes les 0.1s
        console.log(`Position vidéo: ${currentVideoTime.toFixed(3)}s, ` +
                    `trimStart: ${trimStart.toFixed(3)}s, ` + 
                    `clipTime: ${clipTime.toFixed(3)}s, ` +
                    `globalTime: ${globalTime.toFixed(3)}s`);
      }
      
      // Mettre à jour le temps continu sans déclencher un rendu
      lastTimeUpdateRef.current = Date.now();
      // Stocker la valeur dans la référence au lieu d'utiliser setState
      continuousTimeRef.current = globalTime;
      
      // Vérifier si on a atteint la fin du clip
      const clipDuration = activeClip.endTime - activeClip.startTime;
      const trimEnd = activeClip.trimEnd || 0;
      const adjustedClipDuration = clipDuration;
      
      // Calcul précis du temps restant dans le clip en tenant compte du trimming
      const remainingClipTime = adjustedClipDuration - clipTime;
      
      // Ne déclencher la fin que si on est vraiment proche de la fin du clip visible
      if (remainingClipTime <= 0.1) { // Réduit à 0.1s pour être encore moins sensible
        // Trouver le prochain clip (avec ou sans gap)
        const timeAfterCurrentClip = activeClip.endTime + 0.001; // Décalage de 1ms précisément
        
        // Chercher le prochain clip dans la timeline (pas forcément adjacent)
        const nextClip = sortedClips.find(c => c.startTime > activeClip.endTime);
        
        // Verrouiller pendant la transition pour éviter les mises à jour multiples
        if (!isInTransitionRef.current) {
          isInTransitionRef.current = true;
          
          // Transition vers le prochain clip ou la fin
          if (nextClip) {
            // S'il y a un écart entre les clips, passons au moment juste après le clip actuel
            // pour afficher l'écran noir dans l'intervalle, mais maintenir la lecture
            console.log(`Fin du clip à ${activeClip.endTime}s, avance de 1ms à ${timeAfterCurrentClip}s (reste: ${remainingClipTime.toFixed(3)}s)`);
            onTimeUpdate(timeAfterCurrentClip);
            
            // TOUJOURS assurer que la lecture continue pendant la transition
            // Même si la vidéo n'est pas en pause, forcer un redémarrage pour les clips problématiques
            if (videoRef.current && playing) {
              console.log("Redémarrage forcé de la lecture pendant la transition");
              // Court délai pour permettre le changement d'état
              setTimeout(() => {
                if (videoRef.current && playing) {
                  videoRef.current.play().catch(err => console.error("Erreur lors du redémarrage:", err));
                }
              }, 10);
            }
            
            // Ajouter une vérification supplémentaire après un court délai
            // Cette vérification secondaire aide avec les clips problématiques
            setTimeout(() => {
              if (videoRef.current && playing && (videoRef.current.paused || videoRef.current.ended)) {
                console.log("Vérification supplémentaire: redémarrage forcé pendant transition");
                videoRef.current.play().catch(err => console.error("Erreur lors du redémarrage supplémentaire:", err));
              }
            }, 150);
          } else {
            // Fin de la timeline - seul cas où on arrête réellement
            onEnded();
          }
          
          // Débloquer après un délai
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
          }
          
          transitionTimeoutRef.current = setTimeout(() => {
            isInTransitionRef.current = false;
            
            // Vérification supplémentaire pour s'assurer que la lecture se poursuit
            if (nextClip && videoRef.current && playing) {
              const isPaused = videoRef.current.paused;
              const isEnded = videoRef.current.ended;
              if (isPaused || isEnded) {
                console.log(`Vérification post-transition: redémarrage de la lecture (paused=${isPaused}, ended=${isEnded})`);
                videoRef.current.play().catch(err => console.error("Erreur lors du redémarrage post-transition:", err));
              }
            }
          }, 300); // Délai suffisant pour éviter les rebonds
        }
      } else {
        // Mise à jour normale du temps (uniquement si pas en transition)
        if (!isInTransitionRef.current) {
          onTimeUpdate(globalTime);
        }
      }
    } else {
      // Si nous n'avons pas de clip actif mais que nous avons un temps continu,
      // mettre à jour le temps pour continuer la lecture
      onTimeUpdate(continuousTimeRef.current);
    }
  }, [activeClip, sortedClips, onTimeUpdate, onEnded, playing]);
  
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
    const newActiveClip = getActiveClipAtTime(currentTime, sortedClips);        // Si le clip trouvé est différent de l'actif
    if (newActiveClip !== activeClip) {
      console.log(`Changement de clip actif à ${currentTime}s:`, 
        newActiveClip ? `ID=${newActiveClip.id}` : 'Écran noir - continuité de lecture');
      
      if (!newActiveClip) {
        // Si aucun clip n'est trouvé mais que nous avons des clips et que currentTime
        // est avant le premier clip, sélectionner le premier clip par défaut
        if (sortedClips.length > 0 && currentTime < sortedClips[0].startTime) {
          console.log("Sélection du premier clip par défaut");
          setActiveClip(sortedClips[0]);
          return;
        }
        
        // Si nous sommes dans une zone sans clip (gap), maintenir la lecture virtuelle
        // en affichant un écran noir
        setActiveClip(null);
        setVideoSource(null);
        // Ne pas arrêter la lecture, continuité assurée par le mécanisme de temps continu
      } else {
        // Mettre à jour le clip actif
        setActiveClip(newActiveClip);
        
        // Afficher les informations sur le trimming du clip
        const trimStart = newActiveClip.trimStart || 0;
        const trimEnd = newActiveClip.trimEnd || 0;
        const clipDuration = newActiveClip.endTime - newActiveClip.startTime;
        const assetDuration = newActiveClip.asset?.duration || (trimStart + clipDuration + trimEnd);
        
        console.log(`Clip sélectionné: ID=${newActiveClip.id}, ` +
                   `trimStart=${trimStart.toFixed(3)}s, trimEnd=${trimEnd.toFixed(3)}s, ` +
                   `durée visible=${clipDuration.toFixed(3)}s, durée totale=${assetDuration.toFixed(3)}s, ` +
                   `position dans timeline=${newActiveClip.startTime.toFixed(3)}s à ${newActiveClip.endTime.toFixed(3)}s`);
        
        // Vérification supplémentaire pour éviter les positions négatives
        if (currentTime < newActiveClip.startTime) {
          console.log(`⚠️ Correction: currentTime (${currentTime.toFixed(3)}s) < clip.startTime (${newActiveClip.startTime.toFixed(3)}s)`);
          // Forcer le temps au début du clip
          setTimeout(() => onTimeUpdate(newActiveClip.startTime), 10);
        }
        
        // Si nous sommes près de la fin du clip, avancer légèrement pour éviter de sauter immédiatement
        const timeFromEnd = newActiveClip.endTime - currentTime;
        if (timeFromEnd < 0.2 && timeFromEnd > 0) {
          console.log(`⚠️ Correction: trop près de la fin du clip (${timeFromEnd.toFixed(3)}s restantes)`);
          // Reculer légèrement pour éviter le déclenchement immédiat de la fin
          setTimeout(() => onTimeUpdate(newActiveClip.endTime - 0.5), 10);
        }
        
        // Réinitialiser l'état de chargement seulement si on change vraiment de clip
        if (newActiveClip && (!activeClip || newActiveClip.id !== activeClip.id)) {
          // Vérifier si c'est une transition directe entre clips adjacents (avec tolérance de 1ms)
          const isDirectTransition = activeClip && sortedClips.some(clip => {
            return clip.id === activeClip.id && 
                  Math.abs(clip.endTime - newActiveClip.startTime) <= 0.001;
          });
          
          if (isDirectTransition) {
            console.log("Transition directe détectée, passage immédiat à READY");
            setLoadingState(LoadingState.READY);
          } else {
            setLoadingState(LoadingState.LOADING);
          }
          
          setBufferingProgress(0);
        }
        
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
      // Calculer la position dans le clip (temps global - temps de début du clip)
      const clipPosition = Math.max(0, currentTime - activeClip.startTime);
      const trimStart = activeClip.trimStart || 0;
      
      // Pour positionner correctement la vidéo, on doit ajouter le trimStart
      // car la partie trimmée au début reste présente dans la vidéo source
      const videoPosition = clipPosition + trimStart;
      
      // S'assurer que la position ne dépasse pas la durée réelle de la vidéo
      // en tenant compte du trimming à la fin
      const trimEnd = activeClip.trimEnd || 0;
      const assetDuration = activeClip.asset?.duration || 0;
      const maxPosition = assetDuration > 0 ? assetDuration - trimEnd : 9999;
      const safeVideoPosition = Math.min(videoPosition, maxPosition);
      
      // Ne mettre à jour que si la différence est significative ET qu'on n'est pas en cours de drag
      if (!isDragging && Math.abs(videoRef.current.currentTime - safeVideoPosition) > 0.1) {
        console.log(`Mise à jour position: clipTime=${clipPosition.toFixed(3)}s, ` + 
                    `videoPosition=${safeVideoPosition.toFixed(3)}s ` +
                    `(trimStart=${trimStart.toFixed(3)}s, trimEnd=${trimEnd.toFixed(3)}s, ` + 
                    `assetDuration=${assetDuration.toFixed(3)}s)`);
        setVideoTime(safeVideoPosition);
      }
    }
  }, [clips, sortedClips, audioTracks, currentTime, activeClip, getActiveClipAtTime, onTimeUpdate, isDragging]);
  
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
  
  // Flag pour indiquer une mise à jour manuelle du temps
  const manualTimeUpdateRef = useRef<boolean>(false);
  
  // Mettre à jour le temps de la vidéo lorsqu'il change
  useEffect(() => {
    if (!videoRef.current || !activeClip) return;
    
    // Ne pas mettre à jour si la valeur est trop petite (possible initialisation)
    if (videoTime <= 0 && activeClip.trimStart && activeClip.trimStart > 0) {
      console.log(`🔄 Correction initiale: position au trimStart (${activeClip.trimStart.toFixed(3)}s)`);
      // S'assurer que le temps initial est au moins au trimStart
      const correctedTime = activeClip.trimStart;
      
      // Indiquer qu'on est en train de modifier le temps manuellement
      manualTimeUpdateRef.current = true;
      videoRef.current.currentTime = correctedTime;
      
      // Réinitialiser le flag après un court délai
      setTimeout(() => {
        manualTimeUpdateRef.current = false;
      }, 50);
      
      return;
    }
    
    // Éviter les mises à jour inutiles qui peuvent causer des sauts
    const currentVideoTime = videoRef.current.currentTime;
    if (Math.abs(currentVideoTime - videoTime) > 0.1) {
      console.log(`Mise à jour du temps vidéo: ${currentVideoTime.toFixed(3)}s → ${videoTime.toFixed(3)}s`);
      
      // Indiquer qu'on est en train de modifier le temps manuellement
      manualTimeUpdateRef.current = true;
      videoRef.current.currentTime = videoTime;
      
      // Réinitialiser le flag après un court délai
      setTimeout(() => {
        manualTimeUpdateRef.current = false;
      }, 50);
    }
  }, [videoTime, activeClip]);
  
  // Gestion des événements vidéo
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const handleLoadStart = () => {
      // Ne pas changer l'état si nous sommes déjà en chargement
      if (loadingState !== LoadingState.LOADING) {
        setLoadingState(LoadingState.LOADING);
        setBufferingProgress(0);
      }
    };
    
    const handleCanPlay = () => {
      // Passer à l'état de mise en mémoire tampon seulement si nous n'étions pas déjà prêts
      if (loadingState !== LoadingState.READY) {
        setLoadingState(LoadingState.BUFFERING);
      }
    };
    
    const handleCanPlayThrough = () => {
      // Éviter les transitions d'état inutiles qui pourraient interrompre la lecture
      if (loadingState !== LoadingState.READY) {
        console.log("Vidéo prête à être lue sans interruption");
        setLoadingState(LoadingState.READY);
      }
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
    
    // Gestionnaire pour l'événement "ended" de la vidéo
    const handleVideoEnded = () => {
      console.log("Événement 'ended' détecté - la vidéo a atteint sa fin naturelle");
      
      // Si nous avons un clip actif, forcer la progression au clip suivant
      if (activeClip) {
        const timeAfterCurrentClip = activeClip.endTime + 0.001;
        console.log(`Clip terminé, forçage du temps à ${timeAfterCurrentClip}s`);
        
        // Marquer comme en transition pour éviter les rebonds
        isInTransitionRef.current = true;
        
        // Chercher le prochain clip
        const nextClip = sortedClips.find(c => c.startTime > activeClip.endTime);
        
        // Forcer la mise à jour du temps pour passer au clip suivant ou à l'écran noir
        onTimeUpdate(timeAfterCurrentClip);
        
        // Si nous avons un prochain clip, s'assurer de maintenir la lecture
        if (nextClip && playing) {
          console.log("Clip suivant trouvé, préparation de la transition continue");
          
          // Série de tentatives de reprise de lecture à différents intervalles
          // pour maximiser les chances de succès avec différents types de clips
          
          // Première tentative rapide
          setTimeout(() => {
            if (videoRef.current && playing) {
              console.log("Redémarrage forcé après 'ended' (tentative 1)");
              videoRef.current.play().catch(err => console.error("Erreur lors du redémarrage après 'ended' (1):", err));
            }
          }, 50);
          
          // Deuxième tentative si la première échoue
          setTimeout(() => {
            if (videoRef.current && videoRef.current.paused && playing) {
              console.log("Redémarrage forcé après 'ended' (tentative 2)");
              videoRef.current.play().catch(err => console.error("Erreur lors du redémarrage après 'ended' (2):", err));
            }
          }, 150);
          
          // Troisième tentative pour les cas les plus difficiles
          setTimeout(() => {
            if (videoRef.current && videoRef.current.paused && playing) {
              console.log("Redémarrage forcé après 'ended' (tentative 3)");
              videoRef.current.play().catch(err => console.error("Erreur lors du redémarrage après 'ended' (3):", err));
            }
          }, 300);
          
        } else if (!nextClip) {
          // Si pas de clip suivant, c'est vraiment la fin
          onEnded();
        }
        
        // Réinitialiser l'état de transition après un délai
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
        
        transitionTimeoutRef.current = setTimeout(() => {
          isInTransitionRef.current = false;
          
          // Vérification finale avant de quitter l'état de transition
          if (nextClip && videoRef.current && videoRef.current.paused && playing) {
            console.log("Vérification finale: redémarrage de la lecture");
            videoRef.current.play().catch(err => console.error("Erreur lors du redémarrage final:", err));
          }
        }, 350);
      }
    };
    
    // Ajouter les écouteurs d'événements
    videoElement.addEventListener('loadstart', handleLoadStart);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('canplaythrough', handleCanPlayThrough);
    videoElement.addEventListener('progress', handleProgress);
    videoElement.addEventListener('error', handleVideoError);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleVideoEnded);
    
    // Nettoyer les écouteurs lors du démontage
    return () => {
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('canplaythrough', handleCanPlayThrough);
      videoElement.removeEventListener('progress', handleProgress);
      videoElement.removeEventListener('error', handleVideoError);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleVideoEnded);
    };
  }, [handleTimeUpdate, loadingState, activeClip, onTimeUpdate, onEnded, playing, sortedClips]);
  
  // Gérer le volume de la vidéo
  useEffect(() => {
    if (videoRef.current && activeClip) {
      videoRef.current.volume = activeClip.volume !== undefined ? activeClip.volume : 1;
    }
  }, [activeClip]);
  
  // Gérer la lecture/pause
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // Variable pour suivre si ce hook effect est toujours actif
    let isEffectActive = true;
    let playAttemptTimer: NodeJS.Timeout | null = null;
    
    const attemptPlay = () => {
      if (!isEffectActive || !videoRef.current) return;
      
      if ((loadingState === LoadingState.READY || loadingState === LoadingState.BUFFERING) && playing) {
        try {
          // Si la vidéo est déjà en cours de lecture, ne pas interrompre
          if (!videoRef.current.paused) {
            return;
          }
          
          console.log("Tentative de lecture vidéo");
          const playPromise = videoRef.current.play();
          
          // Gérer correctement la promesse de lecture
          if (playPromise !== undefined) {
            playPromise.catch((err: Error) => {
              // Vérifier si l'erreur est due à une interruption
              if (err.name !== 'AbortError' && isEffectActive) {
                console.error('Erreur lors de la lecture vidéo:', err);
                
                // En cas d'erreur, essayer à nouveau après un court délai
                // sauf si c'est une erreur d'interaction utilisateur
                if (err.name !== 'NotAllowedError') {
                  console.log("Nouvel essai de lecture dans 500ms...");
                  playAttemptTimer = setTimeout(attemptPlay, 500);
                } else {
                  setError('Impossible de lire la vidéo. Cliquez pour réessayer.');
                }
              } else {
                console.log('Lecture interrompue par un changement de source, normal.');
              }
            });
          }
        } catch (err) {
          console.error('Exception lors de la lecture vidéo:', err);
        }
      } else if (videoElement) {
        videoElement.pause();
      }
    };
    
    if (playing) {
      // Ajouter un petit délai avant de lancer la lecture pour éviter les conflits
      playAttemptTimer = setTimeout(attemptPlay, 100);
      
      // Ajouter une vérification supplémentaire après un délai plus long
      // pour s'assurer que la lecture continue, même pendant les transitions
      const continuityCheckTimer = setTimeout(() => {
        if (isEffectActive && videoRef.current && videoRef.current.paused && playing) {
          console.log("Vérification de continuité: vidéo en pause alors qu'elle devrait jouer");
          attemptPlay();
        }
      }, 1000);
      
      return () => {
        isEffectActive = false;
        if (playAttemptTimer) clearTimeout(playAttemptTimer);
        clearTimeout(continuityCheckTimer);
      };
    } else if (videoElement) {
      videoElement.pause();
    }
    
    // Nettoyer les timers lors du démontage ou des changements
    return () => {
      isEffectActive = false;
      if (playAttemptTimer) {
        clearTimeout(playAttemptTimer);
      }
    };
  }, [playing, loadingState, setError]);
  
  // Gestion sécurisée du changement de source vidéo
  useEffect(() => {
    // Si pas d'élément vidéo ou pas de source, rien à faire
    if (!videoRef.current) return;
    
    // Arrêter la lecture et suspendre toute opération en cours
    try {
      const videoEl = videoRef.current;
      videoEl.pause();
      
      // Variable pour suivre si cet effet est toujours actif
      let isEffectActive = true;
      
      // Petit délai avant de modifier la source pour éviter les conflits
      const sourceTimer = setTimeout(() => {
        if (isEffectActive && videoRef.current) {
          try {
            // Suspendre le préchargement pendant le changement de source
            videoEl.preload = 'none';
            
            // Appliquer la nouvelle source
            if (videoSource) {
              videoEl.src = videoSource;
              videoEl.preload = 'auto';
              videoEl.load();
              // console.log(`Source vidéo changée: ${videoSource.substring(0, 50)}...`);
            } else {
              videoEl.removeAttribute('src');
              videoEl.load();
              // console.log('Source vidéo supprimée');
            }
          } catch (e) {
            console.error('Erreur lors du changement de source vidéo:', e);
          }
        }
      }, 50);
      
      return () => {
        isEffectActive = false;
        clearTimeout(sourceTimer);
      };
    } catch (e) {
      console.error('Exception lors du changement de source vidéo:', e);
    }
  }, [videoSource]);
  
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
    // Capturer les références actuelles pour éviter les problèmes de références périmées
    const currentVideoRef = videoRef.current;
    const currentAudioRefs = { ...audioRefs.current };
    
    return () => {
      // Nettoyer l'élément vidéo
      if (currentVideoRef) {
        try {
          currentVideoRef.pause();
          currentVideoRef.removeAttribute('src');
          currentVideoRef.load();
        } catch (e) {
          console.error('Erreur lors du nettoyage de la vidéo:', e);
        }
      }
      
      // Nettoyer les éléments audio
      Object.values(currentAudioRefs).forEach(audio => {
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
  
  // Mécanisme pour avancer le temps en l'absence de clip actif (écran noir)
  useEffect(() => {
    // Si nous sommes en transition, ne pas démarrer d'animation
    if (isInTransitionRef.current) return;
    
    // Fonction pour mettre à jour le temps continu
    const updateContinuousTime = () => {
      // Vérifier que nous ne sommes pas en transition
      if (isInTransitionRef.current) {
        return;
      }
      
      if (!activeClip && playing) {
        // Calculer le temps écoulé depuis la dernière mise à jour
        const now = Date.now();
        const elapsed = (now - lastTimeUpdateRef.current) / 1000; // en secondes
        
        // Limiter l'avancement à 100ms max pour éviter les grands sauts si le navigateur ralentit
        const cappedElapsed = Math.min(elapsed, 0.1);
        const newTime = continuousTimeRef.current + cappedElapsed;
        
        // Mettre à jour les références de temps sans déclencher de rendu
        continuousTimeRef.current = newTime;
        lastTimeUpdateRef.current = now;
        
        // Propager la mise à jour de temps (seulement si pas en transition)
        if (!isInTransitionRef.current && !manualTimeUpdateRef.current) {
          onTimeUpdate(newTime);
        }
        
        // Vérifier si nous avons atteint un nouveau clip
        const nextClip = sortedClips.find(clip => 
          newTime >= clip.startTime && newTime < clip.endTime
        );
        
        // Si nous avons trouvé un clip, arrêter l'animation car la vidéo prendra le relais
        if (nextClip) return;
      }
      
      // Continuer l'animation seulement si conditions appropriées
      if (!activeClip && playing && !isInTransitionRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateContinuousTime);
      }
    };
    
    // Démarrer l'animation seulement quand il n'y a pas de clip actif et que la lecture est en cours
    if (!activeClip && playing) {
      lastTimeUpdateRef.current = Date.now();
      continuousTimeRef.current = currentTime; // Synchroniser avec le temps actuel
      animationFrameRef.current = requestAnimationFrame(updateContinuousTime);
    }
    
    // Nettoyer l'animation lors des changements
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [activeClip, playing, onTimeUpdate, sortedClips, currentTime]);
  
  // Synchroniser la référence de temps continu avec le temps actuel
  useEffect(() => {
    // Mettre à jour notre référence de temps interne
    continuousTimeRef.current = currentTime;
    
    // Si nous venons de changer de temps brutalement (grand saut), 
    // considérer cela comme une transition et bloquer brièvement
    const timeDiff = Math.abs(continuousTimeRef.current - currentTime);
    if (timeDiff > 0.5) { // Si saut de plus de 500ms
      isInTransitionRef.current = true;
      console.log(`Grand saut de temps détecté (${timeDiff.toFixed(3)}s), verrouillage temporaire`);
      
      // Débloquer après un délai
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      transitionTimeoutRef.current = setTimeout(() => {
        isInTransitionRef.current = false;
      }, 300);
    }
  }, [currentTime]);
  
  // Référence pour suivre si nous sommes en transition entre clips
  const isInTransitionRef = useRef<boolean>(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Référence pour suivre le dernier temps connu pour la détection d'inactivité
  const lastVideoTimeRef = useRef<number>(0);
  
  // Mécanisme de sécurité pour détecter si la lecture s'est arrêtée sans raison
  useEffect(() => {
    if (!playing || !videoRef.current) return;
    
    // Variable pour suivre si cette instance du hook est active
    let isEffectActive = true;
    
    // Initialiser la référence avec le temps actuel de la vidéo
    if (videoRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
    }
    
    // Compteur d'inactivité pour détecter les clips problématiques persistants
    let inactivityCounter = 0;
    
    // Surveillance pour détecter si la vidéo est arrêtée alors qu'elle devrait jouer
    const checkActivity = () => {
      if (!isEffectActive || !videoRef.current || !playing) return;
      
      const videoElement = videoRef.current;
      const currentTime = videoElement.currentTime;
      
      // Détecter si le temps n'avance pas ou si la vidéo est en pause inattendue
      const videoTimeStalled = Math.abs(currentTime - lastVideoTimeRef.current) < 0.01;
      const isUnexpectedlyPaused = videoElement.paused && playing;
      const isUnexpectedlyEnded = videoElement.ended && playing;
      
      // Si le temps n'avance pas ou si l'état est incorrect
      if ((videoTimeStalled && !videoElement.paused) || isUnexpectedlyPaused || isUnexpectedlyEnded) {
        inactivityCounter++;
        console.log(`Détection d'inactivité #${inactivityCounter}: stalled=${videoTimeStalled}, paused=${isUnexpectedlyPaused}, ended=${isUnexpectedlyEnded}`);
        
        // Si nous avons un clip actif
        if (activeClip) {
          // Progressivement augmenter l'agressivité de la correction selon le nombre de détections
          if (inactivityCounter === 1) {
            // Premier essai: simple redémarrage de la lecture
            console.log("Première tentative de correction: redémarrage de la lecture");
            videoElement.play().catch(e => console.error("Erreur lors du redémarrage:", e));
          } 
          else if (inactivityCounter === 2) {
            // Deuxième essai: avancer légèrement dans le clip
            console.log("Deuxième tentative: avance dans le clip actuel");
            const smallAdvance = currentTime + 0.1;
            videoElement.currentTime = smallAdvance;
            setTimeout(() => videoElement.play().catch(e => console.error("Erreur lors du redémarrage après avance:", e)), 50);
          }
          else if (inactivityCounter >= 3) {
            // Troisième essai ou plus: forcer le passage au clip suivant
            console.log("Tentative avancée: forçage vers le clip suivant");
            
            // Marquer comme en transition
            isInTransitionRef.current = true;
            
            // Forcer le passage à la fin du clip actuel
            const timeAfterCurrentClip = activeClip.endTime + 0.001;
            console.log(`Forçage du temps à ${timeAfterCurrentClip}s pour sortir de l'état bloqué`);
            onTimeUpdate(timeAfterCurrentClip);
            
            // Chercher le prochain clip pour un saut direct si nécessaire
            const nextClip = sortedClips.find(c => c.startTime > activeClip.endTime);
            if (nextClip && inactivityCounter > 4) {
              // Si l'inactivité persiste, sauter directement au début du clip suivant
              console.log(`Saut direct au clip suivant à ${nextClip.startTime}s`);
              setTimeout(() => onTimeUpdate(nextClip.startTime + 0.01), 100);
            }
            
            // Réinitialiser le compteur après une action forte
            inactivityCounter = 0;
            
            // Réinitialiser l'état de transition après un délai
            if (transitionTimeoutRef.current) {
              clearTimeout(transitionTimeoutRef.current);
            }
            
            transitionTimeoutRef.current = setTimeout(() => {
              isInTransitionRef.current = false;
            }, 350);
          }
        } else {
          // Si nous n'avons pas de clip actif mais que la lecture est en cours
          // Chercher le prochain clip et y sauter directement si l'inactivité persiste
          if (inactivityCounter > 2) {
            const nextClip = sortedClips.find(c => c.startTime > continuousTimeRef.current);
            if (nextClip) {
              console.log(`Écran noir inactif: saut direct au prochain clip à ${nextClip.startTime}s`);
              onTimeUpdate(nextClip.startTime + 0.01);
              inactivityCounter = 0;
            } else {
              // Avancer un peu le temps même sans clip
              const newTime = continuousTimeRef.current + 0.2;
              console.log(`Écran noir inactif: avance forcée à ${newTime.toFixed(3)}s`);
              onTimeUpdate(newTime);
            }
          }
        }
      } else {
        // Si le temps avance normalement, réduire progressivement le compteur d'inactivité
        if (inactivityCounter > 0) inactivityCounter--;
      }
      
      // Mise à jour de la référence pour la prochaine vérification
      lastVideoTimeRef.current = currentTime;
    };
    
    // Vérifier l'activité plus fréquemment pour détecter les problèmes rapidement
    const intervalId = setInterval(checkActivity, 250); // Intervalle court pour réactivité
    
    return () => {
      isEffectActive = false;
      clearInterval(intervalId);
    };
  }, [playing, activeClip, sortedClips, onTimeUpdate, continuousTimeRef]);
  
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
        <div className="absolute inset-0 bg-black">
          {/* Écran noir sans texte quand currentTime > 0 et qu'il y a des clips */}
          {(currentTime === 0 || clips.length === 0) && (
            <div className="flex items-center justify-center h-full text-white">
              {clips.length === 0 ? "Ajoutez des clips à votre timeline" : ""}
            </div>
          )}
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white cursor-pointer"
          onClick={() => {
            setError(null);
            // Réinitialiser l'état de chargement et recharger la vidéo
            if (videoRef.current && videoSource) {
              setLoadingState(LoadingState.LOADING);
              videoRef.current.load();
            }
          }}
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
