import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { VideoAsset } from "@/models/VideoAsset";
import { extractVideoMetadata } from "@/lib/videoProcessing";
import { uploadToCloudStorage } from "@/lib/cloudStorage";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "50mb",
  },
};

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Connexion à MongoDB
    await connectDB();

    // Traiter le téléchargement de fichier (FormData)
    const formData = await req.formData();
    const file = formData.get("file") as File;

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
      admin_id: session.user.id,
      originalName: file.name,
      storageUrl: uploadResult.url,
      duration: metadata.duration || 0,
      mimeType: file.type,
      fileSize: file.size,
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
    });

    return NextResponse.json(
      {
        message: "Vidéo téléchargée avec succès",
        videoAsset,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur lors du téléchargement de la vidéo:", error);
    return NextResponse.json(
      { error: `Erreur lors du téléchargement: ${error.message}` },
      { status: 500 }
    );
  }
}
