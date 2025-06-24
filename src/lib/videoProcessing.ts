import ffmpeg from "fluent-ffmpeg";
import { promisify } from "util";
import { Readable } from "stream";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { writeFile, unlink } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import { Timeline } from "../interface/iProject";
import { VideoAsset } from "../interface/iVideoAsset";

// Essayer de configurer les chemins pour ffmpeg et ffprobe
let isFFmpegAvailable = true;
try {
  // Utiliser les chemins définis dans les variables d'environnement
  const ffmpegPath = process.env.FFMPEG_PATH || "/opt/homebrew/bin/ffmpeg";
  const ffprobePath = process.env.FFPROBE_PATH || "/opt/homebrew/bin/ffprobe";

  // Essayer d'abord les chemins des variables d'environnement
  if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log("FFmpeg path configuré:", ffmpegPath);
  }

  if (ffprobePath && fs.existsSync(ffprobePath)) {
    ffmpeg.setFfprobePath(ffprobePath);
    console.log("FFprobe path configuré:", ffprobePath);
  }

  // Si pas trouvé, essayer de trouver les binaires installés via npm/pnpm
  const nodeModulesBin = resolve(process.cwd(), "node_modules", ".bin");

  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    if (fs.existsSync(join(nodeModulesBin, "ffmpeg"))) {
      ffmpeg.setFfmpegPath(join(nodeModulesBin, "ffmpeg"));
    } else if (fs.existsSync(join(nodeModulesBin, "ffmpeg.exe"))) {
      ffmpeg.setFfmpegPath(join(nodeModulesBin, "ffmpeg.exe"));
    }
  }

  if (!ffprobePath || !fs.existsSync(ffprobePath)) {
    if (fs.existsSync(join(nodeModulesBin, "ffprobe"))) {
      ffmpeg.setFfprobePath(join(nodeModulesBin, "ffprobe"));
    } else if (fs.existsSync(join(nodeModulesBin, "ffprobe.exe"))) {
      ffmpeg.setFfprobePath(join(nodeModulesBin, "ffprobe.exe"));
    }
  }
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
    console.error("Erreur lors de l'extraction des métadonnées:", error);
    return {};
  }
}

/**
 * Convertit un stream en buffer
 */
export function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

/**
 * Compresse une vidéo avec des paramètres spécifiés
 */
export async function compressVideo(
  inputBuffer: Buffer,
  options: {
    quality: "low" | "medium" | "high";
    maxSize?: number; // en MB
    codec?: "h264" | "h265";
  }
): Promise<Buffer> {
  const tempInputPath = join(tmpdir(), `${uuidv4()}-input.mp4`);
  const tempOutputPath = join(tmpdir(), `${uuidv4()}-output.mp4`);

  try {
    // Écrire le buffer d'entrée dans un fichier temporaire
    await writeFile(tempInputPath, inputBuffer);

    // Déterminer les paramètres de compression selon la qualité
    let videoBitrate, audioBitrate, crf;
    switch (options.quality) {
      case "low":
        videoBitrate = "500k";
        audioBitrate = "64k";
        crf = 28;
        break;
      case "medium":
        videoBitrate = "1000k";
        audioBitrate = "128k";
        crf = 23;
        break;
      case "high":
        videoBitrate = "2000k";
        audioBitrate = "192k";
        crf = 18;
        break;
    }

    // Effectuer la compression
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .videoCodec(options.codec === "h265" ? "libx265" : "libx264")
        .audioCodec("aac")
        .videoBitrate(videoBitrate)
        .audioBitrate(audioBitrate)
        .outputOptions([`-crf`, crf.toString()])
        .on("end", () => resolve())
        .on("error", reject)
        .save(tempOutputPath);
    });

    // Lire le fichier de sortie
    const outputBuffer = await import("fs/promises").then((fs) =>
      fs.readFile(tempOutputPath)
    );

    return outputBuffer;
  } finally {
    // Nettoyer les fichiers temporaires
    await unlink(tempInputPath).catch(() => {});
    await unlink(tempOutputPath).catch(() => {});
  }
}

/**
 * Génère des options FFmpeg pour une timeline complexe (fonction placeholder)
 * TODO: Implémenter si des fonctionnalités avancées sont nécessaires
 */

/**
 * Fonction pour normaliser un fichier vidéo selon les paramètres du projet
 */
async function normalizeVideoFile(
  inputPath: string,
  outputPath: string,
  projectSettings: {
    width: number;
    height: number;
    framerate: number;
    codec: string;
    audioBitrate: number;
  }
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    console.log(`🔧 Normalisation: ${inputPath} -> ${outputPath}`);
    console.log(
      `📐 Paramètres: ${projectSettings.width}x${projectSettings.height} @ ${projectSettings.framerate}fps`
    );

    ffmpeg(inputPath)
      .videoCodec(projectSettings.codec === "h265" ? "libx265" : "libx264")
      .audioCodec("aac")
      .size(`${projectSettings.width}x${projectSettings.height}`)
      .fps(projectSettings.framerate)
      .audioBitrate(projectSettings.audioBitrate)
      .audioFrequency(48000)
      .outputOptions([
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-preset",
        "medium",
        "-crf",
        "23",
      ])
      .on("start", (commandLine) => {
        console.log(`🎬 Commande normalisation:`, commandLine);
      })
      .on("progress", (progress) => {
        console.log(
          `📊 Progression normalisation: ${Math.round(progress.percent || 0)}%`
        );
      })
      .on("end", () => {
        console.log(`✅ Normalisation terminée: ${outputPath}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`❌ Erreur normalisation: ${err.message}`);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Fonction pour le rendu vidéo basé sur une timeline
 */
export async function renderVideoFromTimeline(
  timeline: Timeline,
  videoAssets: VideoAsset[],
  renderSettings: {
    format: string;
    quality: string;
    codec: string;
    bitrateVideo: number;
    bitrateAudio: number;
  }
): Promise<{ outputPath: string }> {
  console.log("🎬 Début du rendu vidéo...");
  console.log("Timeline:", JSON.stringify(timeline, null, 2));
  console.log("Video Assets:", videoAssets);
  console.log("Render Settings:", renderSettings);

  if (!isFFmpegAvailable) {
    throw new Error("FFmpeg n'est pas disponible. Veuillez l'installer.");
  }

  // Créer un dossier temporaire unique pour ce rendu
  const renderUuid = uuidv4();
  const tempDir = join(tmpdir(), `render-${renderUuid}`);
  const outputPath = join(tempDir, `output.${renderSettings.format || "mp4"}`);

  // Définir les paramètres du projet depuis la timeline
  const projectWidth = timeline.resolution?.width || 1920;
  const projectHeight = timeline.resolution?.height || 1080;
  const projectFramerate = 30; // Défaut, peut être paramétrable
  const projectSettings = {
    width: projectWidth,
    height: projectHeight,
    framerate: projectFramerate,
    codec: renderSettings.codec,
    audioBitrate: renderSettings.bitrateAudio,
  };

  console.log("🎯 Paramètres du projet:", projectSettings);

  try {
    // Créer le dossier temporaire
    await import("fs/promises").then((fs) =>
      fs.mkdir(tempDir, { recursive: true })
    );

    // Vérifier qu'il y a des clips à traiter
    if (!timeline.clips || timeline.clips.length === 0) {
      throw new Error("Aucun clip trouvé dans la timeline");
    }

    // Télécharger et préparer tous les fichiers vidéo
    const inputFiles: string[] = [];

    for (let i = 0; i < timeline.clips.length; i++) {
      const clip = timeline.clips[i];
      console.log(`🔍 Traitement du clip ${i}:`, {
        assetId: clip.assetId,
        trackIndex: clip.trackIndex,
        startTime: clip.startTime,
        endTime: clip.endTime,
      });

      const asset = videoAssets.find(
        (a) => a._id?.toString() === clip.assetId.toString()
      );

      if (!asset || !asset.storageUrl) {
        console.warn(`❌ Asset non trouvé pour le clip ${i}:`, clip);
        console.warn(
          `📋 Assets disponibles:`,
          videoAssets.map((a) => ({ id: a._id?.toString(), url: a.storageUrl }))
        );
        continue;
      }

      console.log(`📥 Téléchargement de l'asset ${i}:`, asset.storageUrl);

      // Télécharger le fichier depuis Cloudinary
      const response = await fetch(asset.storageUrl);
      if (!response.ok) {
        throw new Error(
          `Impossible de télécharger l'asset: ${asset.storageUrl}`
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const inputPath = join(tempDir, `input-${i}.mp4`);

      await writeFile(inputPath, buffer);
      inputFiles.push(inputPath);

      console.log(`✅ Asset ${i} téléchargé:`, inputPath);
    }

    if (inputFiles.length === 0) {
      throw new Error("Aucun fichier d'entrée valide trouvé");
    }

    // Étape 1: Normaliser tous les fichiers selon les paramètres du projet
    console.log("🔄 Normalisation de tous les fichiers...");
    const normalizedFiles: string[] = [];

    for (let i = 0; i < inputFiles.length; i++) {
      const inputFile = inputFiles[i];
      const normalizedPath = join(tempDir, `normalized-${i}.mp4`);

      await normalizeVideoFile(inputFile, normalizedPath, projectSettings);
      normalizedFiles.push(normalizedPath);
    }

    console.log("🔧 Démarrage du traitement FFmpeg final...");

    // Étape 2: Créer la vidéo de sortie
    if (normalizedFiles.length === 1) {
      // Un seul fichier : copie directe (déjà normalisé)
      await new Promise<void>((resolve, reject) => {
        ffmpeg(normalizedFiles[0])
          .on("start", (commandLine) => {
            console.log("Commande FFmpeg finale:", commandLine);
          })
          .on("progress", (progress) => {
            console.log(
              "Progression finale:",
              Math.round(progress.percent || 0) + "%"
            );
          })
          .on("end", () => {
            console.log("✅ Rendu terminé avec succès!");
            resolve();
          })
          .on("error", (err) => {
            console.error("❌ Erreur FFmpeg finale:", err);
            reject(err);
          })
          .videoCodec("copy") // Copie directe car déjà normalisé
          .audioCodec("copy")
          .format(renderSettings.format || "mp4")
          .save(outputPath);
      });
    } else {
      // Plusieurs fichiers : concaténation simple (tous normalisés)
      console.log("🔗 Concaténation des fichiers normalisés...");

      // Créer un fichier de liste pour la concaténation
      const listPath = join(tempDir, "filelist.txt");
      const fileListContent = normalizedFiles
        .map((file) => `file '${file}'`)
        .join("\n");
      await writeFile(listPath, fileListContent);

      // Utiliser la méthode de concaténation par liste de fichiers
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(listPath)
          .inputOptions(["-f", "concat", "-safe", "0"])
          .on("start", (commandLine) => {
            console.log("Commande FFmpeg finale:", commandLine);
          })
          .on("progress", (progress) => {
            console.log(
              "Progression finale:",
              Math.round(progress.percent || 0) + "%"
            );
          })
          .on("end", () => {
            console.log("✅ Rendu terminé avec succès!");
            resolve();
          })
          .on("error", (err) => {
            console.error("❌ Erreur FFmpeg finale:", err);
            reject(err);
          })
          .videoCodec("copy") // Copie directe car tous normalisés
          .audioCodec("copy")
          .format(renderSettings.format || "mp4")
          .save(outputPath);
      });
    }

    console.log("🎉 Rendu terminé! Fichier de sortie:", outputPath);
    return { outputPath };
  } catch (error) {
    console.error("❌ Erreur lors du rendu:", error);

    // Nettoyer les fichiers temporaires en cas d'erreur
    try {
      await import("fs/promises").then((fs) =>
        fs.rm(tempDir, { recursive: true, force: true })
      );
    } catch (cleanupError) {
      console.warn("Erreur lors du nettoyage:", cleanupError);
    }

    throw error;
  }
}

/**
 * Génère une miniature (thumbnail) à partir d'un buffer vidéo
 */
export async function generateThumbnail(
  videoBuffer: Buffer,
  options: {
    width?: number;
    height?: number;
    timeOffset?: number; // Temps en secondes pour capturer la frame
  } = {}
): Promise<Buffer> {
  const tempInputPath = join(tmpdir(), `${uuidv4()}-input.mp4`);
  const tempOutputPath = join(tmpdir(), `${uuidv4()}-thumbnail.jpg`);

  try {
    // Écrire le buffer vidéo dans un fichier temporaire
    await writeFile(tempInputPath, videoBuffer);

    // Générer la miniature avec une approche plus directe
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .seekInput(options.timeOffset || 1) // Se positionner à la seconde désirée
        .frames(1) // Capturer seulement 1 frame
        .size(`${options.width || 320}x${options.height || 180}`)
        .output(tempOutputPath)
        .outputFormat("mjpeg") // Format JPEG
        .on("end", () => {
          console.log("✅ Miniature générée avec succès");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ Erreur génération miniature:", err);
          reject(err);
        })
        .run();
    });

    // Lire le fichier de miniature généré
    const thumbnailBuffer = await fs.promises.readFile(tempOutputPath);

    return thumbnailBuffer;
  } finally {
    // Nettoyer les fichiers temporaires
    await unlink(tempInputPath).catch(() => {});
    await unlink(tempOutputPath).catch(() => {});
  }
}
