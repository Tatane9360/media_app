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
    // Si pas de clips ou pas d'assets, on ne fait rien
    if (!timeline.clips.length || !videoAssets.length) return;

    // Map pour accéder rapidement aux assets par ID
    const assetsMap = new Map();
    videoAssets.forEach(asset => {
      // Normaliser les ID (gérer à la fois string et ObjectId)
      const assetId = asset._id?.toString() || asset.id?.toString();
      if (assetId) {
        assetsMap.set(assetId, asset);
      }
    });

    // Debug log
    console.log("Assets disponibles:", videoAssets.length);
    console.log("Premier asset:", videoAssets[0]);
    console.log("Clips à associer:", timeline.clips.length);
    
    // Vérifier si des clips ont besoin d'être mis à jour
    let hasUpdatedClips = false;
    const updatedClips = timeline.clips.map(clip => {
      // Normaliser l'ID du clip (gérer à la fois string et ObjectId)
      const clipAssetId = clip.assetId?.toString();
      
      // Debug
      if (!clipAssetId) {
        console.warn("Clip sans assetId:", clip);
      }
      
      // Si pas d'assetId, on ne peut pas associer
      if (!clipAssetId) return clip;
      
      // Si le clip a déjà un asset valide, vérifier qu'il est complet
      if (clip.asset) {
        // Si l'asset a une URL de stockage, il est probablement valide
        if (clip.asset.storageUrl) {
          return clip;
        }
        // Sinon, essayer de le remplacer par un asset complet
      }
      
      // Chercher l'asset correspondant
      const matchingAsset = assetsMap.get(clipAssetId);
      if (matchingAsset) {
        hasUpdatedClips = true;
        console.log(`Asset trouvé pour le clip ${clip.id}, assetId: ${clipAssetId}`);
        return { ...clip, asset: matchingAsset };
      } else {
        console.warn(`Aucun asset trouvé pour l'ID: ${clipAssetId}`);
      }
      
      return clip;
    });

    // Si des clips ont été mis à jour, mettre à jour la timeline
    if (hasUpdatedClips) {
      console.log("Mise à jour des assets pour les clips de la timeline");
      onChange({
        ...timeline,
        clips: updatedClips
      });
    } else {
      console.log("Aucun clip n'a besoin d'être mis à jour");
    }
  }, [timeline, videoAssets, onChange]);
  
  // Exécuter l'association des assets lors du chargement initial et des mises à jour
  useEffect(() => {
    ensureClipsHaveAssets();
  }, [ensureClipsHaveAssets]);
  
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
      
      let updatedClip: Clip = {
        ...draggedClip,
        trackIndex,
        startTime: newStartTime,
        endTime: newStartTime + clipDuration
      };
      
      // Ajuster la position pour éviter les chevauchements
      updatedClip = adjustClipPosition(
        timeline.clips.filter(c => c.id !== draggedClip.id), 
        updatedClip
      );
      
      updateClip(updatedClip);
      setSelectedClipId(updatedClip.id as string);
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
      return newClip;
    }
    
    // Vérifier les chevauchements
    let adjustedClip = { ...newClip };
    let overlap = false;
    
    do {
      overlap = false;
      
      for (const clip of clipsOnTrack) {
        // Vérifier si les intervalles se chevauchent
        if (
          adjustedClip.startTime < clip.endTime && 
          adjustedClip.endTime > clip.startTime
        ) {
          // Placer le clip après celui qui chevauche
          adjustedClip.startTime = clip.endTime;
          adjustedClip.endTime = adjustedClip.startTime + (newClip.endTime - newClip.startTime);
          overlap = true;
          break;
        }
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
                  // Utiliser un identifiant de secours si clip.id est undefined
                  const clipKey = clip.id || `fallback-${trackIndex}-${index}`;
                  
                  return (
                    <div
                      key={clipKey}
                      className={`absolute top-1 bottom-1 rounded overflow-hidden cursor-grab ${
                        clip.id === selectedClipId ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        left: `${clip.startTime * pixelsPerSecond}px`,
                        width: `${(clip.endTime - clip.startTime) * pixelsPerSecond}px`,
                        backgroundColor: clip.id === selectedClipId ? 'rgba(59, 130, 246, 0.5)' : 'rgba(75, 85, 99, 0.5)'
                      }}
                      onClick={(e) => {
                        // Empêcher la propagation pour éviter les sélections multiples
                        e.stopPropagation();
                        // Vérifier que le clip a un ID valide avant de le sélectionner
                        if (clip.id) {
                          console.log(`Sélection du clip ${clip.id}`);
                          setSelectedClipId(clip.id);
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
                          <img 
                            src={clip.asset.storageUrl} 
                            alt={`Clip ${clip.id || index}`}
                            className="w-full h-full object-cover"
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
