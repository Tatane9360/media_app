import { NextRequest, NextResponse } from "next/server";

import { connectDB, verifyToken } from "@lib";
import { Project, Article } from "@models";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    await connectDB();

    const videoCount = await Project.countDocuments({
      status: "completed",
      publishedUrl: { $exists: true, $ne: null },
    });

    const articleCount = await Article.countDocuments();

    return NextResponse.json({
      success: true,
      stats: {
        videos: videoCount,
        articles: articleCount,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
