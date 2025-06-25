import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Project } from "@/models/Project";

/**
 * GET /api/videos - Récupère toutes les vidéos rendues
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Récupérer seulement les projets avec une vidéo publiée
    const projects = await Project.find({
      status: "completed",
      publishedUrl: { $exists: true, $ne: null },
    })
      .select("title description publishedUrl thumbnailUrl createdAt updatedAt")
      .sort({ updatedAt: -1 }) // Les plus récents en premier
      .skip(skip)
      .limit(limit)
      .lean();

    // Compter le total pour la pagination
    const total = await Project.countDocuments({
      status: "completed",
      publishedUrl: { $exists: true, $ne: null },
    });

    // Formater les données pour l'affichage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videos = projects.map((project: any) => ({
      id: project._id.toString(),
      title:
        project.title ||
        `Vidéo du ${new Date(project.createdAt).toLocaleDateString("fr-FR")}`,
      description: project.description || "",
      videoUrl: project.publishedUrl,
      thumbnailUrl:
        project.thumbnailUrl || "/placeholders/video-placeholder.svg",
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        videos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des vidéos:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
