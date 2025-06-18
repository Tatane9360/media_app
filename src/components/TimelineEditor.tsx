import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Timeline, Clip, AudioTrack, Effect } from '@/interface/iProject';
import { VideoAsset } from '@/interface/iVideoAsset';
import { CloudinaryImage } from './CloudinaryImage';
import { VideoThumbnail } from './VideoThumbnail';
import VideoPreview from './VideoPreview';

interface TimelineEditorProps {
  timeline: Timeline;
  videoAssets: VideoAsset[];
  onChange: (timeline: Timeline) => void;
}

/**
 * Composant d'édition de timeline
 * Ce composant permet de créer une interface de montage vidéo type InShot
 */
const TimelineEditor: React.FC<TimelineEditorProps> = ({
  timeline,
  videoAssets,
  onChange
}) => {
  // Références et états
  const timelineRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(100); // Échelle de zoom en %
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [draggedAsset, setDraggedAsset] = useState<VideoAsset | null>(null);
  
  // État pour l'indication de drop
  const [dropIndicator, setDropIndicator] = useState<{
    trackIndex: number;
    position: number;
    width: number;
    visible: boolean;
  }>({
    trackIndex: 0,
    position: 0,
    width: 0,
    visible: false
  });
  
  // Calculer la durée visible en pixels
  const pixelsPerSecond = scale / 10; // 10px par seconde à 100% de zoom
  
  // Fonction d'aide pour associer les assets vidéo aux clips
  const ensureClipsHaveAssets = useCallback(() => {
    // Si pas de clips, on ne fait rien
    if (!timeline.clips.length) {
      console.log("Aucun clip dans la timeline, rien à associer");
      return;
    }
    
    // Si pas d'assets, loguer l'erreur mais continuer
    if (!videoAssets.length) {
      console.warn("Aucun asset vidéo disponible, impossible d'associer les clips");
      return;
    }

    console.log("=== Début de l'association des assets aux clips ===");
    console.log(`Assets disponibles: ${videoAssets.length}`);
    console.log(`Clips à associer: ${timeline.clips.length}`);
    
    // Map pour accéder rapidement aux assets par ID
    const assetsMap = new Map();
    videoAssets.forEach(asset => {
      // Normaliser les ID (gérer à la fois string et ObjectId)
      const assetId = asset._id?.toString() || asset.id?.toString();
      if (assetId) {
        assetsMap.set(assetId, asset);
      }
    });
    
    // Vérifier si des clips ont besoin d'être mis à jour
    let hasUpdatedClips = false;
    const updatedClips = timeline.clips.map((clip, index) => {
      // Normaliser l'ID du clip (gérer à la fois string et ObjectId)
      const clipAssetId = clip.assetId?.toString();
      
      // Si pas d'assetId, on ne peut pas associer
      if (!clipAssetId) {
        console.warn(`Clip ${index} sans assetId:`, clip);
        return clip;
      }
      
      // Si le clip a déjà un asset valide, vérifier qu'il est complet
      if (clip.asset) {
        // Si l'asset a une URL de stockage, il est probablement valide
        if (clip.asset.storageUrl) {
          // Quand même vérifier si nous avons un asset plus récent/complet
          const freshAsset = assetsMap.get(clipAssetId);
          if (freshAsset && freshAsset.storageUrl && (
              !clip.asset.metadata || 
              !clip.asset.duration || 
              freshAsset.updatedAt > clip.asset.updatedAt
            )) {
            console.log(`Mise à jour de l'asset pour le clip ${clip.id} (${clipAssetId})`);
            hasUpdatedClips = true;
            return { ...clip, asset: freshAsset };
          }
          
          return clip;
        }
        // Sinon, l'asset est incomplet, essayer de le remplacer
      }
      
      // Chercher l'asset correspondant
      const matchingAsset = assetsMap.get(clipAssetId);
      if (matchingAsset) {
        hasUpdatedClips = true;
        console.log(`Asset trouvé pour le clip ${clip.id}, assetId: ${clipAssetId}`);
        return { ...clip, asset: matchingAsset };
      } else {
        console.warn(`⚠️ Aucun asset trouvé pour l'ID: ${clipAssetId}`);
      }
      
      return clip;
    });

    // Si des clips ont été mis à jour, mettre à jour la timeline
    if (hasUpdatedClips) {
      console.log(`✅ Mise à jour réussie de ${updatedClips.filter(c => c.asset).length}/${updatedClips.length} clips`);
      onChange({
        ...timeline,
        clips: updatedClips
      });
    } else {
      console.log("Aucun clip n'a besoin d'être mis à jour");
    }
    
    console.log("=== Fin de l'association des assets aux clips ===");
  }, [timeline, videoAssets, onChange]);
  
  // Exécuter l'association des assets lors du chargement initial et des mises à jour
  useEffect(() => {
    // Assurer que tous les clips ont un id valide
    const ensureClipsHaveIds = () => {
      if (!timeline.clips.length) return false;
      
      let needsUpdate = false;
      const updatedClips = timeline.clips.map((clip, index) => {
        // Si le clip n'a pas d'ID, utiliser _id ou générer un nouvel ID
        if (!clip.id) {
          needsUpdate = true;
          return {
            ...clip,
            id: clip._id?.toString() || `clip-${Date.now()}-${index}`
          };
        }
        return clip;
      });
      
      if (needsUpdate) {
        console.log("Mise à jour des IDs de clips manquants");
        onChange({
          ...timeline,
          clips: updatedClips
        });
        return true;
      }
      
      return false;
    };
    
    // D'abord s'assurer que tous les clips ont un ID
    const idsUpdated = ensureClipsHaveIds();
    
    // Ensuite associer les assets seulement si les IDs n'ont pas été mis à jour
    // (pour éviter de déclencher deux mises à jour consécutives)
    if (!idsUpdated) {
      ensureClipsHaveAssets();
    }
  }, [ensureClipsHaveAssets, timeline, onChange]);
  
  // Gestion du défilement de la timeline
  const handleTimelineScroll = () => {
    if (timelineRef.current) {
      const scrollPosition = timelineRef.current.scrollLeft;
      const newTime = scrollPosition / pixelsPerSecond;
      if (newTime !== currentTime) {
        setCurrentTime(newTime);
      }
      
      // Mettre à jour les marqueurs de temps lors du défilement
      setTimeMarkers(calculateTimeMarkers());
    }
  };
  
  // Rechercher le clip sélectionné
  const selectedClip = timeline.clips.find(clip => 
    (clip.id === selectedClipId) || (clip._id?.toString() === selectedClipId)
  );

  // Ajouter un clip à la timeline
  const addClip = (asset: VideoAsset, trackIndex = 0) => {
    // Calculer la position de départ du nouveau clip
    let startTime = currentTime;
    
    // Si des clips existent déjà, placer le nouveau clip à la fin du dernier
    if (timeline.clips.length > 0) {
      // Trouver le temps de fin maximum parmi tous les clips
      const maxEndTime = Math.max(...timeline.clips.map(clip => clip.endTime));
      startTime = maxEndTime;
    }
    
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      assetId: asset._id || asset.id,
      asset, // Pour l'UI
      trackIndex,
      startTime,
      endTime: startTime + asset.duration,
      trimStart: 0,
      trimEnd: 0,
      volume: 1,
      effects: []
    };
    
    const newTimeline = {
      ...timeline,
      clips: [...timeline.clips, newClip],
      duration: Math.max(timeline.duration, newClip.endTime)
    };
    
    onChange(newTimeline);
    setSelectedClipId(newClip.id as string);
  };
  
  // Modifier un clip
  const updateClip = (updatedClip: Clip) => {
    console.log(`Mise à jour du clip ${updatedClip.id}:`, updatedClip);
    
    // Vérifier que le clip existe
    const existingClipIndex = timeline.clips.findIndex(clip => clip.id === updatedClip.id);
    
    if (existingClipIndex === -1) {
      console.error(`Clip introuvable: ${updatedClip.id}`);
      return;
    }
    
    // Créer un nouveau tableau de clips avec la mise à jour
    const newClips = [...timeline.clips];
    newClips[existingClipIndex] = updatedClip;
    
    // Recalculer la durée totale de la timeline
    const maxEndTime = Math.max(...newClips.map(clip => clip.endTime));
    
    // Créer une nouvelle timeline avec les clips mis à jour
    const newTimeline = {
      ...timeline,
      clips: newClips,
      duration: Math.max(timeline.duration, maxEndTime)
    };
    
    // Appliquer les changements
    onChange(newTimeline);
  };
  
  // Supprimer un clip
  const removeClip = (clipId: string) => {
    const newClips = timeline.clips.filter(clip => clip.id !== clipId);
    
    // Recalculer la durée totale si nécessaire
    const maxEndTime = newClips.length ? Math.max(...newClips.map(clip => clip.endTime)) : 0;
    
    const newTimeline = {
      ...timeline,
      clips: newClips,
      duration: maxEndTime
    };
    
    onChange(newTimeline);
    setSelectedClipId(null);
  };
  
  // Ajouter une piste audio
  const addAudioTrack = (asset: VideoAsset, trackIndex = 0) => {
    const newAudioTrack: AudioTrack = {
      id: `audio-${Date.now()}`,
      assetId: asset._id || asset.id,
      asset, // Pour l'UI
      trackIndex,
      startTime: currentTime,
      endTime: currentTime + asset.duration,
      volume: 1,
      fadeIn: 0,
      fadeOut: 0
    };
    
    const newTimeline = {
      ...timeline,
      audioTracks: [...timeline.audioTracks, newAudioTrack],
      duration: Math.max(timeline.duration, newAudioTrack.endTime)
    };
    
    onChange(newTimeline);
  };
  
  // Ajouter un effet à un clip
  const addEffectToClip = (clipId: string, effect: Effect) => {
    const clip = timeline.clips.find(c => c.id === clipId);
    if (!clip) return;
    
    const updatedClip = {
      ...clip,
      effects: [...(clip.effects || []), effect]
    };
    
    updateClip(updatedClip);
  };
  
  // Gestion du glisser-déposer
  const handleDragStart = (asset: VideoAsset) => {
    setDraggedAsset(asset);
  };
  
  // Pour le drag & drop des clips déjà présents dans la timeline
  const [draggedClip, setDraggedClip] = useState<Clip | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [draggedClipOffsetX, setDraggedClipOffsetX] = useState<number>(0);
  
  // Commencer à glisser un clip existant
  const handleClipDragStart = (e: React.DragEvent, clip: Clip) => {
    e.stopPropagation();
    setDraggedClip(clip);
    
    // Calculer l'offset pour maintenir la position relative du pointeur dans le clip
    const clipElement = e.currentTarget as HTMLElement;
    const clipRect = clipElement.getBoundingClientRect();
    const offsetX = e.clientX - clipRect.left;
    setDraggedClipOffsetX(offsetX);
    
    // Définir les données de transfert (obligatoire pour le drag & drop)
    const clipId = clip.id || clip._id?.toString() || '';
    e.dataTransfer.setData('text/plain', clipId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Appliquer une classe visuelle
    clipElement.classList.add('opacity-50');
  };
  
  // Gérer la fin du glisser-déposer d'un clip
  const handleClipDragEnd = () => {
    setDraggedClip(null);
    setDropIndicator(prev => ({ ...prev, visible: false }));
  };
  
  const handleDragOver = (e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dropTime = x / pixelsPerSecond;
    
    // Mise à jour de l'indicateur de drop
    let width = 100; // largeur par défaut
    let position = x;
    
    if (draggedClip) {
      // Si on déplace un clip existant, utiliser sa durée actuelle
      const clipDuration = draggedClip.endTime - draggedClip.startTime;
      width = clipDuration * pixelsPerSecond;
      position = x - draggedClipOffsetX;
    } else if (draggedAsset) {
      // Si on ajoute un nouvel asset, utiliser sa durée
      width = draggedAsset.duration * pixelsPerSecond;
      position = x - (width / 2); // Centrer l'asset sur le curseur
    }
    
    setDropIndicator({
      trackIndex,
      position: Math.max(0, position),
      width,
      visible: true
    });
  };
  
  const handleDragLeave = () => {
    setDropIndicator(prev => ({ ...prev, visible: false }));
  };
  
  const handleDrop = (e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dropTime = x / pixelsPerSecond;
    
    // Masquer l'indicateur de drop
    setDropIndicator(prev => ({ ...prev, visible: false }));
    
    if (draggedClip) {
      // Déplacer un clip existant
      const clipDuration = draggedClip.endTime - draggedClip.startTime;
      const newStartTime = Math.max(0, (x - draggedClipOffsetX) / pixelsPerSecond);
      
      console.log("Déplacement du clip:", draggedClip.id);
      console.log("Nouvelle position:", newStartTime);
      
      // Créer une copie mise à jour du clip
      let updatedClip: Clip = {
        ...draggedClip,
        trackIndex,
        startTime: newStartTime,
        endTime: newStartTime + clipDuration
      };
      
      // Ajuster la position pour éviter les chevauchements UNIQUEMENT avec les autres clips
      // en excluant le clip en cours de déplacement
      const clipId = draggedClip.id || draggedClip._id?.toString();
      const otherClips = timeline.clips.filter(c => {
        const cId = c.id || c._id?.toString();
        return cId !== clipId;
      });
      console.log(`Vérification des chevauchements avec ${otherClips.length} autres clips`);
      
      updatedClip = adjustClipPosition(otherClips, updatedClip);
      
      // Mettre à jour UNIQUEMENT le clip déplacé, pas tous les clips
      updateClip(updatedClip);
      setSelectedClipId(updatedClip.id || updatedClip._id?.toString() || null);
      setDraggedClip(null);
    }
    else if (draggedAsset) {
      // Créer un nouveau clip à la position de drop
      let newClip: Clip = {
        id: `clip-${Date.now()}`,
        assetId: draggedAsset._id || draggedAsset.id,
        asset: draggedAsset, // Pour l'UI
        trackIndex,
        startTime: dropTime,
        endTime: dropTime + draggedAsset.duration,
        trimStart: 0,
        trimEnd: 0,
        volume: 1,
        effects: []
      };
      
      // Ajuster la position pour éviter les chevauchements
      newClip = adjustClipPosition(timeline.clips, newClip);
      
      const newTimeline = {
        ...timeline,
        clips: [...timeline.clips, newClip],
        duration: Math.max(timeline.duration, newClip.endTime)
      };
      
      onChange(newTimeline);
      setSelectedClipId(newClip.id as string);
      setDraggedAsset(null);
      setDropIndicator(prev => ({ ...prev, visible: false }));
    }
  };
  
  // Démarrer/arrêter la lecture
  const togglePlayback = () => {
    setPlaying(!playing);
  };
  
  // Effet pour la lecture
  useEffect(() => {
    let animationId: number;
    let lastTime = 0;
    
    const animate = (time: number) => {
      if (lastTime === 0) {
        lastTime = time;
      }
      
      lastTime = time;
      
      if (playing) {
        // La mise à jour du temps est maintenant gérée par le composant VideoPreview
        // Ici, nous gérons uniquement le défilement automatique de la timeline
        
        // Défilement automatique
        if (timelineRef.current) {
          const viewportWidth = timelineRef.current.clientWidth;
          const cursorPosition = currentTime * pixelsPerSecond;
          const scrollPosition = timelineRef.current.scrollLeft;
          const rightEdge = scrollPosition + viewportWidth - 100; // Marge de 100px
          
          // Défilement uniquement si le curseur s'approche du bord droit
          if (cursorPosition > rightEdge) {
            // Calcul de la position idéale : curseur à 2/3 de la vue
            const idealPosition = cursorPosition - (viewportWidth * 2/3);
            // Défilement progressif
            const newScrollPosition = scrollPosition + Math.min(10, idealPosition - scrollPosition);
            timelineRef.current.scrollLeft = Math.max(0, newScrollPosition);
          }
        }
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [playing, currentTime, pixelsPerSecond]);
  
  // Ajuster la position d'un clip pour éviter les chevauchements
  const adjustClipPosition = (clips: Clip[], newClip: Clip): Clip => {
    // Filtrer les clips sur la même piste
    const clipsOnTrack = clips.filter(clip => 
      clip.trackIndex === newClip.trackIndex
    );
    
    // Si aucun clip sur cette piste, pas besoin d'ajustement
    if (clipsOnTrack.length === 0) {
      console.log("Aucun autre clip sur cette piste, pas d'ajustement nécessaire");
      return newClip;
    }
    
    console.log(`Vérification des chevauchements sur la piste ${newClip.trackIndex} avec ${clipsOnTrack.length} clips`);
    
    // Vérifier les chevauchements
    const adjustedClip = { ...newClip };
    let overlap = false;
    let iterations = 0;
    const maxIterations = 10; // Limite pour éviter les boucles infinies
    
    do {
      overlap = false;
      iterations++;
      
      for (const clip of clipsOnTrack) {
        // Ignorer si c'est le même clip (bien que cela ne devrait pas se produire)
        if (clip.id === newClip.id) continue;
        
        // Vérifier si les intervalles se chevauchent
        if (
          adjustedClip.startTime < clip.endTime && 
          adjustedClip.endTime > clip.startTime
        ) {
          console.log(`Chevauchement détecté avec clip ${clip.id} (${clip.startTime} - ${clip.endTime})`);
          
          // Placer le clip après celui qui chevauche
          adjustedClip.startTime = clip.endTime;
          adjustedClip.endTime = adjustedClip.startTime + (newClip.endTime - newClip.startTime);
          
          console.log(`Nouvelle position: ${adjustedClip.startTime} - ${adjustedClip.endTime}`);
          
          overlap = true;
          break;
        }
      }
      
      // Éviter les boucles infinies
      if (iterations >= maxIterations) {
        console.warn("Nombre maximum d'itérations atteint pour l'ajustement de position");
        break;
      }
    } while (overlap);
    
    return adjustedClip;
  };
  
  // Calculer les marqueurs de temps pour la règle temporelle
  const [timeMarkers, setTimeMarkers] = useState<{
    primary: number[];
    secondary: number[];
  }>({
    primary: [],
    secondary: []
  });
  
  const calculateTimeMarkers = () => {
    const duration = timeline.duration || 60; // Durée par défaut de 60s si la timeline est vide
    
    // Calculer l'intervalle pour les marqueurs primaires en fonction du zoom
    // Plus le zoom est élevé, plus les marqueurs sont rapprochés
    const primaryInterval = scale <= 50 ? 10 : scale <= 100 ? 5 : 1;
    
    // Générer les marqueurs primaires
    const primary = [];
    for (let i = 0; i <= duration; i += primaryInterval) {
      primary.push(i);
    }
    
    // Générer les marqueurs secondaires
    const secondaryInterval = scale <= 50 ? 1 : 0.5;
    const secondary = [];
    for (let i = 0; i <= duration; i += secondaryInterval) {
      // Ne pas ajouter les marqueurs qui sont déjà des marqueurs primaires
      if (!primary.includes(i)) {
        secondary.push(i);
      }
    }
    
    return { primary, secondary };
  };
  
  // Initialiser les marqueurs de temps
  useEffect(() => {
    setTimeMarkers(calculateTimeMarkers());
  }, [timeline.duration, scale]);
  
  // Formater le temps en minutes:secondes.millisecondes
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };
  
  // Fonction pour transformer les URLs Cloudinary pour obtenir des thumbnails optimisées
  const getCloudinaryThumbnail = (url: string): string => {
    if (!url || !url.includes('cloudinary.com')) {
      console.log("URL non Cloudinary, retour de l'URL originale:", url);
      return url;
    }
    
    console.log("=== TRANSFORMATION D'URL ===");
    console.log("URL originale:", url);
    
    try {
      // Approche simplifiée: substitution directe de la structure d'URL
      // Format attendu: https://res.cloudinary.com/dexgnx9ki/video/upload/v1750192710/uploads/1750192708755-Enregistrement_de_l_e_cran_2025-06-17_a__22.mov
      // Format cible: https://res.cloudinary.com/dexgnx9ki/video/upload/c_fill,h_180,w_320/f_auto/v1/uploads/1750192708755-Enregistrement_de_l_e_cran_2025-06-17_a__22?_a=BAMAAARi0
      
      // 1. Extraire le nom du cloud
      const cloudNameMatch = url.match(/https:\/\/res\.cloudinary\.com\/([^\/]+)\//);
      if (!cloudNameMatch) {
        console.warn("Impossible d'extraire le nom du cloud de l'URL:", url);
        return url;
      }
      const cloudName = cloudNameMatch[1]; // ex: dexgnx9ki
      
      // 2. Rechercher le motif /v\d+/ dans l'URL
      const versionMatch = url.match(/\/v\d+\//);
      if (!versionMatch) {
        console.warn("Motif de version non trouvé dans l'URL:", url);
        return url;
      }
      
      // 3. Trouver l'emplacement du motif de version
      const versionIndex = url.indexOf(versionMatch[0]);
      const afterVersionIndex = versionIndex + versionMatch[0].length;
      
      // 4. Extraire le chemin après la version
      const pathAfterVersion = url.substring(afterVersionIndex);
      
      // 5. Enlever l'extension si présente
      let cleanPath = pathAfterVersion;
      if (cleanPath.includes('.')) {
        cleanPath = cleanPath.substring(0, cleanPath.lastIndexOf('.'));
      }
      
      console.log("Composants extraits:", { 
        cloudName, 
        pathAfterVersion, 
        cleanPath 
      });
      
      // 6. Construire la nouvelle URL
      const newUrl = `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,h_180,w_320/f_auto/v1/${cleanPath}?_a=BAMAAARi0`;
      
      console.log("URL transformée:", newUrl);
      console.log("=== FIN DE TRANSFORMATION ===");
      
      return newUrl;
    } catch (error) {
      console.error("Erreur lors de la transformation de l'URL:", error);
      return url;
    }
  };
  
  // Debug: vérification des clips chargés initialement
  useEffect(() => {
    if (timeline.clips.length > 0) {
      console.log("=== VÉRIFICATION DES CLIPS INITIAUX ===");
      console.log(`${timeline.clips.length} clips chargés`);
      
      timeline.clips.forEach((clip, index) => {
        if (clip.asset && clip.asset.storageUrl) {
          console.log(`Clip ${index} - URL originale:`, clip.asset.storageUrl);
          console.log(`Clip ${index} - URL transformée:`, getCloudinaryThumbnail(clip.asset.storageUrl));
        } else {
          console.log(`Clip ${index} - Pas d'URL disponible`);
        }
      });
      
      console.log("=== FIN DE VÉRIFICATION ===");
    }
  }, [timeline.clips]);
  
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Prévisualisation vidéo */}
      <div className="w-full bg-black aspect-video relative">
        <VideoPreview
          clips={timeline.clips}
          audioTracks={timeline.audioTracks}
          currentTime={currentTime}
          playing={playing}
          onTimeUpdate={(time) => setCurrentTime(time)}
          onEnded={() => setPlaying(false)}
        />
        
        {/* Contrôles de lecture */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 flex flex-col z-10">
          {/* Curseur de temps */}
          <div className="w-full mb-2 px-2">
            <input
              type="range"
              min={0}
              max={timeline.duration}
              step={0.01}
              value={currentTime}
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
          
          {/* Boutons de contrôle */}
          <div className="flex items-center">
            <button 
              onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}
              className="bg-gray-700 text-white rounded px-2 py-1 mr-2 text-xs"
              title="Reculer de 5 secondes"
            >
              -5s
            </button>
            
            <button 
              onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}
              className="bg-gray-700 text-white rounded px-2 py-1 mr-2 text-xs"
              title="Reculer d'une seconde"
            >
              -1s
            </button>
            
            <button 
              onClick={togglePlayback}
              className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center mx-2"
            >
              {playing ? '❚❚' : '▶'}
            </button>
            
            <button 
              onClick={() => setCurrentTime(Math.min(timeline.duration, currentTime + 1))}
              className="bg-gray-700 text-white rounded px-2 py-1 ml-2 text-xs"
              title="Avancer d'une seconde"
            >
              +1s
            </button>
            
            <button 
              onClick={() => setCurrentTime(Math.min(timeline.duration, currentTime + 5))}
              className="bg-gray-700 text-white rounded px-2 py-1 ml-2 text-xs"
              title="Avancer de 5 secondes"
            >
              +5s
            </button>
            
            <div className="text-white ml-4">
              {formatTime(currentTime)} / {formatTime(timeline.duration)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Contrôles de zoom */}
      <div className="flex items-center p-2 bg-gray-800 text-white">
        <button 
          onClick={() => setScale(Math.max(50, scale - 10))}
          className="px-2 py-1 bg-gray-700 rounded"
        >
          -
        </button>
        <span className="mx-2">{scale}%</span>
        <button 
          onClick={() => setScale(Math.min(200, scale + 10))}
          className="px-2 py-1 bg-gray-700 rounded"
        >
          +
        </button>
      </div>
      
      {/* Conteneur de timeline */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-x-auto bg-gray-900"
        onScroll={handleTimelineScroll}
      >
        {/* Règle temporelle */}
        <div 
          className="h-8 border-b border-gray-700 relative"
          style={{ width: `${timeline.duration * pixelsPerSecond}px` }}
        >
          {/* Marqueurs secondaires (plus petits) */}
          {timeMarkers.secondary.map((time) => (
            <div 
              key={`secondary-${time}`}
              className="absolute top-4 h-4 border-l border-gray-700"
              style={{ left: `${time * pixelsPerSecond}px` }}
            />
          ))}
          
          {/* Marqueurs primaires (avec étiquettes) */}
          {timeMarkers.primary.map((time) => (
            <div 
              key={`primary-${time}`}
              className="absolute top-0 h-8 border-l border-gray-600"
              style={{ left: `${time * pixelsPerSecond}px` }}
            >
              <span className="absolute top-0 left-1 text-xs text-gray-400">{formatTime(time)}</span>
            </div>
          ))}
          
          {/* Indicateur de temps actuel */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
          />
        </div>
        
        {/* Pistes vidéo */}
        <div className="flex flex-col">
          {Array.from({ length: 3 }).map((_, trackIndex) => (
            <div 
              key={`track-${trackIndex}`}
              className="h-20 border-b border-gray-700 relative"
              style={{ width: `${timeline.duration * pixelsPerSecond}px` }}
              onDragOver={(e) => handleDragOver(e, trackIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, trackIndex)}
              onClick={(e) => {
                // Ne pas réinitialiser la sélection lors d'un clic sur la piste
                e.stopPropagation();
              }}
            >
              {/* Clips de cette piste */}
              {timeline.clips
                .filter(clip => clip.trackIndex === trackIndex)
                .map((clip, index) => {
                  // Utiliser un identifiant de secours si ni clip.id ni clip._id n'est défini
                  const clipKey = clip.id || clip._id?.toString() || `fallback-${trackIndex}-${index}`;
                  const isSelected = (clip.id === selectedClipId) || (clip._id?.toString() === selectedClipId);
                  
                  return (
                    <div
                      key={clipKey}
                      className={`absolute top-1 bottom-1 rounded overflow-hidden cursor-grab ${
                        isSelected ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        left: `${clip.startTime * pixelsPerSecond}px`,
                        width: `${(clip.endTime - clip.startTime) * pixelsPerSecond}px`,
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(75, 85, 99, 0.5)'
                      }}
                      onClick={(e) => {
                        // Empêcher la propagation pour éviter les sélections multiples
                        e.stopPropagation();
                        // Normaliser l'ID du clip (utiliser _id comme fallback)
                        const clipId = clip.id || clip._id?.toString();
                        if (clipId) {
                          console.log(`Sélection du clip ${clipId}`);
                          setSelectedClipId(clipId);
                        } else {
                          console.warn("Tentative de sélection d'un clip sans ID");
                        }
                      }}
                      draggable={true}
                      onDragStart={(e) => handleClipDragStart(e, clip)}
                      onDragEnd={handleClipDragEnd}
                    >
                      {/* Affichage du contenu du clip */}
                      {clip.asset && clip.asset.storageUrl ? (
                        <div className="w-full h-full relative" 
                          onLoad={() => console.log("Rendu du clip avec URL:", clip.asset?.storageUrl)}>
                          <img 
                            src={getCloudinaryThumbnail(clip.asset.storageUrl)} 
                            alt={`Clip ${clip.id || index}`}
                            className="w-full h-full object-cover"
                            onLoad={(e) => {
                              console.log("Image chargée:", (e.target as HTMLImageElement).src);
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 truncate">
                            {clip.asset.originalName || "Sans titre"}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xs">
                          {clip.assetId ? "Asset non disponible" : "Clip invalide"}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
        
        {/* Bibliothèque d'assets */}
        <div className="mt-4 border-t border-gray-700 p-2">
          <h3 className="text-white font-semibold mb-2">Assets vidéo</h3>
          <div className="grid grid-cols-3 gap-2">
            {videoAssets.map(asset => (
              <div 
                key={asset._id || asset.id}
                className="bg-gray-800 rounded overflow-hidden cursor-pointer"
                draggable
                onDragStart={() => handleDragStart(asset)}
                onClick={() => addClip(asset)}
              >
                <div className="aspect-video relative">
                  {asset.metadata?.thumbnailUrl ? (
                    <img 
                      src={asset.metadata.thumbnailUrl} 
                      alt={asset.originalName}
                      width={160}
                      height={90}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <VideoThumbnail
                      videoUrl={asset.storageUrl}
                      alt={asset.originalName}
                      width={160}
                      height={90}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-2">
                  <div className="text-white text-sm truncate">{asset.originalName}</div>
                  <div className="text-gray-400 text-xs">{formatTime(asset.duration)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Propriétés du clip sélectionné */}
      {selectedClip && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <h3 className="text-white text-lg mb-2">Propriétés du clip</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1">Début du clip</label>
              <input
                type="number"
                min={0}
                max={selectedClip.endTime - 0.1}
                step={0.1}
                value={selectedClip.startTime}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  updateClip({
                    ...selectedClip,
                    startTime: value
                  } as Clip);
                }}
                className="w-full bg-gray-700 text-white p-2 rounded"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Fin du clip</label>
              <input
                type="number"
                min={selectedClip.startTime + 0.1}
                step={0.1}
                value={selectedClip.endTime}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  updateClip({
                    ...selectedClip,
                    endTime: value
                  } as Clip);
                }}
                className="w-full bg-gray-700 text-white p-2 rounded"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Volume</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={selectedClip.volume || 1}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  updateClip({
                    ...selectedClip,
                    volume: value
                  } as Clip);
                }}
                className="w-full"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => removeClip(selectedClip.id as string)}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Supprimer le clip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fonction utilitaire pour formater le temps
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export { TimelineEditor };
