import ffmpeg from "fluent-ffmpeg";
import { promisify } from "util";
import { Readable } from "stream";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { writeFile, unlink } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";

// Essayer de configurer les chemins pour ffmpeg et ffprobe
let isFFmpegAvailable = true;
try {
  // Essayer d'utiliser les binaires fournis par les variables d'environnement
  const ffmpegPath = process.env.FFMPEG_PATH;
  const ffprobePath = process.env.FFPROBE_PATH;

  // Essayer de trouver les binaires installés via npm/pnpm
  const nodeModulesBin = resolve(process.cwd(), "node_modules", ".bin");

  if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
  } else if (fs.existsSync(join(nodeModulesBin, "ffmpeg"))) {
    ffmpeg.setFfmpegPath(join(nodeModulesBin, "ffmpeg"));
  } else if (fs.existsSync(join(nodeModulesBin, "ffmpeg.exe"))) {
    ffmpeg.setFfmpegPath(join(nodeModulesBin, "ffmpeg.exe"));
  }

  if (ffprobePath) {
    ffmpeg.setFfprobePath(ffprobePath);
  } else if (fs.existsSync(join(nodeModulesBin, "ffprobe"))) {
    ffmpeg.setFfprobePath(join(nodeModulesBin, "ffprobe"));
  } else if (fs.existsSync(join(nodeModulesBin, "ffprobe.exe"))) {
    ffmpeg.setFfprobePath(join(nodeModulesBin, "ffprobe.exe"));
  }

  // Vérifier si les chemins sont définis
  console.log("FFmpeg path:", ffmpeg.path);
  console.log("FFprobe path:", ffmpeg.probe);
} catch (error) {
  console.warn("Erreur lors de la configuration de FFmpeg/FFprobe:", error);
  isFFmpegAvailable = false;
}

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
  try {
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
        bitrate: parseInt(
          data.format.bit_rate ? data.format.bit_rate.toString() : "0"
        ),
        audioChannels: audioStream?.channels,
        audioSampleRate: audioStream?.sample_rate
          ? parseInt(audioStream.sample_rate.toString())
          : undefined,
      };
    } finally {
      // Nettoyer le fichier temporaire
      await unlink(tempFilePath).catch(() => {});
    }
  } catch (error) {
    console.warn("Erreur lors de l'extraction des métadonnées:", error);
    console.log("Utilisation des métadonnées par défaut");

    // Retourner des métadonnées par défaut en cas d'erreur
    return {
      duration: 60, // 60 secondes
      width: 1280,
      height: 720,
      codec: "h264",
      framerate: 30,
      bitrate: 2000000, // 2 Mbps
      audioChannels: 2,
      audioSampleRate: 44100,
    };
  }
}

/**
 * Génère une miniature à partir d'un fichier vidéo
 */
export async function generateThumbnail(
  videoBuffer: Buffer,
  timeOffset: number = 0
): Promise<Buffer> {
  try {
    // Créer un fichier temporaire pour la vidéo
    const tempFilePath = join(tmpdir(), `${uuidv4()}.mp4`);
    const thumbnailPath = join(tmpdir(), `${uuidv4()}.jpg`);

    await writeFile(tempFilePath, videoBuffer);

    try {
      // Utiliser ffmpeg pour générer une miniature
      return await new Promise((resolve, reject) => {
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
  } catch (error) {
    console.warn("Erreur lors de la génération de la miniature:", error);
    console.log("Utilisation d'une miniature par défaut");

    // Retourner une miniature par défaut (une image en base64)
    const placeholderBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAUAAAAC0CAMAAADROu3pAAAAM1BMVEX///8AAACenp6vr6/V1dXm5uYMDAw9PT1dXV19fX2Ojo7ExMRtbW0VFRUvLy9NTU3e3t7NMeSYAAADe0lEQVR4nO2d7YKkIAiFxT/zPtP3f7FrO7O7QioFCXlmzm+rCQ9eQFfh9UIIIYQQQgghhBBCCCGEEEIIIYQQQgghhHyL39Q/oP/+X3WtG7D/J/XP7L+p/cFpoPVHlw/KO1e6beBbuPBhWLnwYblxYXcyBHcufM+FGw0x5cJOXdjQlgu7vHbhMwx5Xrp6b3CW9Hjwu1IbXiP1W7DeTQ/Ci1PNALw41Ry4/Ls9OEEbCn6V/PjFtxP+hBen2gF4carZcfnHFOdGlbj2L//Q4lQjAC9ONQIs/2RRPF0VLv9kUTxdFVj+Me57sFG/UJLE0xXR4tQ1QYtT16TF9Dd5+l60qxWKp7RZ+hGodq6hgcVV2qyH3MWFG1q4W9vY0p3uwY1UVWiTdjzAjVRVwOWfLIqnpxuQpEIYXDw9XbT8g3+iHRa0eHoaMUMTuoHI0IQK0eIpVJxqheEaZNASDl2cwiDFUzA+Gg4tnsJA8TQcWjyFQeJpOLR4CpMfT8PBxdNJ8w9wcWoM8eJpOLB4Oo58caod+fE0nOnj6SmS42k4k8fTkwwQT8NJLU5d088QT8NJLU5dM0A8hbG13U+bOAkXLk61Y4B4Cpe4aqfZLDwYF6fa0X88DcfT5Gk4nsbTcPqOp/H0HE/j6TiexkOXX51ZbQ3H03jGjqfxgMWpZnSxJXcGHW3JnUEfW3LnkFicasUA8TSeseNpPGPH03jGjqfxjB1P4xk7nsYzdjyNZ+x4Gs/Y8TSejuKpE9cZy9xbcufT8ZbcGQywJXcGHcXTFOBjKyafARZ+5jFAPI1ngHgazwDxNJ6O4qnTEPM0HW/JncHYW3JnMPaW3BkMvSV3BkNvyZ3B2FtyZzD2ltwZdLQlt2fEDM3YW3JnMPaW3Bn0FE+1Oe7wjb0ldwZgcaoVeNYPrfaXlHFJGRdw1g8tTqGj1PBqf0kZl5RxSamZDlDtr+K4pYyLU5zCocWpcIpTnJJFcYpTsvzLKU5JSyulilPS0tLi1E/RXcvFqZ+iu1L53g2wWvSXAqxZQC9m0VvAK1rAK0WCuopqAb1qAb1gAb1gAb1gAb1SAb36Any1An61AvoXXoCFnwIK6NUKqNiP+fsLFuC9AnoRBfQC/Gy8b0/eV/hZdoGfHQugdzMffT+Ds9z/0NtCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhJD/gT+dUBo2JA4YkQAAAABJRU5ErkJggg==";

    return Buffer.from(placeholderBase64, "base64");
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
