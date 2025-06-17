export interface VideoAssetMetadata {
  width?: number;
  height?: number;
  codec?: string;
  framerate?: number;
  bitrate?: number;
  thumbnailUrl?: string;
  audioChannels?: number;
  audioSampleRate?: number;
}

export interface VideoAsset {
  _id?: string;
  id: string;
  admin_id: string;
  originalName: string;
  storageUrl: string;
  duration: number;
  mimeType: string;
  fileSize: number;
  metadata: VideoAssetMetadata;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
