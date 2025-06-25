import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib";
import { connectDB } from "@/lib/mongoose";
import { Project } from "@/models/Project";
import { VideoAsset } from "@/models/VideoAsset";

// Récupérer tous les projets de l'utilisateur
export async function GET() {
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

    // Récupérer les projets de l'utilisateur
    // Utiliser un objet vide pour récupérer tous les projets sans filtre
    const query = {};

    // Si l'utilisateur n'est pas admin, filtrer par son ID - Commenté temporairement
    // if (!session.user.isAdmin) {
    //   query = { admin_id: session.user.id };
    // }

    const projects = await Project.find(query)
      .populate("videoAssets")
      .sort({ updatedAt: -1 });

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 }
    );
  }
}

// Créer un nouveau projet
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

    // Récupérer les données du projet
    const data = await req.json();

    // Vérifier les données minimales requises
    if (!data.title) {
      return NextResponse.json(
        { error: "Le titre du projet est requis" },
        { status: 400 }
      );
    }

    // Vérifier si les assets vidéo existent
    if (data.videoAssets && data.videoAssets.length > 0) {
      const assetIds = data.videoAssets;
      const assets = await VideoAsset.find({ _id: { $in: assetIds } });

      if (assets.length !== assetIds.length) {
        return NextResponse.json(
          { error: "Certains assets vidéo n'existent pas" },
          { status: 400 }
        );
      }
    }

    // Créer le nouveau projet
    const project = new Project({
      title: data.title,
      description: data.description || "",
      admin_id: data.admin_id || "655f5b228d7c8ab62dbbc1ee", // ID temporaire pour les tests
      videoAssets: data.videoAssets || [],
      timeline: data.timeline || {
        duration: 0,
        clips: [],
        audioTracks: [],
      },
      renderSettings: data.renderSettings || {
        resolution: "1080p",
        format: "mp4",
        quality: "high",
      },
      status: "draft",
    });

    // Sauvegarder le projet
    await project.save();

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du projet" },
      { status: 500 }
    );
  }
}
