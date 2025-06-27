import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions, connectDB, extractVideoMetadata, uploadToCloudStorage } from "@lib";
import { VideoAsset } from "@models";

// Forcer l'utilisation du Node.js runtime pour supporter les modules Node.js
export const runtime = "nodejs";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "50mb",
  },
};

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification - Commenté temporairement pour faciliter les tests
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json(
    //     { error: "Authentification requise" },
    //     { status: 401 }
    //   );
    // }

    // Connexion à MongoDB
    await connectDB();

    // Traiter le téléchargement de fichier (FormData)
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier vidéo fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une vidéo" },
        { status: 400 }
      );
    }

    // Lire le contenu du fichier
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Extraire les métadonnées de la vidéo
    const metadata = await extractVideoMetadata(buffer);

    // Télécharger la vidéo vers le stockage cloud
    const uploadResult = await uploadToCloudStorage(
      buffer,
      file.name,
      file.type
    );

    // Créer un nouvel asset vidéo dans MongoDB
    const videoAsset = await VideoAsset.create({
      admin_id: "655f5b228d7c8ab62dbbc1ee", // ID temporaire pour les tests
      originalName: file.name,
      storageUrl: uploadResult.url,
      duration: metadata.duration || 0,
      mimeType: file.type,
      fileSize: file.size,
      projectId: projectId || undefined, // Ajouter projectId s'il est fourni
      metadata: {
        width: metadata.width,
        height: metadata.height,
        codec: metadata.codec,
        framerate: metadata.framerate,
        bitrate: metadata.bitrate,
        thumbnailUrl: uploadResult.thumbnailUrl,
        audioChannels: metadata.audioChannels,
        audioSampleRate: metadata.audioSampleRate,
      },
      tags: formData.getAll("tags") as string[],
      hasAudio: (metadata.audioChannels && metadata.audioChannels > 0) || false, // Détecter automatiquement
    });

    // Si un projectId est fourni, ajouter l'asset à ce projet
    if (projectId) {
      const { Project } = await import("@models");
      const project = await Project.findById(projectId);

      if (project) {
        project.videoAssets = [...(project.videoAssets || []), videoAsset._id];
        await project.save();
      }
    }

    return NextResponse.json(
      {
        message: "Vidéo téléchargée avec succès",
        videoAsset,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Erreur lors du téléchargement de la vidéo:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors du téléchargement: ${errorMessage}` },
      { status: 500 }
    );
  }
}
