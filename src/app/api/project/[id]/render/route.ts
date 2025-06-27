import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@lib";
import { connectDB } from "@lib";
import { Project } from "@models";
import { VideoAsset } from "@models";
import { renderVideoFromTimeline } from "@lib";
import { uploadToCloudStorage } from "@lib";
import { Timeline, RenderSettings } from "@interface";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Récupérer le projet
    const projectId = params.id;
    const project = await Project.findById(projectId);

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire du projet - Commenté temporairement
    // if (project.admin_id.toString() !== session.user.id) {
    //   return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    // }

    // Récupérer les paramètres de rendu (facultatif)
    const { renderSettings } = await req.json();

    // Mettre à jour le statut du projet
    project.status = "rendering";
    project.renderProgress = 0;
    await project.save();

    // Récupérer tous les asset IDs utilisés dans la timeline
    const assetIds = new Set<string>();

    // Collecter les IDs depuis les clips vidéo
    if (project.timeline.clips) {
      project.timeline.clips.forEach((clip: any) => {
        if (clip.assetId) {
          assetIds.add(clip.assetId.toString());
        }
      });
    }

    // Collecter les IDs depuis les pistes audio
    if (project.timeline.audioTracks) {
      project.timeline.audioTracks.forEach((track: any) => {
        if (track.assetId) {
          assetIds.add(track.assetId.toString());
        }
      });
    }

    console.log("🔍 Asset IDs trouvés dans la timeline:", Array.from(assetIds));

    // Récupérer tous les assets vidéo nécessaires
    const videoAssets = await VideoAsset.find({
      _id: { $in: Array.from(assetIds) },
    });

    console.log(
      "📁 Assets récupérés:",
      videoAssets.map((a) => ({ id: a._id, url: a.storageUrl }))
    );

    try {
      // Lancer le rendu vidéo en arrière-plan
      // Pour une application de production, cela devrait être fait dans une queue de tâches
      renderVideoAsync(
        project._id,
        project.timeline,
        videoAssets,
        renderSettings || project.renderSettings
      );

      return NextResponse.json({
        message: "Rendu vidéo démarré",
        projectId: project._id,
        status: "rendering",
      });
    } catch (error: unknown) {
      // Mettre à jour le statut en cas d'erreur
      project.status = "error";
      project.renderError =
        error instanceof Error ? error.message : "Erreur inconnue";
      await project.save();

      return NextResponse.json(
        { error: "Erreur lors du démarrage du rendu vidéo" },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Erreur lors du rendu vidéo:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Fonction pour le rendu asynchrone de la vidéo
 */
async function renderVideoAsync(
  projectId: string,
  timeline: Timeline,
  videoAssets: any[],
  renderSettings: RenderSettings
) {
  try {
    // Récupérer le projet
    const project = await Project.findById(projectId);
    if (!project) return;

    // Mise à jour progressive du statut
    const updateProgress = async (progress: number) => {
      project.renderProgress = progress;
      await project.save();
    };

    // Simuler des mises à jour de progression (à remplacer par un vrai suivi)
    await updateProgress(10);

    // Effectuer le rendu vidéo (avec FFmpeg ou API externe)
    const { outputPath } = await renderVideoFromTimeline(
      timeline,
      videoAssets,
      renderSettings
    );

    await updateProgress(70);

    // Lire le fichier de sortie et le télécharger vers le stockage cloud
    const fileBuffer = await import("fs/promises").then((fs) =>
      fs.readFile(outputPath)
    );
    const fileName = `project-${projectId}.mp4`;

    // Télécharger vers le stockage cloud
    const { url, thumbnailUrl } = await uploadToCloudStorage(
      fileBuffer,
      fileName,
      "video/mp4"
    );

    await updateProgress(90);

    // Mettre à jour le projet avec l'URL publiée
    project.publishedUrl = url;
    
    if (!project.thumbnailUrl && thumbnailUrl) {
      project.thumbnailUrl = thumbnailUrl;
    }
    project.status = "completed";
    project.renderProgress = 100;
    await project.save();

    // Nettoyer les fichiers temporaires
    await import("fs/promises").then((fs) =>
      fs.unlink(outputPath).catch(() => {})
    );
  } catch (error: unknown) {
    // Mettre à jour le statut en cas d'erreur
    const project = await Project.findById(projectId);
    if (project) {
      project.status = "error";
      project.renderError =
        error instanceof Error ? error.message : "Erreur inconnue";
      await project.save();
    }

    console.error("Erreur lors du rendu vidéo:", error);
  }
}
