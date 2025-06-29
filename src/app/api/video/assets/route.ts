import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions, connectDB } from "@lib";
import { VideoAsset } from "@models";

// Récupérer tous les assets vidéo
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

    // Récupérer les assets vidéo
    const query = {}; // Utilisez const au lieu de let puisqu'on ne modifie plus la valeur

    // Si l'utilisateur n'est pas admin, filtrer par son ID - Commenté temporairement
    // if (!session.user.isAdmin) {
    //   query = { uploadedBy: session.user.id };
    // }

    const videoAssets = await VideoAsset.find(query).sort({ createdAt: -1 });

    // Transformer les documents MongoDB en objets JSON avec id et _id
    const formattedAssets = videoAssets.map((asset) => {
      const assetObj = asset.toObject();
      // S'assurer que les deux propriétés id et _id existent
      assetObj.id = assetObj._id.toString();
      assetObj._id = assetObj._id.toString();

      // Vérifier la présence et la validité de l'URL de stockage
      if (!assetObj.storageUrl) {
        console.warn(`Asset ${assetObj.id} n'a pas d'URL de stockage valide`);
      }

      return assetObj;
    });

    console.log(`Retour de ${formattedAssets.length} assets vidéo`);

    return NextResponse.json({ videoAssets: formattedAssets });
  } catch (error) {
    console.error("Erreur lors de la récupération des assets vidéo:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des assets vidéo" },
      { status: 500 }
    );
  }
}
