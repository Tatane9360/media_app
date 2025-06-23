import { VideoAsset } from "./iVideoAsset";

// Interfaces pour les effets
export interface Effect {
  type:
    | "filter"
    | "transition"
    | "text"
    | "overlay"
    | "audio"
    | "speed"
    | "crop";
  name: string;
  params: Record<string, unknown>;
  startTime?: number;
  endTime?: number;
}

// Interface pour un clip dans la timeline
export interface Clip {
  id?: string;
  _id?: string; // Pour compatibilité avec MongoDB
  assetId: string;
  asset?: VideoAsset; // Pour utilisation côté client
  trackIndex: number;
  startTime: number;
  endTime: number;
  trimStart?: number;
  trimEnd?: number;
  volume?: number;
  effects?: Effect[];
}

// Interface pour une piste audio
export interface AudioTrack {
  id?: string;
  _id?: string; // Pour compatibilité avec MongoDB
  assetId?: string;
  asset?: VideoAsset; // Pour utilisation côté client
  externalUrl?: string;
  trackIndex: number;
  startTime: number;
  endTime: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  linkedVideoClipId?: string; // ID du clip vidéo auquel cet audio est lié (pour l'audio des clips vidéo)
}

// Interface principale pour la timeline
export interface Timeline {
  duration: number;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "21:9";
  resolution?: {
    width: number;
    height: number;
  };
  clips: Clip[];
  audioTracks: AudioTrack[];
  globalEffects?: Effect[];
}

// Interface pour les paramètres de rendu
export interface RenderSettings {
  format: "mp4" | "webm" | "mov" | "gif";
  quality: "low" | "medium" | "high" | "ultra";
  codec: "h264" | "h265" | "vp9" | "av1";
  bitrateVideo: number;
  bitrateAudio: number;
}

// Interface principale pour un projet
export interface Project {
  id: string;
  admin_id: string;
  title: string;
  description?: string;
  videoAssets: string[] | VideoAsset[]; // Références ou objets complets
  timeline: Timeline;
  thumbnailUrl?: string;
  status: "draft" | "rendering" | "completed" | "published" | "error";
  publishedUrl?: string;
  renderProgress?: number;
  renderError?: string;
  renderSettings: RenderSettings;
  isPublic: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour la création d'un nouveau projet
export interface CreateProjectDto {
  title: string;
  description?: string;
  videoAssets?: string[];
  timeline?: Partial<Timeline>;
  renderSettings?: Partial<RenderSettings>;
  isPublic?: boolean;
  tags?: string[];
}

// Interface pour la mise à jour d'un projet
export interface UpdateProjectDto {
  title?: string;
  description?: string;
  videoAssets?: string[];
  timeline?: Partial<Timeline>;
  thumbnailUrl?: string;
  status?: "draft" | "rendering" | "completed" | "published" | "error";
  publishedUrl?: string;
  renderProgress?: number;
  renderError?: string;
  renderSettings?: Partial<RenderSettings>;
  isPublic?: boolean;
  tags?: string[];
}
