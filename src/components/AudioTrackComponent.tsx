import React from 'react';
import { AudioTrack } from '@/interface/iProject';
import { VideoAsset } from '@/interface/iVideoAsset';

// Fonction utilitaire pour obtenir le nom d'affichage d'un asset (même logique que TimelineEditor)
const getAssetDisplayName = (asset?: VideoAsset): string => {
  if (!asset) return "Audio";
  
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
      // Ignorer les erreurs de parsing d'URL
    }
  }
  
  // Fallback vers l'ID ou un nom générique
  const assetId = asset._id?.toString() || asset.id?.toString();
  return assetId ? `Audio ${assetId.substring(0, 8)}...` : "Audio sans nom";
};

interface AudioTrackComponentProps {
  track: AudioTrack;
  trackKey: string;
  trackIndex: number;
  isSelected: boolean;
  pixelsPerSecond: number;
  onSelect: (trackId: string) => void;
  onDragStart: (e: React.DragEvent, track: AudioTrack) => void;
  onDragEnd: () => void;
  onTrimStart: (e: React.MouseEvent, track: AudioTrack, type: 'start' | 'end') => void;
  onRemove: (trackId: string) => void;
}

export const AudioTrackComponent: React.FC<AudioTrackComponentProps> = ({
  track,
  trackKey,
  isSelected,
  pixelsPerSecond,
  onSelect,
  onDragStart,
  onDragEnd,
  onTrimStart,
  onRemove
}) => {
  const trackColor = track.linkedVideoClipId 
    ? 'rgba(124, 58, 237, 0.5)' // Violet pour les pistes liées aux vidéos
    : 'rgba(52, 211, 153, 0.5)'; // Vert pour les pistes indépendantes

  const borderColor = track.linkedVideoClipId 
    ? 'rgba(124, 58, 237, 0.8)'
    : 'rgba(52, 211, 153, 0.8)';

  return (
    <div
      key={trackKey}
      className={`absolute top-1 h-12 rounded overflow-hidden cursor-grab ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        left: `${track.startTime * pixelsPerSecond}px`,
        width: `${(track.endTime - track.startTime) * pixelsPerSecond}px`,
        backgroundColor: trackColor,
        borderLeft: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`
      }}
      onClick={(e) => {
        e.stopPropagation();
        const trackId = track.id || track._id?.toString();
        if (trackId) {
          onSelect(trackId);
        }
      }}
      draggable={!track.linkedVideoClipId} // Seules les pistes indépendantes peuvent être déplacées
      onDragStart={(e) => !track.linkedVideoClipId && onDragStart(e, track)}
      onDragEnd={onDragEnd}
    >
      {/* Poignée de trimming gauche (seulement pour les pistes indépendantes) */}
      {!track.linkedVideoClipId && (
        <div
          className="audio-trim-handle absolute left-0 top-0 w-2 h-full bg-blue-500 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => onTrimStart(e, track, 'start')}
        />
      )}

      {/* Visualisation de la forme d'onde (simulée) */}
      <div className="w-full h-full flex items-center justify-center px-1">
        <div className="w-full h-6">
          <div 
            className="w-full h-full rounded-sm"
            style={{
              background: track.linkedVideoClipId
                ? 'linear-gradient(to bottom, rgba(147, 51, 234, 0.5), rgba(147, 51, 234, 0.7))'
                : 'linear-gradient(to bottom, rgba(16, 185, 129, 0.5), rgba(16, 185, 129, 0.7))'
            }}
          />
        </div>
      </div>

      {/* Nom du clip audio */}
      <div className="absolute bottom-0 left-0 right-0 text-white text-xs px-1 truncate bg-black bg-opacity-50">
        {getAssetDisplayName(track.asset)}
        {track.linkedVideoClipId && " (lié)"}
      </div>

      {/* Contrôles pour les pistes indépendantes */}
      {!track.linkedVideoClipId && isSelected && (
        <div className="absolute top-0 right-0 flex">
          <button
            className="w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              const trackId = track.id || track._id?.toString();
              if (trackId) {
                onRemove(trackId);
              }
            }}
            title="Supprimer cette piste audio"
          >
            ×
          </button>
        </div>
      )}

      {/* Poignée de trimming droite (seulement pour les pistes indépendantes) */}
      {!track.linkedVideoClipId && (
        <div
          className="audio-trim-handle absolute right-0 top-0 w-2 h-full bg-blue-500 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => onTrimStart(e, track, 'end')}
        />
      )}
    </div>
  );
};
