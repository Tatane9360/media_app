import { NextRequest, NextResponse } from "next/server";

import { verifyToken, connectDB } from "@lib";
import { Admin } from "@models";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get token from cookies
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded || typeof decoded === "string") {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    // Find user by ID
    const decodedToken = decoded as { id: string; email: string };
    const admin = await Admin.findById(decodedToken.id).select("-password");

    if (!admin) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
