'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

import { Timeline, Clip, AudioTrack, VideoAsset } from '@interface';

import { VideoThumbnail } from './VideoThumbnail';
import VideoPreview from './VideoPreview';
import { AudioTrackComponent } from './AudioTrackComponent';
import { OptimizedImage } from './OptimizedImage';

import { CutToolHandler, CutToolCallbacks, CutToolButton, CutToolUI } from '@utils';
import Icon from './Icon';

interface TimelineEditorProps {
  timeline: Timeline;
  videoAssets: VideoAsset[];
  onChange: (timeline: Timeline) => void;
  onShowAssetModal?: () => void;
}

/**
 * Composant d'édition de timeline
 * Ce composant permet de créer une interface de montage vidéo type InShot
 */
const TimelineEditor: React.FC<TimelineEditorProps> = ({
  timeline,
  videoAssets,
  onChange,
  onShowAssetModal
}) => {
  // Références et états
  const timelineRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(100); // Échelle de zoom en %
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string | null>(null);
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

  // États pour l'outil de découpe - intégration du CutToolHandler
  const [cutToolActive, setCutToolActive] = useState(false);
  
  const cutToolCallbacks: CutToolCallbacks = {
    onTimelineUpdate: onChange,
    onClipSelect: setSelectedClipId,
    onAudioTrackSelect: setSelectedAudioTrackId,
    onError: (message: string) => {
      console.error('Erreur outil de découpe:', message);
      // TODO: Afficher une notification d'erreur à l'utilisateur
    }
  };
  
  const [cutToolHandler] = useState(() => new CutToolHandler(timeline, cutToolCallbacks));

  // Fonction pour toggle le cut tool avec mise à jour de l'état local
  const toggleCutTool = useCallback(() => {
    cutToolHandler.toggle();
    setCutToolActive(cutToolHandler.isActive());
  }, [cutToolHandler]);
  
  // Calculer la durée visible en pixels
  const pixelsPerSecond = scale / 10; // 10px par seconde à 100% de zoom
  
  // Générer un ID unique pour les clips et tracks
  const generateUniqueId = useCallback((type: 'clip' | 'audio') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${type}-${timestamp}-${random}`;
  }, []);
  
  // Fonction utilitaire pour obtenir le nom d'affichage d'un asset
  const getAssetDisplayName = useCallback((asset?: VideoAsset): string => {
    if (!asset) return "Asset inconnu";
    
    // Préférer originalName s'il existe, sinon utiliser d'autres propriétés
    if (asset.originalName) {
      return asset.originalName;
    }
    
    // Essayer d'extraire le nom du chemin de stockage
    if (asset.storageUrl) {
      try {
        const url = new URL(asset.storageUrl);
        const pathname = url.pathname;
        const filename = pathname.split('/').pop();
        if (filename && filename !== '') {
          // Nettoyer le nom de fichier (supprimer les timestamps, etc.)
          return filename.replace(/^\d+-/, '').replace(/\?.*$/, '');
        }
      } catch {
        console.warn("Impossible d'extraire le nom du fichier de l'URL:", asset.storageUrl);
      }
    }
    
    // Fallback vers l'ID ou un nom générique
    const assetId = asset._id?.toString() || asset.id?.toString();
    return assetId ? `Asset ${assetId.substring(0, 8)}...` : "Asset sans nom";
  }, []);

  // Fonction utilitaire pour détecter si un asset a de l'audio
  const assetHasAudio = useCallback((asset: VideoAsset): boolean => {
    // Vérifier d'abord la propriété hasAudio si elle est définie
    if (asset.hasAudio !== undefined) {
      return asset.hasAudio;
    }
    
    // Sinon, détecter automatiquement basé sur les métadonnées
    const metadata = asset.metadata;
    if (metadata && metadata.audioChannels && metadata.audioChannels > 0) {
      return true;
    }
    
    // Détecter basé sur le type MIME
    const mimeType = asset.mimeType.toLowerCase();
    if (mimeType.includes('audio/') || 
        (mimeType.includes('video/') && !mimeType.includes('gif'))) {
      // La plupart des formats vidéo ont de l'audio sauf les GIFs
      return true;
    }
    
    // Par défaut, supposer qu'il y a de l'audio pour les vidéos
    return true;
  }, []);
  
  // Fonctions utilitaires pour la gestion des pistes audio synchronisées
  
  /**
   * Créer une piste audio liée automatiquement à un clip vidéo
   */
  const createLinkedAudioTrack = useCallback((videoClip: Clip): AudioTrack | null => {
    // Vérifier si le clip vidéo a de l'audio
    if (!videoClip.asset || !assetHasAudio(videoClip.asset)) {
      return null;
    }
    
    const trackId = generateUniqueId('audio');
    const audioTrack: AudioTrack = {
      id: trackId,
      assetId: videoClip.assetId,
      asset: videoClip.asset,
      trackIndex: 0, // Piste audio principale (pour l'audio des vidéos)
      startTime: videoClip.startTime,
      endTime: videoClip.endTime,
      volume: videoClip.volume || 1,
      fadeIn: 0,
      fadeOut: 0,
      linkedVideoClipId: videoClip.id || videoClip._id?.toString()
    };
    
    return audioTrack;
  }, [assetHasAudio, generateUniqueId]);
  
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
    const updatedClips = timeline.clips.map((clip) => {
      // Normaliser l'ID du clip (gérer à la fois string et ObjectId)
      const clipAssetId = clip.assetId?.toString();
      
      // Si pas d'assetId, on ne peut pas associer
      if (!clipAssetId) {
        console.warn(`Clip sans assetId:`, clip);
        return clip;
      }
      
      // S'assurer que le clip a un ID unique
      if (!clip.id && !clip._id) {
        hasUpdatedClips = true;
        const newId = generateUniqueId('clip');
        console.log(`Attribution d'un nouvel ID au clip: ${newId}`);
        clip = { ...clip, id: newId };
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
              !clip.asset.originalName || // Forcer la mise à jour si le nom manque
              (freshAsset.updatedAt && clip.asset.updatedAt && 
               new Date(freshAsset.updatedAt) > new Date(clip.asset.updatedAt))
            )) {
            console.log(`Mise à jour de l'asset pour le clip ${clip.id} (${clipAssetId}) - nom manquant ou asset plus récent`);
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
      // console.log(`✅ Mise à jour réussie de ${updatedClips.filter(c => c.asset).length}/${updatedClips.length} clips`);
      onChange({
        ...timeline,
        clips: updatedClips
      });
    } else {
      // console.log("Aucun clip n'a besoin d'être mis à jour");
    }
    
    // console.log("=== Fin de l'association des assets aux clips ===");
  }, [timeline, videoAssets, onChange, generateUniqueId]);
  
  // Fonction d'aide pour associer les assets vidéo aux pistes audio
  const ensureAudioTracksHaveAssets = useCallback(() => {
    // Si pas de pistes audio, on ne fait rien
    if (!timeline.audioTracks.length) {
      return;
    }
    
    // Si pas d'assets, loguer l'erreur mais continuer
    if (!videoAssets.length) {
      console.warn("Aucun asset vidéo disponible, impossible d'associer les pistes audio");
      return;
    }

    console.log("=== Début de l'association des assets aux pistes audio ===");
    console.log(`Assets disponibles: ${videoAssets.length}`);
    console.log(`Pistes audio à associer: ${timeline.audioTracks.length}`);
    
    // Map pour accéder rapidement aux assets par ID
    const assetsMap = new Map();
    videoAssets.forEach(asset => {
      const assetId = asset._id?.toString() || asset.id?.toString();
      if (assetId) {
        assetsMap.set(assetId, asset);
        console.log(`Asset mappé: ${assetId} -> ${asset.originalName || 'pas de nom'}`);
      }
    });
    
    // Vérifier si des pistes audio ont besoin d'être mises à jour
    let hasUpdatedTracks = false;
    const updatedTracks = timeline.audioTracks.map((track) => {
      const trackAssetId = track.assetId?.toString();
      
      console.log(`Traitement de la piste audio: ${track.id || 'pas d\'ID'}, assetId: ${trackAssetId}, asset actuel: ${track.asset?.originalName || 'pas de nom'}`);
      
      // Si pas d'assetId, on ne peut pas associer
      if (!trackAssetId) {
        console.warn(`Piste audio sans assetId:`, track);
        return track;
      }
      
      // S'assurer que la piste a un ID unique
      if (!track.id && !track._id) {
        hasUpdatedTracks = true;
        const newId = generateUniqueId('audio');
        console.log(`Attribution d'un nouvel ID à la piste audio: ${newId}`);
        track = { ...track, id: newId };
      }
      
      // Si la piste a déjà un asset valide, vérifier qu'il est complet
      if (track.asset) {
        if (track.asset.storageUrl) {
          const freshAsset = assetsMap.get(trackAssetId);
          if (freshAsset && freshAsset.storageUrl) {
            // Forcer la mise à jour si le nom manque ou si l'asset est plus récent
            const needsUpdate = (
              !track.asset.originalName || // Nom manquant
              !track.asset.metadata || 
              !track.asset.duration || 
              (freshAsset.updatedAt && track.asset.updatedAt && 
               new Date(freshAsset.updatedAt) > new Date(track.asset.updatedAt))
            );
            
            if (needsUpdate) {
              console.log(`Mise à jour de l'asset pour la piste audio ${track.id} (${trackAssetId}) - raison: ${!track.asset.originalName ? 'nom manquant' : 'asset plus récent'}`);
              hasUpdatedTracks = true;
              return { ...track, asset: freshAsset };
            }
          }
          
          return track;
        }
      }
      
      // Chercher l'asset correspondant
      const matchingAsset = assetsMap.get(trackAssetId);
      if (matchingAsset) {
        hasUpdatedTracks = true;
        console.log(`Asset trouvé pour la piste audio ${track.id}, assetId: ${trackAssetId}`);
        return { ...track, asset: matchingAsset };
      } else {
        console.warn(`⚠️ Aucun asset trouvé pour la piste audio avec l'ID: ${trackAssetId}`);
      }
      
      return track;
    });

    // Si des pistes ont été mises à jour, mettre à jour la timeline
    if (hasUpdatedTracks) {
      onChange({
        ...timeline,
        audioTracks: updatedTracks
      });
    }
    
    console.log("=== Fin de l'association des assets aux pistes audio ===");
  }, [timeline, videoAssets, onChange, generateUniqueId]);
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
      ensureAudioTracksHaveAssets();
    }
  }, [ensureClipsHaveAssets, ensureAudioTracksHaveAssets, timeline, onChange]);

  // Effet pour mettre à jour la timeline dans le CutToolHandler
  useEffect(() => {
    cutToolHandler.updateTimeline(timeline);
  }, [timeline, cutToolHandler]);

  // Effet pour les gestionnaires d'événements du CutTool
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const wasActive = cutToolHandler.isActive();
      cutToolHandler.handleKeyDown(event);
      const isNowActive = cutToolHandler.isActive();
      
      // Mettre à jour l'état local si l'état a changé
      if (wasActive !== isNowActive) {
        setCutToolActive(isNowActive);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cutToolHandler]);
  
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
  const addClip = (asset: VideoAsset, trackIndex = 0, forceAudioOnly = false) => {
    if (forceAudioOnly && assetHasAudio(asset)) {
      // Ajouter uniquement comme piste audio indépendante
      addAudioTrack(asset, 1); // Piste 1 par défaut pour l'audio indépendant
      return;
    }
    
    // Vérifier s'il existe déjà un clip pour cet asset pour éviter la duplication
    const assetId = asset._id?.toString() || asset.id?.toString();
    const existingClip = timeline.clips.find(clip => 
      (clip.assetId?.toString() === assetId) && 
      (clip.trackIndex === trackIndex)
    );
    
    if (existingClip) {
      console.log(`Clip déjà présent pour l'asset ${assetId} sur la piste ${trackIndex}`);
      setSelectedClipId(existingClip.id || existingClip._id?.toString() || null);
      return;
    }
    
    // Comportement normal : ajouter comme clip vidéo (avec audio automatique si présent)
    // Calculer la position de départ du nouveau clip
    let startTime = currentTime;
    
    // Si des clips existent déjà, placer le nouveau clip à la fin du dernier
    if (timeline.clips.length > 0) {
      // Trouver le temps de fin maximum parmi tous les clips
      const maxEndTime = Math.max(...timeline.clips.map(clip => clip.endTime));
      startTime = maxEndTime;
    }
    
    const clipId = generateUniqueId('clip');
    const newClip: Clip = {
      id: clipId,
      assetId: assetId,
      asset, // Pour l'UI
      trackIndex,
      startTime,
      endTime: startTime + asset.duration,
      trimStart: 0,
      trimEnd: 0,
      volume: 1,
      effects: []
    };
    
    // Créer automatiquement une piste audio liée si le clip a de l'audio
    const newAudioTracks = [...timeline.audioTracks];
    if (assetHasAudio(asset)) {
      const linkedAudioTrack = createLinkedAudioTrack(newClip);
      if (linkedAudioTrack) {
        newAudioTracks.push(linkedAudioTrack);
      }
    }
    
    const newTimeline = {
      ...timeline,
      clips: [...timeline.clips, newClip],
      audioTracks: newAudioTracks,
      duration: Math.max(timeline.duration, newClip.endTime)
    };
    
    onChange(newTimeline);
    setSelectedClipId(newClip.id as string);
  };
  
  // Modifier un clip
  const updateClip = useCallback((updatedClip: Clip) => {
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
    
    // Mettre à jour automatiquement la piste audio liée si elle existe
    const newAudioTracks = [...timeline.audioTracks];
    const clipId = updatedClip.id || updatedClip._id?.toString();
    
    if (updatedClip.asset && assetHasAudio(updatedClip.asset) && clipId) {
      const linkedAudioTrackIndex = newAudioTracks.findIndex(
        track => track.linkedVideoClipId === clipId
      );
      
      if (linkedAudioTrackIndex >= 0) {
        // Synchroniser la piste audio existante avec le clip vidéo mis à jour
        const updatedAudioTrack: AudioTrack = {
          ...newAudioTracks[linkedAudioTrackIndex],
          startTime: updatedClip.startTime,
          endTime: updatedClip.endTime,
          volume: updatedClip.volume || newAudioTracks[linkedAudioTrackIndex].volume || 1
        };
        newAudioTracks[linkedAudioTrackIndex] = updatedAudioTrack;
      } else {
        // Créer une nouvelle piste audio liée si elle n'existe pas
        const newLinkedAudioTrack = createLinkedAudioTrack(updatedClip);
        if (newLinkedAudioTrack) {
          newAudioTracks.push(newLinkedAudioTrack);
        }
      }
    }
    
    // Recalculer la durée totale de la timeline
    const maxEndTime = Math.max(...newClips.map(clip => clip.endTime));
    
    // Créer une nouvelle timeline avec les clips et audio mis à jour
    const newTimeline = {
      ...timeline,
      clips: newClips,
      audioTracks: newAudioTracks,
      duration: Math.max(timeline.duration, maxEndTime)
    };
    
    // Appliquer les changements
    onChange(newTimeline);
  }, [timeline, onChange, createLinkedAudioTrack, assetHasAudio]);
  
  // Supprimer un clip
  const removeClip = (clipId: string) => {
    const newClips = timeline.clips.filter(clip => clip.id !== clipId);
    
    // Supprimer automatiquement la piste audio liée si elle existe
    const newAudioTracks = timeline.audioTracks.filter(
      track => track.linkedVideoClipId !== clipId
    );
    
    // Recalculer la durée totale si nécessaire
    const maxEndTime = newClips.length ? Math.max(...newClips.map(clip => clip.endTime)) : 0;
    
    const newTimeline = {
      ...timeline,
      clips: newClips,
      audioTracks: newAudioTracks,
      duration: maxEndTime
    };
    
    onChange(newTimeline);
    setSelectedClipId(null);
  };
  
  // Ajouter une piste audio
  const addAudioTrack = (asset: VideoAsset, trackIndex = 1) => { // trackIndex = 1 pour éviter la piste 0 réservée aux vidéos
    // Vérifier s'il existe déjà une piste audio pour cet asset sur cette piste pour éviter la duplication
    const assetId = asset._id?.toString() || asset.id?.toString();
    const existingTrack = timeline.audioTracks.find(track => 
      (track.assetId?.toString() === assetId) && 
      (track.trackIndex === trackIndex) &&
      !track.linkedVideoClipId // Seulement pour les pistes indépendantes
    );
    
    if (existingTrack) {
      console.log(`Piste audio déjà présente pour l'asset ${assetId} sur la piste ${trackIndex}`);
      setSelectedAudioTrackId(existingTrack.id || existingTrack._id?.toString() || null);
      return;
    }
    
    const trackId = generateUniqueId('audio');
    let newAudioTrack: AudioTrack = {
      id: trackId,
      assetId: assetId,
      asset, // Pour l'UI
      trackIndex,
      startTime: currentTime,
      endTime: currentTime + asset.duration,
      volume: 1,
      fadeIn: 0,
      fadeOut: 0
      // Pas de linkedVideoClipId pour les pistes indépendantes
    };
    
    // Ajuster la position pour éviter les chevauchements
    newAudioTrack = adjustAudioTrackPosition(timeline.audioTracks, newAudioTrack);
    
    const newTimeline = {
      ...timeline,
      audioTracks: [...timeline.audioTracks, newAudioTrack],
      duration: Math.max(timeline.duration, newAudioTrack.endTime)
    };
    
    onChange(newTimeline);
    setSelectedAudioTrackId(trackId);
  };
  
  // Modifier une piste audio
  const updateAudioTrack = useCallback((updatedTrack: AudioTrack) => {
    const trackId = updatedTrack.id || updatedTrack._id?.toString();
    console.log(`Mise à jour de la piste audio ${trackId}:`, updatedTrack);
    
    if (!trackId) {
      console.error("Impossible de mettre à jour une piste audio sans ID");
      return;
    }
    
    const existingTrackIndex = timeline.audioTracks.findIndex(track => {
      const existingTrackId = track.id || track._id?.toString();
      return existingTrackId === trackId;
    });
    
    if (existingTrackIndex === -1) {
      console.error(`Piste audio introuvable: ${trackId}`);
      console.log("Pistes disponibles:", timeline.audioTracks.map(t => ({
        id: t.id || t._id?.toString(),
        assetId: t.assetId,
        trackIndex: t.trackIndex
      })));
      return;
    }
    
    // Vérifier s'il y a duplication avec une piste existante (pour les pistes indépendantes)
    if (!updatedTrack.linkedVideoClipId) {
      const assetId = updatedTrack.assetId?.toString();
      const duplicateTrack = timeline.audioTracks.find((track, index) => {
        const existingTrackId = track.id || track._id?.toString();
        const existingAssetId = track.assetId?.toString();
        
        return (
          index !== existingTrackIndex && // Différent de la piste qu'on modifie
          existingAssetId === assetId && // Même asset
          track.trackIndex === updatedTrack.trackIndex && // Même piste
          !track.linkedVideoClipId && // Piste indépendante
          existingTrackId !== trackId // Différent ID (sécurité supplémentaire)
        );
      });
      
      if (duplicateTrack) {
        console.log(`Duplication détectée lors de la mise à jour de la piste audio. Suppression de la piste existante.`);
        // Supprimer la piste en double et continuer avec la mise à jour
        const newAudioTracks = timeline.audioTracks.filter((_, index) => 
          index !== timeline.audioTracks.findIndex(t => 
            (t.id || t._id?.toString()) === (duplicateTrack.id || duplicateTrack._id?.toString())
          )
        );
        timeline.audioTracks = newAudioTracks;
      }
    }
    
    const newAudioTracks = [...timeline.audioTracks];
    newAudioTracks[existingTrackIndex] = updatedTrack;
    
    // Recalculer la durée totale
    const maxEndTime = Math.max(
      ...timeline.clips.map(clip => clip.endTime),
      ...newAudioTracks.map(track => track.endTime)
    );
    
    const newTimeline = {
      ...timeline,
      audioTracks: newAudioTracks,
      duration: Math.max(timeline.duration, maxEndTime)
    };
    
    onChange(newTimeline);
  }, [timeline, onChange]);
  
  // Supprimer une piste audio
  const removeAudioTrack = (trackId: string) => {
    const newAudioTracks = timeline.audioTracks.filter(track => 
      track.id !== trackId && track._id?.toString() !== trackId
    );
    
    const newTimeline = {
      ...timeline,
      audioTracks: newAudioTracks
    };
    
    onChange(newTimeline);
    setSelectedAudioTrackId(null);
  };
  
  // Gestion du glisser-déposer
  const handleDragStart = (asset: VideoAsset) => {
    setDraggedAsset(asset);
    setIsDragging(true);
  };
  
  // Pour le drag & drop des clips déjà présents dans la timeline
  const [draggedClip, setDraggedClip] = useState<Clip | null>(null);
  const [draggedClipOffsetX, setDraggedClipOffsetX] = useState<number>(0);
  
  // Pour le drag & drop des pistes audio indépendantes
  const [draggedAudioTrack, setDraggedAudioTrack] = useState<AudioTrack | null>(null);
  const [draggedAudioOffsetX, setDraggedAudioOffsetX] = useState<number>(0);
  
  // État global pour tracker si on est en cours de drag
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // États pour le trimming des clips
  const [trimmingClip, setTrimmingClip] = useState<Clip | null>(null);
  const [trimmingType, setTrimmingType] = useState<'start' | 'end' | null>(null);
  const [trimmingStartX, setTrimmingStartX] = useState<number>(0);
  const [originalClipData, setOriginalClipData] = useState<{
    startTime: number;
    endTime: number;
    trimStart: number;
    trimEnd: number;
    assetDuration: number;
  } | null>(null);
  
  // Commencer à glisser une piste audio existante
  const handleAudioTrackDragStart = (e: React.DragEvent, track: AudioTrack) => {
    e.stopPropagation();
    setDraggedAudioTrack(track);
    setIsDragging(true);
    
    // Calculer l'offset pour maintenir la position relative du pointeur dans la piste
    const trackElement = e.currentTarget as HTMLElement;
    const trackRect = trackElement.getBoundingClientRect();
    const offsetX = e.clientX - trackRect.left;
    setDraggedAudioOffsetX(offsetX);
    
    // Définir les données de transfert
    const trackId = track.id || track._id?.toString() || '';
    e.dataTransfer.setData('text/plain', trackId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Appliquer une classe visuelle
    trackElement.classList.add('opacity-50');
  };

  // Gérer la fin du glisser-déposer d'une piste audio
  const handleAudioTrackDragEnd = () => {
    setDraggedAudioTrack(null);
    setDraggedAudioOffsetX(0);
    setIsDragging(false);
    setDropIndicator(prev => ({ ...prev, visible: false }));
  };  // Commencer à glisser un clip existant
  const handleClipDragStart = (e: React.DragEvent, clip: Clip) => {
    e.stopPropagation();
    setDraggedClip(clip);
    setIsDragging(true);
    
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
    setIsDragging(false);
    setDropIndicator(prev => ({ ...prev, visible: false }));
  };
  
  const handleDragOver = (e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Mise à jour de l'indicateur de drop
    let width = 100; // largeur par défaut
    let position = x;
    
    if (draggedClip) {
      // Si on déplace un clip existant, utiliser sa durée actuelle
      const clipDuration = draggedClip.endTime - draggedClip.startTime;
      width = clipDuration * pixelsPerSecond;
      position = x - draggedClipOffsetX;
    } else if (draggedAudioTrack) {
      // Si on déplace une piste audio existante, utiliser sa durée actuelle
      const trackDuration = draggedAudioTrack.endTime - draggedAudioTrack.startTime;
      width = trackDuration * pixelsPerSecond;
      position = x - draggedAudioOffsetX;
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
      
      updatedClip = adjustClipPosition(timeline.clips, updatedClip, clipId);
      
      // Mettre à jour UNIQUEMENT le clip déplacé, pas tous les clips
      updateClip(updatedClip);
      setSelectedClipId(updatedClip.id || updatedClip._id?.toString() || null);
      setDraggedClip(null);
      setIsDragging(false);
    }
    else if (draggedAudioTrack && !draggedAudioTrack.linkedVideoClipId) {
      // Déplacer une piste audio indépendante existante
      const trackDuration = draggedAudioTrack.endTime - draggedAudioTrack.startTime;
      const newStartTime = Math.max(0, (x - draggedAudioOffsetX) / pixelsPerSecond);
      
      const trackId = draggedAudioTrack.id || draggedAudioTrack._id?.toString() || 'unknown';
      console.log("Déplacement de la piste audio:", trackId);
      console.log("Nouvelle position:", newStartTime);
      
      // Créer une copie mise à jour de la piste audio
      let updatedAudioTrack: AudioTrack = {
        ...draggedAudioTrack,
        trackIndex,
        startTime: newStartTime,
        endTime: newStartTime + trackDuration
      };
      
      // Ajuster la position pour éviter les chevauchements avec les autres pistes audio
      updatedAudioTrack = adjustAudioTrackPosition(timeline.audioTracks, updatedAudioTrack, trackId);
      
      console.log(`Mise à jour de la piste audio ${trackId}:`, updatedAudioTrack);
      
      // Mettre à jour la piste audio
      updateAudioTrack(updatedAudioTrack);
      setSelectedAudioTrackId(trackId);
      setDraggedAudioTrack(null);
      setDraggedAudioOffsetX(0);
      setIsDragging(false);
    }
    else if (draggedAsset) {
      // Déterminer si on ajoute un clip vidéo ou une piste audio
      const targetElement = e.currentTarget as HTMLElement;
      const isAudioTrack = targetElement.querySelector('.absolute .text-gray-400')?.textContent?.includes('Audio');
      
      if (isAudioTrack && assetHasAudio(draggedAsset)) {
        // Ajouter une piste audio indépendante
        const dropTime = Math.max(0, (x - 50) / pixelsPerSecond); // 50px d'offset pour centrer
        
        // Vérifier s'il existe déjà une piste audio pour cet asset sur cette piste
        const assetId = draggedAsset._id?.toString() || draggedAsset.id?.toString();
        const existingTrack = timeline.audioTracks.find(track => 
          (track.assetId?.toString() === assetId) && 
          (track.trackIndex === trackIndex) &&
          !track.linkedVideoClipId // Seulement pour les pistes indépendantes
        );
        
        if (existingTrack) {
          console.log(`Piste audio déjà présente pour l'asset ${assetId} sur la piste ${trackIndex}`);
          setSelectedAudioTrackId(existingTrack.id || existingTrack._id?.toString() || null);
          setDraggedAsset(null);
          return;
        }
        
        const trackId = generateUniqueId('audio');
        let newAudioTrack: AudioTrack = {
          id: trackId,
          assetId: assetId,
          asset: draggedAsset,
          trackIndex,
          startTime: dropTime,
          endTime: dropTime + draggedAsset.duration,
          volume: 1,
          fadeIn: 0,
          fadeOut: 0
          // Pas de linkedVideoClipId car c'est une piste indépendante
        };
        
        // Ajuster la position pour éviter les chevauchements
        newAudioTrack = adjustAudioTrackPosition(timeline.audioTracks, newAudioTrack);
        
        const newTimeline = {
          ...timeline,
          audioTracks: [...timeline.audioTracks, newAudioTrack],
          duration: Math.max(timeline.duration, newAudioTrack.endTime)
        };
        
        onChange(newTimeline);
        setSelectedAudioTrackId(trackId);
        setDraggedAsset(null);
        setIsDragging(false);
      } else {
        // Ajouter un clip vidéo (comportement original)
        const dropTime = Math.max(0, (x - 50) / pixelsPerSecond);
        
        // Vérifier s'il existe déjà un clip pour cet asset sur cette piste pour éviter la duplication
        const assetId = draggedAsset._id?.toString() || draggedAsset.id?.toString();
        const existingClip = timeline.clips.find(clip => 
          (clip.assetId?.toString() === assetId) && 
          (clip.trackIndex === trackIndex)
        );
        
        if (existingClip) {
          console.log(`Clip déjà présent pour l'asset ${assetId} sur la piste ${trackIndex}`);
          setSelectedClipId(existingClip.id || existingClip._id?.toString() || null);
          setDraggedAsset(null);
          return;
        }
        
        const clipId = generateUniqueId('clip');
        let newClip: Clip = {
          id: clipId,
          assetId: assetId,
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
        
        // Créer automatiquement une piste audio liée si le clip a de l'audio
        const newAudioTracks = [...timeline.audioTracks];
        if (assetHasAudio(draggedAsset)) {
          const linkedAudioTrack = createLinkedAudioTrack(newClip);
          if (linkedAudioTrack) {
            newAudioTracks.push(linkedAudioTrack);
          }
        }
        
        const newTimeline = {
          ...timeline,
          clips: [...timeline.clips, newClip],
          audioTracks: newAudioTracks,
          duration: Math.max(timeline.duration, newClip.endTime)
        };
        
        onChange(newTimeline);
        setSelectedClipId(clipId);
        setDraggedAsset(null);
        setIsDragging(false);
      }
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
  const adjustClipPosition = (clips: Clip[], newClip: Clip, excludeClipId?: string): Clip => {
    // Filtrer les clips sur la même piste et exclure le clip spécifié si fourni
    const clipsOnTrack = clips.filter(clip => {
      const clipId = clip.id || clip._id?.toString();
      const shouldExclude = excludeClipId && (clipId === excludeClipId);
      return clip.trackIndex === newClip.trackIndex && !shouldExclude;
    });
    
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
  
  // Ajuster la position d'une piste audio pour éviter les chevauchements
  const adjustAudioTrackPosition = (tracks: AudioTrack[], newTrack: AudioTrack, excludeTrackId?: string): AudioTrack => {
    // Filtrer les pistes sur la même piste et exclure la piste spécifiée si fournie
    const tracksOnSameLine = tracks.filter(track => {
      const trackId = track.id || track._id?.toString();
      const shouldExclude = excludeTrackId && (trackId === excludeTrackId);
      return track.trackIndex === newTrack.trackIndex && !shouldExclude && !track.linkedVideoClipId;
    });
    
    // Si aucune piste sur cette ligne, pas besoin d'ajustement
    if (tracksOnSameLine.length === 0) {
      console.log("Aucune autre piste audio sur cette ligne, pas d'ajustement nécessaire");
      return newTrack;
    }
    
    console.log(`Vérification des chevauchements de piste audio sur la ligne ${newTrack.trackIndex} avec ${tracksOnSameLine.length} pistes`);
    
    // Vérifier les chevauchements
    const adjustedTrack = { ...newTrack };
    let overlap = false;
    let iterations = 0;
    const maxIterations = 10; // Limite pour éviter les boucles infinies
    
    do {
      overlap = false;
      iterations++;
      
      for (const track of tracksOnSameLine) {
        // Vérifier si les intervalles se chevauchent
        if (
          adjustedTrack.startTime < track.endTime && 
          adjustedTrack.endTime > track.startTime
        ) {
          console.log(`Chevauchement de piste audio détecté avec ${track.id} (${track.startTime} - ${track.endTime})`);
          
          // Placer la piste après celle qui chevauche
          adjustedTrack.startTime = track.endTime;
          adjustedTrack.endTime = adjustedTrack.startTime + (newTrack.endTime - newTrack.startTime);
          
          console.log(`Nouvelle position de piste audio: ${adjustedTrack.startTime} - ${adjustedTrack.endTime}`);
          
          overlap = true;
          break;
        }
      }
      
      // Éviter les boucles infinies
      if (iterations >= maxIterations) {
        console.warn("Nombre maximum d'itérations atteint pour l'ajustement de position de piste audio");
        break;
      }
    } while (overlap);
    
    return adjustedTrack;
  };
  
  // Calculer les marqueurs de temps pour la règle temporelle
  const [timeMarkers, setTimeMarkers] = useState<{
    primary: number[];
    secondary: number[];
  }>({
    primary: [],
    secondary: []
  });
  
  const calculateTimeMarkers = useCallback(() => {
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
  }, [timeline.duration, scale]);
  
  // Initialiser les marqueurs de temps
  useEffect(() => {
    setTimeMarkers(calculateTimeMarkers());
  }, [timeline.duration, scale, calculateTimeMarkers]);
  
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
    
      // 6. Construire la nouvelle URL
      const newUrl = `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,h_180,w_320/f_auto/v1/${cleanPath}?_a=BAMAAARi0`;
      
      return newUrl;
    } catch (error) {
      console.error("Erreur lors de la transformation de l'URL:", error);
      return url;
    }
  };
  
  // Debug: vérification des clips chargés initialement
  useEffect(() => {
    if (timeline.clips.length > 0) {
      // console.log("=== VÉRIFICATION DES CLIPS INITIAUX ===");
      // console.log(`${timeline.clips.length} clips chargés`);
      
      timeline.clips.forEach((clip) => {
        if (clip.asset && clip.asset.storageUrl) {
          // console.log(`Clip ${index} - URL originale:`, clip.asset.storageUrl);
          // console.log(`Clip ${index} - URL transformée:`, getCloudinaryThumbnail(clip.asset.storageUrl));
        } else {
          // console.log(`Clip ${index} - Pas d'URL disponible`);
        }
      });
      
      // console.log("=== FIN DE VÉRIFICATION ===");
    }
  }, [timeline.clips]);
  
  // Gestionnaires pour l'outil de découpe
  const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cutToolHandler.isActive()) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - rect.left) / pixelsPerSecond;
    
    // Déterminer la piste si possible
    const target = e.target as HTMLElement;
    const trackElement = target.closest('[data-track-index]');
    const trackIndex = trackElement ? parseInt(trackElement.getAttribute('data-track-index') || '0') : undefined;
    
    cutToolHandler.handleMouseMove(position, trackIndex);
  }, [cutToolHandler, pixelsPerSecond]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!cutToolHandler.isActive()) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - rect.left) / pixelsPerSecond;
    
    // Déterminer la piste
    const target = e.target as HTMLElement;
    const trackElement = target.closest('[data-track-index]');
    const trackIndex = trackElement ? parseInt(trackElement.getAttribute('data-track-index') || '0') : undefined;
    
    cutToolHandler.handleClick(position, trackIndex);
  }, [cutToolHandler, pixelsPerSecond]);

  // Commencer le trimming d'un clip
  const handleTrimStart = (e: React.MouseEvent, clip: Clip, type: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    
    // Nettoyer tout trimming existant pour éviter les erreurs
    cleanupTrimmingHandlers();
    
    // S'assurer que nous avons un ID de clip valide
    const clipId = clip.id || clip._id?.toString();
    if (!clipId) {
      console.error("Impossible de démarrer le trimming: clip sans ID");
      return;
    }
    
    // S'assurer que le clip a un asset avec une durée
    if (!clip.asset) {
      console.error("Impossible de démarrer le trimming: clip sans asset");
      return;
    }
    
    // Récupérer la durée de l'asset ou utiliser une valeur par défaut raisonnable
    const assetDuration = clip.asset.duration || (clip.endTime - clip.startTime + (clip.trimStart || 0) + (clip.trimEnd || 0));
    if (!assetDuration || assetDuration <= 0) {
      console.error("Impossible de démarrer le trimming: durée d'asset invalide", clip.asset);
      return;
    }
    
    console.log(`Début du trimming ${type} pour le clip ${clipId}`, {
      clip,
      startTime: clip.startTime,
      endTime: clip.endTime,
      trimStart: clip.trimStart || 0,
      trimEnd: clip.trimEnd || 0,
      assetDuration
    });
    
    // Enregistrer les données originales du clip pour référence
    const originalData = {
      startTime: clip.startTime,
      endTime: clip.endTime,
      trimStart: clip.trimStart || 0,
      trimEnd: clip.trimEnd || 0,
      assetDuration
    };
    
    // Stocker localement les valeurs importantes pour éviter les problèmes de state
    const localTrimmingStartX = e.clientX;
    
    // Stocker les valeurs dans les états (pour l'UI)
    setTrimmingClip(clip);
    setTrimmingType(type);
    setTrimmingStartX(localTrimmingStartX);
    setOriginalClipData(originalData);
    
    // Sélectionner le clip en cours de trimming
    setSelectedClipId(clipId);
    
    // Appliquer une classe visuelle pour indiquer le trimming
    const handleElement = e.currentTarget as HTMLElement;
    handleElement.classList.add('active');
    
    // Créer des fonctions locales qui capturent les valeurs actuelles
    const handleLocalTrimDrag = (moveEvent: MouseEvent) => {
      try {
        const delta = (moveEvent.clientX - localTrimmingStartX) / pixelsPerSecond;
        
        // Récupérer la durée originale du clip à partir des données originales
        const clipOriginalDuration = originalData.assetDuration;
        if (clipOriginalDuration <= 0) {
          console.error("Impossible de déterminer la durée originale du clip", clip);
          return;
        }
        
        // Clone du clip pour les modifications (avec valeurs par défaut pour trimStart/trimEnd)
        const updatedClip = { 
          ...clip,
          trimStart: clip.trimStart || 0,
          trimEnd: clip.trimEnd || 0
        };
        
        console.log(`Delta: ${delta.toFixed(2)}s, type: ${type}, clip:`, {
          startTime: originalData.startTime.toFixed(2),
          endTime: originalData.endTime.toFixed(2),
          trimStart: originalData.trimStart.toFixed(2),
          trimEnd: originalData.trimEnd.toFixed(2),
          clipDuration: clipOriginalDuration.toFixed(2)
        });
        
        if (type === 'start') {
          // Calcul du nouveau trimStart
          const currentTrimStart = originalData.trimStart + delta;
          
          // Limites : ne pas dépasser le début du clip ou sa fin
          const maxTrimStart = clipOriginalDuration - 0.1; // Laisser au moins 0.1s de contenu
          const newTrimStart = Math.max(0, Math.min(currentTrimStart, maxTrimStart));
          
          // Ne pas dépasser le contenu disponible avec la combinaison trimStart + trimEnd
          const contentDuration = clipOriginalDuration - newTrimStart - originalData.trimEnd;
          if (contentDuration < 0.1) {
            console.warn(`Contenu restant insuffisant: ${contentDuration.toFixed(2)}s`);
            return;
          }
          
          // Calculer le nouveau temps de début basé sur trimStart
          const newStartTime = originalData.startTime + (newTrimStart - originalData.trimStart);
          
          // Mettre à jour le clip
          updatedClip.trimStart = newTrimStart;
          updatedClip.startTime = newStartTime;
          
          console.log(`Trimming start: ${newTrimStart.toFixed(2)}s, nouvelle position: ${newStartTime.toFixed(2)}s`);
        } else {
          // Calcul du nouveau trimEnd
          const currentTrimEnd = originalData.trimEnd - delta;
          
          // Limites : ne pas dépasser la fin du clip ou son début
          const maxTrimEnd = clipOriginalDuration - originalData.trimStart - 0.1;
          const newTrimEnd = Math.max(0, Math.min(currentTrimEnd, maxTrimEnd));
          
          // Ne pas dépasser le contenu disponible avec la combinaison trimStart + trimEnd
          const contentDuration = clipOriginalDuration - originalData.trimStart - newTrimEnd;
          if (contentDuration < 0.1) {
            console.warn(`Contenu restant insuffisant: ${contentDuration.toFixed(2)}s`);
            return;
          }
          
          // Calculer le nouveau temps de fin basé sur trimEnd
          const newEndTime = originalData.endTime + (originalData.trimEnd - newTrimEnd);
          
          // Mettre à jour le clip
          updatedClip.trimEnd = newTrimEnd;
          updatedClip.endTime = newEndTime;
          
          console.log(`Trimming end: ${newTrimEnd.toFixed(2)}s, nouvelle position: ${newEndTime.toFixed(2)}s`);
        }
        
        // Vérification supplémentaire : s'assurer que le clip a toujours une durée minimale
        const clipDuration = updatedClip.endTime - updatedClip.startTime;
        if (clipDuration < 0.1) {
          console.warn(`Durée de clip trop courte (${clipDuration.toFixed(2)}s), ajustement ignoré`);
          return; // Ne pas mettre à jour si la durée est trop courte
        }
        
        // Vérifier si les valeurs ont réellement changé pour éviter les mises à jour inutiles
        if (
          Math.abs(updatedClip.startTime - clip.startTime) < 0.01 &&
          Math.abs(updatedClip.endTime - clip.endTime) < 0.01 &&
          Math.abs(updatedClip.trimStart - (clip.trimStart || 0)) < 0.01 &&
          Math.abs(updatedClip.trimEnd - (clip.trimEnd || 0)) < 0.01
        ) {
          // Pas de changement significatif
          return;
        }
        
        console.log("Mise à jour du clip:", {
          id: updatedClip.id,
          startTime: updatedClip.startTime.toFixed(2),
          endTime: updatedClip.endTime.toFixed(2),
          trimStart: updatedClip.trimStart.toFixed(2),
          trimEnd: updatedClip.trimEnd.toFixed(2)
        });
        
        // Mettre à jour le clip dans la timeline et la référence locale
        updateClip(updatedClip);
        
        // Mettre à jour l'état pour maintenir la référence à jour
        setTrimmingClip(updatedClip);
      } catch (error) {
        console.error("Erreur lors du trimming:", error);
      }
    };
    
    const handleLocalTrimEnd = (e: MouseEvent) => {
      // S'assurer que l'événement est bien traité
      e.preventDefault();
      if (typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }
      
      console.log(`Fin du trimming ${type} pour le clip ${clipId}`);
      
      // Supprimer explicitement les écouteurs locaux
      document.removeEventListener('mousemove', handleLocalTrimDrag);
      document.removeEventListener('mouseup', handleLocalTrimEnd);
      
      // Supprimer les classes visuelles
      const activeHandles = document.querySelectorAll('.trim-handle.active');
      activeHandles.forEach(handle => handle.classList.remove('active'));
      
      // Réinitialiser les états
      setTrimmingClip(null);
      setTrimmingType(null);
      setOriginalClipData(null);
      
      // Log pour confirmer la fin du trimming
      console.log("Trimming terminé, écouteurs supprimés");
    };
    
    // Nettoyer d'abord tous les listeners précédents au cas où
    document.removeEventListener('mousemove', handleLocalTrimDrag);
    document.removeEventListener('mouseup', handleLocalTrimEnd);
    
    // Supprimer les classes visuelles existantes
    const activeHandles = document.querySelectorAll('.trim-handle.active');
    activeHandles.forEach(handle => handle.classList.remove('active'));
    
    // Ajouter les nouveaux écouteurs d'événements directement avec les fonctions locales
    console.log(`Ajout des écouteurs pour le trimming de ${type}`);
    document.addEventListener('mousemove', handleLocalTrimDrag, { passive: false });
    document.addEventListener('mouseup', handleLocalTrimEnd, { once: true, passive: false });
  };
  
  // Fonction de nettoyage des gestionnaires de trimming
  const cleanupTrimmingHandlers = useCallback(() => {
    console.log("Nettoyage des gestionnaires de trimming");
    
    // Réinitialiser les états
    setTrimmingClip(null);
    setTrimmingType(null);
    setOriginalClipData(null);
    
    // Supprimer les classes visuelles
    const activeHandles = document.querySelectorAll('.trim-handle.active');
    activeHandles.forEach(handle => handle.classList.remove('active'));
    
    // Supprimer les gestionnaires d'événements globaux
    // Utiliser des fonctions vides pour les supprimer si nécessaire
    try {
      // Suppression générique des écouteurs
      const noop = () => {};
      document.removeEventListener('mousemove', noop as EventListener);
      document.removeEventListener('mouseup', noop as EventListener);
      console.log("Nettoyage des gestionnaires réussi");
    } catch (error) {
      console.error("Erreur lors du nettoyage des gestionnaires:", error);
    }
  }, []);
  
  // Nettoyer les listeners au démontage du composant
  useEffect(() => {
    return () => {
      cleanupTrimmingHandlers();
    };
  }, [cleanupTrimmingHandlers]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-foreground">
      {/* Prévisualisation vidéo */}
      <div className="w-full bg-black aspect-video relative group">
        <VideoPreview
          clips={timeline.clips}
          audioTracks={timeline.audioTracks}
          currentTime={currentTime}
          playing={playing}
          isDragging={isDragging}
          onTimeUpdate={(time) => setCurrentTime(time)}
          onEnded={() => setPlaying(false)}
        />
        
        {/* Contrôles de lecture */}
        <div className="absolute bottom-0 left-0 right-0 bg-foreground/75 p-2 flex flex-col z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Curseur de temps */}
          <div className="w-full mb-2 relative">
            <input
              type="range"
              min={0}
              max={timeline.duration}
              step={0.01}
              value={currentTime}
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-main relative z-10"
              style={{
              background: `linear-gradient(to right, #F26B3D 0%, #F26B3D ${(currentTime / timeline.duration) * 100}%, #171725 ${(currentTime / timeline.duration) * 100}%, #171725 100%)`
              }}
            />
          </div>
          
          {/* Boutons de contrôle */}
          <div className="flex items-center justify-between text-background">
            <div className="w-28">
              {formatTime(currentTime)} / {formatTime(timeline.duration)}
            </div>
              
            <div className="flex items-center gap-3">
              <div
                onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                title='Reculer de 10 secondes'
                className='cursor-pointer'
              >
                <Icon name="-10" />
              </div>

              <button 
                onClick={togglePlayback}
                className="cursor-pointer text-2xl"
              >
                {playing ? '❚❚' : '▶'}
              </button>

              <div
                onClick={() => setCurrentTime(Math.max(0, currentTime + 10))}
                title='Avancer de 10 secondes'
                className="cursor-pointer"
              >
                <Icon name="+10" />
              </div>
            </div>

            <div 
              className="cursor-pointer w-28 flex justify-end" 
              // onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Icon name="fullscreen" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Contrôles de zoom et outils */}
      <div className="flex items-center justify-between p-4 bg-background text-foreground">
        <h2 className='uppercase'>Timeline vidéo</h2>

        <div className="flex items-center gap-4">
          {/* Contrôles de zoom */}
          <div className="flex items-center">
            <button 
              onClick={() => setScale(Math.max(50, scale - 10))}
              className="px-2 py-1"
            >
              <Icon name="less" size={10} />
            </button>
            <span className="mx-2">{scale}%</span>
            <button 
              onClick={() => setScale(Math.min(200, scale + 10))}
              className="px-2 py-1"
            >
              <Icon name="add" size={10} />
            </button>
          </div>
          
          {/* Outils d'édition */}
          <div className="flex items-center space-x-2">
            <CutToolButton
              isActive={cutToolActive}
              onClick={toggleCutTool}
            />
          </div>
        </div>
      </div>
      
      {/* Conteneur de timeline */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-x-auto bg-background relative"
        onScroll={handleTimelineScroll}
      >
        {/* Règle temporelle */}
        <div 
          className="h-8 border-b border-secondary relative"
          style={{ width: `${timeline.duration * pixelsPerSecond}px` }}
        >
          {/* Marqueurs secondaires (plus petits) */}
          {timeMarkers.secondary.map((time) => (
            <div 
              key={`secondary-${time}`}
              className="absolute top-4 h-4 border-l border-secondary"
              style={{ left: `${time * pixelsPerSecond}px` }}
            />
          ))}
          
          {/* Marqueurs primaires (avec étiquettes) */}
          {timeMarkers.primary.map((time) => (
            <div 
              key={`primary-${time}`}
              className="absolute top-0 h-8 border-l border-secondary"
              style={{ left: `${time * pixelsPerSecond}px` }}
            >
              <span className="absolute top-0 left-1 text-xs text-foreground">{formatTime(time)}</span>
            </div>
          ))}
          
          {/* Indicateur de temps actuel */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-main z-10"
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
          />
        </div>
        
        {/* Pistes vidéo */}
        <div 
          className="flex flex-col bg-secondary"
          onMouseMove={handleTimelineMouseMove}
          onClick={handleTimelineClick}
        >
          {Array.from({ length: 3 }).map((_, trackIndex) => (
            <div 
              key={`track-${trackIndex}`}
              className="h-20 border-b border-background relative"
              style={{ width: `${timeline.duration * pixelsPerSecond}px` }}
              data-track-index={trackIndex}
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
                  // Créer une clé unique en combinant plusieurs éléments pour éviter les doublons
                  const baseId = clip.id || clip._id?.toString();
                  const assetId = clip.assetId?.toString();
                  const uniqueKey = `clip-${trackIndex}-${index}-${baseId || 'no-id'}-${assetId || 'no-asset'}-${clip.startTime}-${clip.endTime}`;
                  const isSelected = (clip.id === selectedClipId) || (clip._id?.toString() === selectedClipId);
                  
                  return (
                    <div
                      key={uniqueKey}
                      className={`absolute top-1 bottom-1 rounded overflow-hidden ${
                        cutToolActive ? 'cursor-crosshair' : 'cursor-grab'
                      } ${
                        isSelected ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        left: `${clip.startTime * pixelsPerSecond}px`,
                        width: `${(clip.endTime - clip.startTime) * pixelsPerSecond}px`,
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(75, 85, 99, 0.5)'
                      }}
                      title={cutToolActive ? `Cliquer pour découper le clip à cette position` : `Clip: ${getAssetDisplayName(clip.asset)}`}
                      onClick={(e) => {
                        // Empêcher la propagation pour éviter les sélections multiples
                        e.stopPropagation();
                        
                        // Si l'outil Cut est actif, déclencher la découpe au lieu de sélectionner
                        if (cutToolActive) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickPosition = clip.startTime + ((e.clientX - rect.left) / pixelsPerSecond);
                          
                          // Utiliser directement le cutToolHandler pour découper à cette position
                          cutToolHandler.handleClick(clickPosition, trackIndex);
                          return;
                        }
                        
                        // Comportement normal : sélectionner le clip
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
                        <div className="w-full h-full relative">
                          <OptimizedImage 
                            src={getCloudinaryThumbnail(clip.asset.storageUrl)} 
                            alt={`Clip ${clip.id || clip._id}`}
                            width={200}
                            height={112}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-foreground text-xs px-1 truncate">
                            {getAssetDisplayName(clip.asset)}
                            {clip.asset.duration ? ` (${clip.asset.duration.toFixed(1)}s)` : ''}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-foreground text-xs p-1 text-center">
                          {clip.assetId ? 
                            "Asset non disponible" : 
                            "Clip invalide"}
                        </div>
                      )}
                      
                      {/* Poignées de trimming */}
                      <div 
                        className={`trim-handle trim-handle-start absolute left-0 top-0 bottom-0 w-2 cursor-w-resize 
                                   ${isSelected ? 'bg-blue-500 opacity-70 hover:opacity-100' : 'bg-gray-400 opacity-0 hover:opacity-50'} 
                                   transition-opacity duration-200`}
                        onMouseDown={(e) => handleTrimStart(e, clip, 'start')}
                      />
                      <div 
                        className={`trim-handle trim-handle-end absolute right-0 top-0 bottom-0 w-2 cursor-e-resize 
                                   ${isSelected ? 'bg-blue-500 opacity-70 hover:opacity-100' : 'bg-gray-400 opacity-0 hover:opacity-50'} 
                                   transition-opacity duration-200`}
                        onMouseDown={(e) => handleTrimStart(e, clip, 'end')}
                      />
                    </div>
                  );
                })}
                
                {/* Indicateur de drop */}
                {dropIndicator.visible && dropIndicator.trackIndex === trackIndex && (
                  <div 
                    className="absolute top-1 bottom-1 bg-blue-500/30 border border-blue-500 rounded"
                    style={{
                      left: `${dropIndicator.position}px`,
                      width: `${dropIndicator.width}px`
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Timeline Audio */}
        <div className="bg-secondary">
          <div className="p-4 bg-background">
            <h2 className="text-foreground uppercase">Timeline Audio</h2>
          </div>
          
          {/* Pistes audio */}
          <div 
            className="relative"
            style={{ width: `${timeline.duration * pixelsPerSecond}px` }}
            onMouseMove={handleTimelineMouseMove}
            onClick={handleTimelineClick}
          >
            {/* Piste 0: Audio des clips vidéo (liés) */}
            <div 
              className="h-16 bg-secondary border-b border-background relative"
              data-track-index="0"
            >
              <div className="absolute left-2 top-2 text-foreground text-xs">
                Audio vidéo (liées)
              </div>
              
              {timeline.audioTracks
                .filter(track => track.linkedVideoClipId) // Afficher seulement les pistes liées
                .map((track, index) => {
                  const baseId = track.id || track._id?.toString();
                  const assetId = track.assetId?.toString();
                  const uniqueKey = `audio-linked-${index}-${baseId || 'no-id'}-${assetId || 'no-asset'}-${track.startTime}-${track.endTime}-${track.linkedVideoClipId || 'no-link'}`;
                  const isSelected = selectedAudioTrackId === uniqueKey;
                  
                  return (
                    <AudioTrackComponent
                      key={uniqueKey}
                      track={track}
                      trackKey={uniqueKey}
                      trackIndex={0}
                      isSelected={isSelected}
                      pixelsPerSecond={pixelsPerSecond}
                      onSelect={setSelectedAudioTrackId}
                      onDragStart={() => {}} // Pas de drag pour les pistes liées
                      onDragEnd={() => {}}
                      onTrimStart={() => {}} // Pas de trim pour les pistes liées
                      onRemove={() => {}} // Pas de suppression pour les pistes liées
                      cutToolActive={cutToolActive}
                      onCutClick={(position, trackIndex) => cutToolHandler.handleClick(position, trackIndex)}
                    />
                  );
                })}
            </div>
            
            {/* Pistes audio indépendantes (1, 2, 3...) */}
            {[1, 2, 3].map((trackIndex) => (
              <div 
                key={`audio-track-${trackIndex}`}
                className="h-16 bg-navy border-b border-background relative"
                data-track-index={trackIndex}
                onDragOver={(e) => handleDragOver(e, trackIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, trackIndex)}
              >          
                {timeline.audioTracks
                  .filter(track => !track.linkedVideoClipId && track.trackIndex === trackIndex)
                  .map((track, index) => {
                    const baseId = track.id || track._id?.toString();
                    const assetId = track.assetId?.toString();
                    const uniqueKey = `audio-indep-${trackIndex}-${index}-${baseId || 'no-id'}-${assetId || 'no-asset'}-${track.startTime}-${track.endTime}`;
                    const isSelected = selectedAudioTrackId === uniqueKey;
                    
                    return (
                      <AudioTrackComponent
                        key={uniqueKey}
                        track={track}
                        trackKey={uniqueKey}
                        trackIndex={trackIndex}
                        isSelected={isSelected}
                        pixelsPerSecond={pixelsPerSecond}
                        onSelect={setSelectedAudioTrackId}
                        onDragStart={handleAudioTrackDragStart}
                        onDragEnd={handleAudioTrackDragEnd}
                        onTrimStart={(e: React.MouseEvent, track: AudioTrack, type: 'start' | 'end') => {
                          // TODO: Implémenter le trimming des pistes audio indépendantes
                          console.log('Trim audio track:', track, type);
                        }}
                        onRemove={removeAudioTrack}
                        cutToolActive={cutToolActive}
                        onCutClick={(position, trackIndex) => cutToolHandler.handleClick(position, trackIndex)}
                      />
                    );
                  })}
                
                {/* Indicateur de drop pour audio */}
                {dropIndicator.visible && dropIndicator.trackIndex === trackIndex && (
                  <div 
                    className="absolute top-1 bottom-1 bg-green-500/30 border border-green-500 rounded"
                    style={{
                      left: `${dropIndicator.position}px`,
                      width: `${dropIndicator.width}px`
                    }}
                  />
                )}
              </div>
            ))}        </div>
        
        {/* Overlay pour l'outil de découpe */}
        <CutToolUI
          cutToolState={cutToolHandler.getState()}
          className="absolute top-0 left-0 pointer-events-none"
        />
      </div>
      
      {/* Panel des assets */}
      <div className="p-4 bg-background">
        <div className='flex justify-between w-full gap-2 py-4'>
          <h3 className="text-foreground font-semibold mb-2">Assets vidéo</h3>
          <div
            className="cursor-pointer"
            onClick={() => onShowAssetModal?.()}
            title="Ajouter un nouvel asset vidéo ou audio"
          >
            <Icon name="add" size={20} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
            {/* Video Assets */}
            {videoAssets.filter(asset => !asset.isAudioOnly).map(asset => (
            <div 
              key={asset._id || asset.id}
              className="bg-background rounded overflow-hidden cursor-pointer relative"
              draggable
              onDragStart={() => handleDragStart(asset)}
            >
              <div className="aspect-video relative">
              {asset.metadata?.thumbnailUrl ? (
                <OptimizedImage 
                src={asset.metadata.thumbnailUrl} 
                alt={getAssetDisplayName(asset)}
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
              <div className="text-foreground text-sm truncate">{getAssetDisplayName(asset)}</div>
              <div className="text-gray-400 text-xs">
                {formatTime(asset.duration)}
                {assetHasAudio(asset) && <span className="ml-1 text-green-400">🎵</span>}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Clic: Vidéo {assetHasAudio(asset) && '+ Shift: Audio seulement'}
              </div>
              </div>
              
              {/* Gestionnaires de clic */}
              <div
              className="absolute inset-0 cursor-pointer hover:bg-foreground/10 transition-colors"
              onClick={(e) => {
                if (e.shiftKey && assetHasAudio(asset)) {
                // Shift + clic = ajouter seulement l'audio
                addAudioTrack(asset, 1);
                } else {
                // Clic normal = ajouter comme clip vidéo (avec audio auto si présent)
                addClip(asset);
                }
              }}
              title={
                assetHasAudio(asset) 
                ? "Clic: Ajouter comme clip vidéo | Shift+Clic: Ajouter seulement l'audio"
                : "Clic: Ajouter comme clip vidéo"
              }
              />
            </div>
            ))}

            {/* Audio Only Assets */}
            <div className='flex justify-between w-full gap-2 py-4 col-span-3'>
              <h3 className="text-foreground font-semibold mb-2">Assets audio</h3>
              <div
                className="cursor-pointer"
                onClick={() => onShowAssetModal?.()}
                title="Ajouter un nouvel asset vidéo ou audio"
              >
                <Icon name="add" size={20} />
              </div>
            </div>
            {videoAssets.filter(asset => asset.isAudioOnly).map(asset => (
            <div 
              key={`audio-${asset._id || asset.id}`}
              className="bg-gray-700 rounded overflow-hidden cursor-pointer relative"
              draggable
              onDragStart={() => handleDragStart(asset)}
            >
              <div className="aspect-video relative bg-gray-800 flex items-center justify-center">
              <Icon name="play" size={48} className="text-gray-500" />
              </div>
              <div className="p-2">
              <div className="text-foreground text-sm truncate">{getAssetDisplayName(asset)}</div>
              <div className="text-gray-400 text-xs">
                {formatTime(asset.duration)}
                <span className="ml-1 text-green-400">🎵</span>
              </div>
              <div className="text-xs text-green-400 mt-1">
                Audio seulement
              </div>
              </div>
              
              {/* Gestionnaires de clic */}
              <div
              className="absolute inset-0 cursor-pointer hover:bg-foreground/10 transition-colors"
              onClick={() => {
                // Toujours ajouter comme piste audio indépendante
                addAudioTrack(asset, 1);
              }}
              title="Ajouter comme piste audio indépendante"
              />
            </div>
            ))}
        </div>
      </div>
      
      {/* Propriétés du clip sélectionné */}
      {selectedClip && (
        <div className="p-4 bg-gray-800 border-t border-secondary">
          <h3 className="text-foreground text-lg mb-2">Propriétés du clip vidéo</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1">Position dans la timeline</label>
              <div className="text-foreground bg-secondary p-2 rounded">
                {formatTime(selectedClip.startTime)} - {formatTime(selectedClip.endTime)}
              </div>
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Trimming</label>
              <div className="text-foreground bg-secondary p-2 rounded">
                <div className="flex justify-between">
                  <span>Début: {(selectedClip.trimStart || 0).toFixed(1)}s</span>
                  <span>Fin: {(selectedClip.trimEnd || 0).toFixed(1)}s</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Utilisez les poignées sur les bords du clip pour ajuster le trimming
                </div>
              </div>
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
                className="bg-red-600 text-foreground px-4 py-2 rounded"
              >
                Supprimer le clip
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Propriétés de la piste audio sélectionnée */}
      {selectedAudioTrackId && timeline.audioTracks.find(track => 
        (track.id === selectedAudioTrackId) || (track._id?.toString() === selectedAudioTrackId)
      ) && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <h3 className="text-foreground text-lg mb-2">Propriétés de la piste audio</h3>
          
          {(() => {
            const selectedAudioTrack = timeline.audioTracks.find(track => 
              (track.id === selectedAudioTrackId) || (track._id?.toString() === selectedAudioTrackId)
            );
            
            if (!selectedAudioTrack) return null;
            
            const isLinkedTrack = !!selectedAudioTrack.linkedVideoClipId;
            
            return (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">Type</label>
                  <div className="text-foreground bg-gray-700 p-2 rounded">
                    {isLinkedTrack ? 'Audio lié (vidéo)' : 'Audio indépendant'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1">Position dans la timeline</label>
                  <div className="text-foreground bg-gray-700 p-2 rounded">
                    {formatTime(selectedAudioTrack.startTime)} - {formatTime(selectedAudioTrack.endTime)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1">Volume</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={selectedAudioTrack.volume || 1}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateAudioTrack({
                        ...selectedAudioTrack,
                        volume: value
                      });
                    }}
                    className="w-full"
                    disabled={isLinkedTrack} // Désactiver pour les pistes liées (contrôlées par le clip vidéo)
                  />
                  {isLinkedTrack && (
                    <div className="text-xs text-gray-400 mt-1">
                      Le volume est contrôlé par le clip vidéo associé
                    </div>
                  )}
                </div>
                
                {!isLinkedTrack && (
                  <div className="flex items-end">
                    <button
                      onClick={() => removeAudioTrack(selectedAudioTrack.id || selectedAudioTrack._id?.toString() || '')}
                      className="bg-red-600 text-foreground px-4 py-2 rounded"
                    >
                      Supprimer la piste
                    </button>
                  </div>
                )}
                
                {isLinkedTrack && (
                  <div className="text-xs text-gray-400">
                    Cette piste audio est automatiquement synchronisée avec son clip vidéo.
                    Pour la modifier, ajustez le clip vidéo correspondant.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export { TimelineEditor };
