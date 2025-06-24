import { v2 as cloudinary } from "cloudinary";
import { generateThumbnail } from "./videoProcessing";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile } from "fs/promises";
import stream from "stream";

// Types pour Cloudinary
type CloudinaryTransformation = Record<string, string | number | boolean>;

interface CloudinaryUploadOptions {
  folder: string;
  public_id?: string;
  resource_type: "video" | "image" | "raw" | "auto";
  transformation?: CloudinaryTransformation[];
}

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
  [key: string]: unknown;
}

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Fonction utilitaire pour uploader un buffer vers Cloudinary
async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    // Créer un stream à partir du buffer
    const readableStream = new stream.PassThrough();
    readableStream.end(buffer);

    // Créer un uploader stream
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        if (!result)
          return reject(new Error("Aucun résultat retourné par Cloudinary"));
        resolve(result as CloudinaryUploadResult);
      }
    );

    // Pipe le buffer vers l'uploader
    readableStream.pipe(uploadStream);
  });
}

/**
 * Télécharge un fichier vers le stockage cloud (Cloudinary)
 */
export async function uploadToCloudStorage(
  fileBuffer: Buffer,
  fileName: string,
  _mimeType: string
): Promise<{ url: string; thumbnailUrl: string }> {
  // Générer un ID unique pour le fichier
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}-${fileName.replace(
    /[^a-zA-Z0-9.-]/g,
    "_"
  )}`;

  // Vérifier si Cloudinary est configuré
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.log("Cloudinary non configuré, simulation du stockage cloud");

    // Stocker temporairement la vidéo sur le disque si possible
    try {
      const tempDir = join(tmpdir(), "media_app_temp");
      const fs = await import("fs");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const localPath = join(tempDir, uniqueFileName);
      await writeFile(localPath, fileBuffer);

      console.log("Fichier vidéo temporaire sauvegardé:", localPath);

      // Simuler les URLs de stockage cloud
      return {
        url: `file://${localPath}`,
        thumbnailUrl: "",
      };
    } catch (error) {
      console.warn("Erreur lors de la sauvegarde temporaire:", error);

      // Retourner des URLs factices
      return {
        url: `https://example.com/uploads/${uniqueFileName}`,
        thumbnailUrl: `https://example.com/thumbnails/${uniqueFileName}.jpg`,
      };
    }
  }

  try {
    // Télécharger la vidéo vers Cloudinary
    const result = await uploadBufferToCloudinary(fileBuffer, {
      folder: "uploads",
      public_id: uniqueFileName.split(".")[0], // Enlever l'extension
      resource_type: "video" as "video" | "image" | "raw" | "auto",
    });

    let thumbnailUrl = "";

    // Générer une miniature et la télécharger
    try {
      const thumbnailBuffer = await generateThumbnail(fileBuffer);

      // Télécharger la miniature vers Cloudinary
      const thumbnailResult = await uploadBufferToCloudinary(thumbnailBuffer, {
        folder: "thumbnails",
        public_id: `${uniqueFileName.split(".")[0]}-thumb`,
        resource_type: "image" as "video" | "image" | "raw" | "auto",
      });

      thumbnailUrl = thumbnailResult.secure_url;
    } catch (error) {
      console.warn("Erreur lors de la génération de miniature:", error);

      // Utiliser une miniature générée par Cloudinary
      thumbnailUrl = cloudinary.url(result.public_id, {
        resource_type: "video",
        transformation: [
          { width: 320, height: 180, crop: "fill" },
          { fetch_format: "auto" },
        ],
      });

      // Log pour déboguer
      console.log("Thumbnail URL générée par Cloudinary:", thumbnailUrl);
    }

    return {
      url: result.secure_url,
      thumbnailUrl,
    };
  } catch (error) {
    console.error("Erreur lors de l'upload vers Cloudinary:", error);
    throw new Error("Erreur lors de l'upload vers le stockage cloud");
  }
}

/**
 * Supprime un fichier du stockage cloud
 */
export async function deleteFromCloudStorage(fileUrl: string): Promise<void> {
  // Vérifier si Cloudinary est configuré
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.log("Cloudinary non configuré, simulation de la suppression");
    return;
  }

  try {
    // Extraire l'ID public de l'URL Cloudinary
    const urlParts = fileUrl.split("/");
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const fileName = fileNameWithExtension.split(".")[0];

    // Déterminer le type de ressource en fonction de l'URL
    const resourceType = fileUrl.includes("/video/")
      ? "video"
      : fileUrl.includes("/image/")
      ? "image"
      : "raw";

    // Supprimer le fichier de Cloudinary
    await cloudinary.uploader.destroy(fileName, {
      resource_type: resourceType as "video" | "image" | "raw",
    });

    console.log(`Fichier supprimé de Cloudinary: ${fileName}`);
  } catch (error) {
    console.error("Erreur lors de la suppression du fichier:", error);
    throw new Error(
      "Erreur lors de la suppression du fichier du stockage cloud"
    );
  }
}
