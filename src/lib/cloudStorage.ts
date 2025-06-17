import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateThumbnail } from "./videoProcessing";

// Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-west-3",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "media-app-videos";
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL || "";

/**
 * Télécharge un fichier vers le stockage cloud (AWS S3)
 */
export async function uploadToCloudStorage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ url: string; thumbnailUrl: string }> {
  // Générer un nom de fichier unique
  const timestamp = Date.now();
  const fileKey = `uploads/${timestamp}-${fileName.replace(
    /[^a-zA-Z0-9.-]/g,
    "_"
  )}`;
  const thumbnailKey = `thumbnails/${timestamp}-${fileName.replace(
    /[^a-zA-Z0-9.-]/g,
    "_"
  )}.jpg`;

  // Télécharger le fichier vidéo sur S3
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: "public-read",
    })
  );

  // Générer une miniature et la télécharger
  try {
    const thumbnailBuffer = await generateThumbnail(fileBuffer);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: "image/jpeg",
        ACL: "public-read",
      })
    );

    // Retourner les URLs
    const videoUrl = CLOUDFRONT_URL
      ? `${CLOUDFRONT_URL}/${fileKey}`
      : `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

    const thumbnailUrl = CLOUDFRONT_URL
      ? `${CLOUDFRONT_URL}/${thumbnailKey}`
      : `https://${BUCKET_NAME}.s3.amazonaws.com/${thumbnailKey}`;

    return {
      url: videoUrl,
      thumbnailUrl: thumbnailUrl,
    };
  } catch (error) {
    // En cas d'erreur de génération de miniature, retourner seulement l'URL vidéo
    const videoUrl = CLOUDFRONT_URL
      ? `${CLOUDFRONT_URL}/${fileKey}`
      : `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

    return {
      url: videoUrl,
      thumbnailUrl: "",
    };
  }
}

/**
 * Supprime un fichier du stockage cloud
 */
export async function deleteFromCloudStorage(fileUrl: string): Promise<void> {
  // Extraire la clé du fichier de l'URL
  let fileKey: string;

  if (fileUrl.includes(CLOUDFRONT_URL)) {
    fileKey = fileUrl.replace(`${CLOUDFRONT_URL}/`, "");
  } else {
    fileKey = fileUrl.replace(`https://${BUCKET_NAME}.s3.amazonaws.com/`, "");
  }

  // Supprimer le fichier de S3
  await s3Client.send({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
}
