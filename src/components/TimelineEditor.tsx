import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Timeline, Clip, AudioTrack, Effect } from '@/interface/iProject';
import { VideoAsset } from '@/interface/iVideoAsset';
import { CloudinaryImage } from './CloudinaryImage';
import { VideoThumbnail } from './VideoThumbnail';

interface TimelineEditorProps {
  timeline: Timeline;
  videoAssets: VideoAsset[];
  onChange: (timeline: Timeline) => void;
}

/**
 * Composant d'édition de timeline
 * Ce composant permet de créer une interface de montage vidéo type InShot
 */
export const TimelineEditor: React.FC<TimelineEditorProps> = ({
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
  const selectedClip = timeline.clips.find(clip => clip.id === selectedClipId);

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
    const newClips = timeline.clips.map(clip => 
      clip.id === updatedClip.id ? updatedClip : clip
    );
    
    // Recalculer la durée totale de la timeline
    const maxEndTime = Math.max(...newClips.map(clip => clip.endTime));
    
    const newTimeline = {
      ...timeline,
      clips: newClips,
      duration: Math.max(timeline.duration, maxEndTime)
    };
    
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
    e.dataTransfer.setData('text/plain', clip.id || '');
    e.dataTransfer.effectAllowed = 'move';
    
    // Appliquer une classe visuelle
    clipElement.classList.add('opacity-50');
  };
  
  const handleDragOver = (e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Mettre à jour l'indicateur de drop
    updateDropIndicator(e, trackIndex);
  };
  
  const handleDragLeave = () => {
    // Masquer l'indicateur de drop quand on quitte la zone
    setDropIndicator(prev => ({ ...prev, visible: false }));
  };
  
  const handleDrop = (e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    
    // Calculer la position temporelle basée sur la position de la souris
    const trackRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - trackRect.left;
    const dropTime = offsetX / pixelsPerSecond;
    
    // Récupérer l'ID du clip glissé depuis les données de transfert
    const clipId = e.dataTransfer.getData('text/plain');
    
    // Cas 1 : Glisser-déposer d'un clip existant
    if (clipId && timeline.clips.find(c => c.id === clipId)) {
      const existingClip = timeline.clips.find(c => c.id === clipId);
      if (!existingClip) return;
      
      // Calculer la nouvelle position en tenant compte du point de saisie
      const newStartTime = Math.max(0, dropTime - (draggedClipOffsetX / pixelsPerSecond));
      const clipDuration = existingClip.endTime - existingClip.startTime;
      
      // Ajuster la position pour éviter les chevauchements
      const updatedClip = adjustClipPosition(timeline.clips, {
        ...existingClip,
        trackIndex,
        startTime: newStartTime,
        endTime: newStartTime + clipDuration
      });
      
      // Mettre à jour la timeline avec le clip modifié
      const newClips = timeline.clips.map(clip => 
        clip.id === clipId ? updatedClip : clip
      );
      
      // Recalculer la durée totale de la timeline
      const maxEndTime = Math.max(...newClips.map(clip => clip.endTime));
      
      const newTimeline = {
        ...timeline,
        clips: newClips,
        duration: Math.max(timeline.duration, maxEndTime)
      };
      
      onChange(newTimeline);
      setSelectedClipId(clipId);
      setDraggedClip(null);
      setDropIndicator(prev => ({ ...prev, visible: false }));
    } 
    // Cas 2 : Glisser-déposer d'un nouvel asset depuis la bibliothèque
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
      
      const deltaTime = time - lastTime;
      lastTime = time;
      
      if (playing) {
        // Avancer le temps actuel
        const newTime = currentTime + deltaTime / 1000;
        
        // Arrêter à la fin de la timeline
        if (newTime >= timeline.duration) {
          setCurrentTime(timeline.duration);
          setPlaying(false);
        } else {
          setCurrentTime(newTime);
          
          // Défilement automatique
          if (timelineRef.current) {
            timelineRef.current.scrollLeft = newTime * pixelsPerSecond;
          }
        }
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [playing, currentTime, timeline.duration, pixelsPerSecond]);
  
  // Fonction pour vérifier et ajuster les clips en cas de chevauchement
  const adjustClipPosition = (clips: Clip[], newClip: Clip): Clip => {
    // Trouver les clips sur la même piste
    const clipsOnSameTrack = clips.filter(
      clip => clip.trackIndex === newClip.trackIndex && clip.id !== newClip.id
    );
    
    // Copier le clip pour les modifications
    let adjustedClip = { ...newClip };
    
    // Vérifier chaque clip pour détecter les chevauchements
    for (const clip of clipsOnSameTrack) {
      // Vérifier si le nouveau clip chevauche ce clip existant
      if (
        adjustedClip.startTime < clip.endTime && 
        adjustedClip.endTime > clip.startTime
      ) {
        // Si le nouveau clip commence avant le clip existant, le placer avant
        if (adjustedClip.startTime <= clip.startTime) {
          const newEndTime = clip.startTime;
          adjustedClip = {
            ...adjustedClip,
            endTime: newEndTime,
            // Ajuster la durée du trim si nécessaire
            trimEnd: adjustedClip.trimEnd ? 
              adjustedClip.trimEnd + (adjustedClip.endTime - newEndTime) : 
              0
          };
        } 
        // Sinon, le placer après le clip existant
        else {
          const newStartTime = clip.endTime;
          const clipDuration = adjustedClip.endTime - adjustedClip.startTime;
          adjustedClip = {
            ...adjustedClip,
            startTime: newStartTime,
            endTime: newStartTime + clipDuration
          };
        }
      }
    }
    
    return adjustedClip;
  };
  
  // Mise à jour de la position de l'indicateur de drop
  const updateDropIndicator = (e: React.DragEvent, trackIndex: number) => {
    if (!draggedAsset && !draggedClip) return;
    
    const trackRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - trackRect.left;
    const dropTime = offsetX / pixelsPerSecond;
    
    // Calculer la largeur de l'indicateur
    let width = 0;
    if (draggedAsset) {
      width = draggedAsset.duration * pixelsPerSecond;
    } else if (draggedClip) {
      width = (draggedClip.endTime - draggedClip.startTime) * pixelsPerSecond;
    }
    
    setDropIndicator({
      trackIndex,
      position: dropTime * pixelsPerSecond,
      width,
      visible: true
    });
  };
  
  // Calcul des marqueurs de temps dynamiques
  const calculateTimeMarkers = useCallback(() => {
    if (!timelineRef.current) return { primary: [], secondary: [] };
    
    // Largeur visible de la timeline
    const viewportWidth = timelineRef.current.clientWidth;
    
    // Temps visible dans la viewport (en secondes)
    const visibleDuration = viewportWidth / pixelsPerSecond;
    
    // Déterminer l'intervalle approprié entre les marqueurs principaux
    let primaryInterval = 1; // Intervalle par défaut: 1 seconde
    
    if (scale <= 25) {
      primaryInterval = 60; // 1 minute
    } else if (scale <= 50) {
      primaryInterval = 30; // 30 secondes
    } else if (scale <= 75) {
      primaryInterval = 15; // 15 secondes
    } else if (scale <= 100) {
      primaryInterval = 5; // 5 secondes
    } else if (scale <= 150) {
      primaryInterval = 2; // 2 secondes
    }
    
    // Limiter le nombre de marqueurs pour éviter l'encombrement
    const maxPrimaryMarkers = Math.ceil(viewportWidth / 100); // Environ 100px entre chaque marqueur
    
    if (visibleDuration / primaryInterval > maxPrimaryMarkers) {
      primaryInterval = Math.ceil(visibleDuration / maxPrimaryMarkers);
    }
    
    // Calculer l'intervalle pour les marqueurs secondaires
    let secondaryInterval = primaryInterval / 4;
    if (secondaryInterval < 0.25) secondaryInterval = 0.25;
    
    // Calculer le temps de début visible
    const scrollPosition = timelineRef.current.scrollLeft;
    const startTime = Math.floor(scrollPosition / pixelsPerSecond / primaryInterval) * primaryInterval;
    
    // Générer les marqueurs principaux
    const primaryMarkers = [];
    const secondaryMarkers = [];
    
    // Ajouter quelques marqueurs avant le début visible pour le défilement fluide
    for (let time = startTime - primaryInterval * 2; time <= Math.ceil(timeline.duration) + primaryInterval; time += primaryInterval) {
      if (time >= 0) {
        primaryMarkers.push(time);
        
        // Ajouter les marqueurs secondaires entre les marqueurs principaux
        if (scale > 50) { // Ajouter des marqueurs secondaires seulement à partir d'un certain niveau de zoom
          for (let j = 1; j < (primaryInterval / secondaryInterval); j++) {
            const secTime = time + j * secondaryInterval;
            if (secTime < timeline.duration && secTime >= 0) {
              secondaryMarkers.push(secTime);
            }
          }
        }
      }
    }
    
    return { primary: primaryMarkers, secondary: secondaryMarkers };
  }, [scale, pixelsPerSecond, timeline.duration]);
  
  // Mise à jour dynamique des marqueurs lors du défilement et du zoom
  const [timeMarkers, setTimeMarkers] = useState<{
    primary: number[];
    secondary: number[];
  }>({ primary: [], secondary: [] });
  
  useEffect(() => {
    // Mettre à jour les marqueurs au chargement et lors des changements de zoom
    const updateMarkers = () => {
      setTimeMarkers(calculateTimeMarkers());
    };
    
    updateMarkers();
    
    // Observer les redimensionnements de la fenêtre
    const resizeObserver = new ResizeObserver(updateMarkers);
    if (timelineRef.current) {
      resizeObserver.observe(timelineRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [scale, timeline.duration, calculateTimeMarkers]);
  
  return (
    <div className="flex flex-col w-full h-full">
      {/* Prévisualisation vidéo */}
      <div className="w-full bg-black aspect-video relative">
        {/* Simuler une prévisualisation */}
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Prévisualisation à {currentTime.toFixed(2)}s
        </div>
        
        {/* Contrôles de lecture */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 flex items-center">
          <button 
            onClick={togglePlayback}
            className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center mr-2"
          >
            {playing ? '❚❚' : '▶'}
          </button>
          
          <div className="text-white">
            {formatTime(currentTime)} / {formatTime(timeline.duration)}
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
          
          {/* Marqueurs principaux (avec étiquettes) */}
          {timeMarkers.primary.map((time) => (
            <div 
              key={`primary-${time}`}
              className="absolute top-0 bottom-0 border-l border-gray-600 text-xs text-white"
              style={{ left: `${time * pixelsPerSecond}px` }}
            >
              <span className="ml-1">{formatTime(time)}</span>
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
            >
              {/* Clips de cette piste */}
              {timeline.clips
                .filter(clip => clip.trackIndex === trackIndex)
                .map(clip => (
                  <div
                    key={clip.id}
                    className={`absolute top-1 bottom-1 rounded overflow-hidden cursor-grab ${
                      clip.id === selectedClipId ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{
                      left: `${clip.startTime * pixelsPerSecond}px`,
                      width: `${(clip.endTime - clip.startTime) * pixelsPerSecond}px`,
                      backgroundColor: clip.id === selectedClipId ? 'rgba(59, 130, 246, 0.5)' : 'rgba(75, 85, 99, 0.5)'
                    }}
                    onClick={() => setSelectedClipId(clip.id as string)}
                    draggable={true}
                    onDragStart={(e) => handleClipDragStart(e, clip)}
                    onDragEnd={(e) => {
                      (e.currentTarget as HTMLElement).classList.remove('opacity-50');
                      setDropIndicator(prev => ({ ...prev, visible: false }));
                    }}
                  >
                    <div className="p-1 text-xs text-white truncate">
                      {clip.asset?.originalName || `Clip ${clip.id}`}
                    </div>
                    
                    {/* Indicateurs d'effets */}
                    {clip.effects && clip.effects.length > 0 && (
                      <div className="absolute bottom-1 left-1 right-1 h-2 bg-purple-500 rounded-full" />
                    )}
                  </div>
                ))}
            </div>
          ))}
          
          {/* Pistes audio */}
          {Array.from({ length: 2 }).map((_, trackIndex) => (
            <div 
              key={`audio-track-${trackIndex}`}
              className="h-16 border-b border-gray-700 relative bg-gray-800"
              style={{ width: `${timeline.duration * pixelsPerSecond}px` }}
            >
              {/* Clips audio de cette piste */}
              {timeline.audioTracks
                .filter(audio => audio.trackIndex === trackIndex)
                .map(audio => (
                  <div
                    key={audio.id}
                    className="absolute top-1 bottom-1 rounded overflow-hidden cursor-pointer bg-green-800"
                    style={{
                      left: `${audio.startTime * pixelsPerSecond}px`,
                      width: `${(audio.endTime - audio.startTime) * pixelsPerSecond}px`,
                    }}
                  >
                    <div className="p-1 text-xs text-white truncate">
                      {audio.asset?.originalName || `Audio ${audio.id}`}
                    </div>
                  </div>
                ))}
            </div>
          ))}
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
                  });
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
                  });
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
                  });
                }}
                className="w-full"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => removeClip(selectedClip.id as string)}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bibliothèque de médias */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <h3 className="text-white text-lg mb-2">Bibliothèque</h3>
        
        <div className="grid grid-cols-4 gap-4">
          {videoAssets.map(asset => (
            <div
              key={asset._id || asset.id}
              className="bg-gray-700 rounded overflow-hidden cursor-pointer"
              draggable
              onDragStart={() => handleDragStart(asset)}
              onClick={() => addClip(asset)}
            >
              <div className="aspect-video bg-black relative">
                {asset.metadata.thumbnailUrl ? (
                  <CloudinaryImage
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
  );
};

// Formater le temps en minutes:secondes
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
