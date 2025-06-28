import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions, connectDB } from "@lib";
import { Project } from "@models";
import { Clip } from "@interface";

// Récupérer un projet par son ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const token = req.cookies.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Connexion à MongoDB
    await connectDB();

    // Extraire et valider l'ID du projet
    // Utiliser await Promise.resolve() pour résoudre la promesse params
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    // Vérifier si l'ID est un ID MongoDB valide (24 caractères hexadécimaux)
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    // Si ce n'est pas un ID MongoDB valide, on peut essayer de chercher par un autre champ
    // Par exemple, nous pourrions chercher par un champ slug ou un autre identifiant unique
    let project;

    if (isValidMongoId) {
      // Si c'est un ID MongoDB valide, on utilise findById et on peuple les assets vidéo
      project = await Project.findById(id).populate({
        path: "videoAssets",
        model: "VideoAsset",
      });

      // Assurons-nous que chaque clip a son asset vidéo associé
      if (
        project &&
        project.timeline &&
        project.timeline.clips &&
        project.timeline.clips.length > 0
      ) {
        const videoAssetsMap = new Map();

        // Créer un map des assets vidéo pour un accès rapide
        if (project.videoAssets && Array.isArray(project.videoAssets)) {
          project.videoAssets.forEach((asset: any) => {
            if (asset._id) {
              videoAssetsMap.set(asset._id.toString(), asset);
            }
          });
        }

        // Associer l'asset complet à chaque clip
        project.timeline.clips = project.timeline.clips.map((clip: Clip) => {
          if (clip.assetId && !clip.asset) {
            const assetId = clip.assetId.toString();
            const asset = videoAssetsMap.get(assetId);
            if (asset) {
              clip.asset = asset;
            }
          }
          return clip;
        });
      }
    } else {
      // Sinon, on peut chercher par un autre champ comme un slug ou un identifiant personnalisé
      // Par exemple : project = await Project.findOne({ customId: id }).populate("videoAssets");
      // Pour ce test, nous renvoyons juste une erreur
      return NextResponse.json(
        { error: "Format d'ID de projet non valide" },
        { status: 400 }
      );
    }

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Vérifier que l'administrateur est le propriétaire du projet
    // Commenté temporairement pour déboguer
    // if (session?.user && project.admin_id.toString() !== session.user.id) {
    //   return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    // }

    // Retourner le projet
    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du projet" },
      { status: 500 }
    );
  }
}

// Mettre à jour un projet
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const token = req.cookies.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Connexion à MongoDB
    await connectDB();

    // Extraire et valider l'ID du projet
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    // Vérifier si l'ID est un ID MongoDB valide
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValidMongoId) {
      return NextResponse.json(
        { error: "Format d'ID de projet non valide" },
        { status: 400 }
      );
    }

    // Récupérer le projet existant
    const existingProject = await Project.findById(id);

    if (!existingProject) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Récupérer les données de mise à jour
    const updateData = await req.json();

    // Filtrer les champs autorisés pour la mise à jour
    const allowedFields = [
      "title",
      "description",
      "thumbnailUrl",
      "timeline",
      "renderSettings",
      "isPublic",
      "tags",
      "status",
      "publishedUrl",
      "renderProgress",
      "renderError",
    ];

    const filteredUpdateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    }

    // Mettre à jour le projet
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        ...filteredUpdateData,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: "videoAssets",
      model: "VideoAsset",
    });

    return NextResponse.json(
      {
        message: "Projet mis à jour avec succès",
        project: updatedProject,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du projet" },
      { status: 500 }
    );
  }
}

// Supprimer un projet
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const token = req.cookies.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Connexion à MongoDB
    await connectDB();

    // Extraire et valider l'ID du projet
    // Utiliser await Promise.resolve() pour résoudre la promesse params
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    // Vérifier si l'ID est un ID MongoDB valide (24 caractères hexadécimaux)
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValidMongoId) {
      return NextResponse.json(
        { error: "Format d'ID de projet non valide" },
        { status: 400 }
      );
    }

    // Récupérer le projet
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Supprimer le projet
    await Project.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Projet supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du projet" },
      { status: 500 }
    );
  }
}
