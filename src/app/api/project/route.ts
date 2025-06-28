import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions, connectDB, verifyToken } from "@lib";
import { Project, VideoAsset } from "@models";

// Récupérer tous les projets de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Connexion à MongoDB
    await connectDB();

    // Récupérer les projets de l'utilisateur
    // Utiliser un objet vide pour récupérer tous les projets sans filtre
    const query = {};

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
    // Authentification hybride : token JWT ou session NextAuth
    let userId = null;

    const token = req.cookies.get("token")?.value;

    if (token) {
      const decoded = verifyToken(token);

      if (typeof decoded === "string") {
        userId = decoded;

      } else if (decoded && typeof decoded === "object" && "id" in decoded) {
        userId = (decoded as any).id;

      } else {
        return NextResponse.json({ error: "Token invalide" }, { status: 401 });
      }
    } else {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      
      userId = session.user.id;
    }

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
      admin_id: userId,
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
