import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@lib";
import { Project } from "@models";

/**
 * GET /api/videos/[id] - Récupère une vidéo spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Récupérer le projet avec ses détails complets
    const project = (await Project.findById(id)
      .select(
        "title description publishedUrl thumbnailUrl timeline renderSettings createdAt updatedAt admin_id"
      )
      .lean()) as any;

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Vidéo non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que la vidéo est publiée
    if (!project.publishedUrl) {
      return NextResponse.json(
        { success: false, error: "Vidéo non disponible" },
        { status: 404 }
      );
    }

    // Formater les données
    const video = {
      id: project._id.toString(),
      title:
        project.title ||
        `Vidéo du ${new Date(project.createdAt).toLocaleDateString("fr-FR")}`,
      description: project.description || "",
      videoUrl: project.publishedUrl,
      thumbnailUrl:
        project.thumbnailUrl || "/placeholders/video-placeholder.svg",
      duration: project.timeline?.duration || 0,
      renderSettings: project.renderSettings,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      adminId: project.admin_id,
    };

    return NextResponse.json({
      success: true,
      data: { video },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la vidéo:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Vérifier que l'ID est un ID MongoDB valide
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { success: false, error: "ID de vidéo non valide" },
        { status: 400 }
      );
    }

    // Supprimer le projet
    const result = await Project.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Vidéo non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vidéo supprimée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la vidéo:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}