import ffmpeg from "fluent-ffmpeg";
import { promisify } from "util";
import { Readable } from "stream";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, unlink } from "fs/promises";
import { v4 as uuidv4 } from "uuid";

// Interface pour les métadonnées vidéo
export interface VideoMetadata {
  duration?: number;
  width?: number;
  height?: number;
  codec?: string;
  framerate?: number;
  bitrate?: number;
  audioChannels?: number;
  audioSampleRate?: number;
}

/**
 * Extrait les métadonnées d'un fichier vidéo
 */
export async function extractVideoMetadata(
  videoBuffer: Buffer
): Promise<VideoMetadata> {
  // Créer un fichier temporaire
  const tempFilePath = join(tmpdir(), `${uuidv4()}.mp4`);
  await writeFile(tempFilePath, videoBuffer);

  try {
    // Utiliser ffprobe pour obtenir les métadonnées
    const getMetadata = promisify<string, ffmpeg.FfprobeData>(ffmpeg.ffprobe);
    const data = await getMetadata(tempFilePath);

    // Extraire les données vidéo
    const videoStream = data.streams.find(
      (stream) => stream.codec_type === "video"
    );
    const audioStream = data.streams.find(
      (stream) => stream.codec_type === "audio"
    );

    return {
      duration: data.format.duration || 0,
      width: videoStream?.width,
      height: videoStream?.height,
      codec: videoStream?.codec_name,
      framerate: videoStream?.r_frame_rate
        ? eval(videoStream.r_frame_rate as string)
        : undefined,
      bitrate: parseInt(data.format.bit_rate || "0"),
      audioChannels: audioStream?.channels,
      audioSampleRate: audioStream?.sample_rate
        ? parseInt(audioStream.sample_rate)
        : undefined,
    };
  } finally {
    // Nettoyer le fichier temporaire
    await unlink(tempFilePath).catch(() => {});
  }
}

/**
 * Génère une miniature à partir d'un fichier vidéo
 */
export async function generateThumbnail(
  videoBuffer: Buffer,
  timeOffset: number = 0
): Promise<Buffer> {
  // Créer un fichier temporaire pour la vidéo
  const tempFilePath = join(tmpdir(), `${uuidv4()}.mp4`);
  const thumbnailPath = join(tmpdir(), `${uuidv4()}.jpg`);

  await writeFile(tempFilePath, videoBuffer);

  try {
    // Utiliser ffmpeg pour générer une miniature
    return new Promise((resolve, reject) => {
      ffmpeg(tempFilePath)
        .screenshots({
          timestamps: [timeOffset],
          filename: thumbnailPath,
          folder: tmpdir(),
          size: "320x180",
        })
        .on("end", async () => {
          try {
            const thumbnailBuffer = await import("fs").then((fs) =>
              fs.promises.readFile(thumbnailPath)
            );
            resolve(thumbnailBuffer);
          } catch (error) {
            reject(error);
          }
        })
        .on("error", (err) => {
          reject(
            new Error(
              `Erreur lors de la génération de la miniature: ${err.message}`
            )
          );
        });
    });
  } finally {
    // Nettoyer les fichiers temporaires
    await Promise.all([
      unlink(tempFilePath).catch(() => {}),
      unlink(thumbnailPath).catch(() => {}),
    ]);
  }
}

/**
 * Convertit la timeline en commandes FFmpeg
 */
export function timelineToFfmpegCommands(
  timeline: any,
  videoAssets: any[]
): { inputFiles: string[]; filterComplex: string; outputOptions: string[] } {
  // À implémenter selon la structure de la timeline
  // Cette fonction convertira la structure de timeline en commandes FFmpeg

  // Exemple simplifié
  return {
    inputFiles: [],
    filterComplex: "",
    outputOptions: [],
  };
}

/**
 * Fonction pour le rendu vidéo basé sur une timeline
 */
export async function renderVideoFromTimeline(
  timeline: any,
  videoAssets: any[],
  outputOptions: {
    format: string;
    quality: string;
    codec: string;
    bitrateVideo: number;
    bitrateAudio: number;
  }
): Promise<{ outputPath: string }> {
  // À implémenter avec FFmpeg
  // Cette fonction prendra une timeline et des assets et générera une vidéo montée

  // Exemple simplifié de retour
  return {
    outputPath: "/temp/output.mp4",
  };
}
