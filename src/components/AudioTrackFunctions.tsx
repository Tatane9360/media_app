import { AudioTrack, Timeline, Clip } from '@interface';

export interface AudioTrackState {
  draggedAudioTrack: AudioTrack | null;
  draggedAudioOffsetX: number;
  selectedAudioTrackId: string | null;
  trimmingAudioTrack: AudioTrack | null;
  trimmingAudioType: 'start' | 'end' | null;
  originalAudioData: {
    startTime: number;
    endTime: number;
    assetDuration: number;
  } | null;
}

export const createAudioTrackFunctions = (
  state: AudioTrackState,
  setState: (updates: Partial<AudioTrackState>) => void,
  updateTimeline: (updates: Partial<Timeline>) => void,
  pixelsPerSecond: number,
  timeline: Timeline
) => {
  
  // Mettre à jour une piste audio
  const updateAudioTrack = (updatedTrack: AudioTrack) => {
    const trackId = updatedTrack.id || updatedTrack._id?.toString();
    if (!trackId) {
      console.error("Impossible de mettre à jour une piste audio sans ID");
      return;
    }
    
    console.log(`Mise à jour de la piste audio ${trackId}`);
    
    const newAudioTracks = timeline.audioTracks.map((track: AudioTrack) => {
      const currentId = track.id || track._id?.toString();
      return currentId === trackId ? updatedTrack : track;
    });
    
    // Recalculer la durée totale de la timeline
    const maxEndTime = Math.max(
      ...timeline.clips.map(clip => clip.endTime),
      ...newAudioTracks.map(track => track.endTime)
    );
    
    updateTimeline({
      audioTracks: newAudioTracks,
      duration: Math.max(timeline.duration, maxEndTime)
    });
  };

  // Supprimer une piste audio
  const removeAudioTrack = (trackId: string) => {
    console.log(`Suppression de la piste audio ${trackId}`);
    
    const newAudioTracks = timeline.audioTracks.filter((track: AudioTrack) => {
      const currentId = track.id || track._id?.toString();
      return currentId !== trackId;
    });
    
    // Recalculer la durée totale de la timeline
    const maxEndTime = Math.max(
      ...timeline.clips.map(clip => clip.endTime).concat(0),
      ...newAudioTracks.map(track => track.endTime).concat(0)
    );
    
    updateTimeline({
      audioTracks: newAudioTracks,
      duration: newAudioTracks.length > 0 || timeline.clips.length > 0 ? maxEndTime : 60
    });
    
    setState({ selectedAudioTrackId: null });
  };

  // Commencer le drag d'une piste audio
  const handleAudioTrackDragStart = (e: React.DragEvent, track: AudioTrack) => {
    e.stopPropagation();
    setState({ draggedAudioTrack: track });
    
    const trackElement = e.currentTarget as HTMLElement;
    const trackRect = trackElement.getBoundingClientRect();
    const offsetX = e.clientX - trackRect.left;
    setState({ draggedAudioOffsetX: offsetX });
    
    const trackId = track.id || track._id?.toString() || '';
    e.dataTransfer.setData('text/plain', trackId);
    e.dataTransfer.effectAllowed = 'move';
    
    trackElement.classList.add('opacity-50');
  };

  // Fin du drag d'une piste audio
  const handleAudioTrackDragEnd = () => {
    setState({ draggedAudioTrack: null });
  };

  // Gérer le drop d'une piste audio
  const handleAudioTrackDrop = (e: React.DragEvent, targetTrackIndex: number) => {
    e.preventDefault();
    
    if (!state.draggedAudioTrack) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const trackDuration = state.draggedAudioTrack.endTime - state.draggedAudioTrack.startTime;
    const newStartTime = Math.max(0, (x - state.draggedAudioOffsetX) / pixelsPerSecond);
    
    const updatedTrack: AudioTrack = {
      ...state.draggedAudioTrack,
      trackIndex: targetTrackIndex,
      startTime: newStartTime,
      endTime: newStartTime + trackDuration
    };
    
    updateAudioTrack(updatedTrack);
    setState({ 
      selectedAudioTrackId: updatedTrack.id || updatedTrack._id?.toString() || null,
      draggedAudioTrack: null 
    });
  };

  // Commencer le trimming d'une piste audio
  const handleAudioTrimStart = (e: React.MouseEvent, track: AudioTrack, type: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    
    const trackId = track.id || track._id?.toString();
    if (!trackId) {
      console.error("Impossible de démarrer le trimming: piste audio sans ID");
      return;
    }
    
    if (!track.asset) {
      console.error("Impossible de démarrer le trimming: piste audio sans asset");
      return;
    }
    
    const assetDuration = track.asset.duration || (track.endTime - track.startTime);
    if (!assetDuration || assetDuration <= 0) {
      console.error("Impossible de démarrer le trimming: durée d'asset audio invalide", track.asset);
      return;
    }
    
    console.log(`Début du trimming ${type} pour la piste audio ${trackId}`);
    
    const originalData = {
      startTime: track.startTime,
      endTime: track.endTime,
      assetDuration
    };
    
    const localTrimmingStartX = e.clientX;
    
    setState({
      trimmingAudioTrack: track,
      trimmingAudioType: type,
      originalAudioData: originalData,
      selectedAudioTrackId: trackId
    });
    
    const handleElement = e.currentTarget as HTMLElement;
    handleElement.classList.add('active');
    
    const handleLocalAudioTrimDrag = (moveEvent: MouseEvent) => {
      try {
        const delta = (moveEvent.clientX - localTrimmingStartX) / pixelsPerSecond;
        
        const updatedTrack = { ...track };
        
        if (type === 'start') {
          const newStartTime = originalData.startTime + delta;
          const maxStartTime = originalData.endTime - 0.1; // Laisser au moins 0.1s
          updatedTrack.startTime = Math.max(0, Math.min(newStartTime, maxStartTime));
        } else {
          const newEndTime = originalData.endTime + delta;
          const minEndTime = originalData.startTime + 0.1; // Laisser au moins 0.1s
          updatedTrack.endTime = Math.max(minEndTime, newEndTime);
        }
        
        // Vérifier la durée minimale
        const newDuration = updatedTrack.endTime - updatedTrack.startTime;
        if (newDuration < 0.1) return;
        
        updateAudioTrack(updatedTrack);
        setState({ trimmingAudioTrack: updatedTrack });
      } catch (error) {
        console.error("Erreur lors du trimming audio:", error);
      }
    };
    
    const handleLocalAudioTrimEnd = (e: MouseEvent) => {
      e.preventDefault();
      console.log(`Fin du trimming ${type} pour la piste audio ${trackId}`);
      
      document.removeEventListener('mousemove', handleLocalAudioTrimDrag);
      document.removeEventListener('mouseup', handleLocalAudioTrimEnd);
      
      const activeHandles = document.querySelectorAll('.audio-trim-handle.active');
      activeHandles.forEach(handle => handle.classList.remove('active'));
      
      setState({
        trimmingAudioTrack: null,
        trimmingAudioType: null,
        originalAudioData: null
      });
    };
    
    document.addEventListener('mousemove', handleLocalAudioTrimDrag, { passive: false });
    document.addEventListener('mouseup', handleLocalAudioTrimEnd, { once: true, passive: false });
  };

  return {
    updateAudioTrack,
    removeAudioTrack,
    handleAudioTrackDragStart,
    handleAudioTrackDragEnd,
    handleAudioTrackDrop,
    handleAudioTrimStart
  };
};
