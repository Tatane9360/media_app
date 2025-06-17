import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { Admin } from "@/models/Admin";
import { signToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Find user by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return NextResponse.json(
        { error: "Identifiants invalides email" },
        { status: 401 }
      );
    }

    // DEBUG: Logs détaillés
    console.log("=== DEBUG LOGIN ===");
    console.log("Email trouvé:", admin.email);
    console.log("Password depuis request:", password);
    console.log("Password depuis DB:", admin.password);
    console.log("Type du password request:", typeof password);
    console.log("Type du password DB:", typeof admin.password);
    console.log("Longueur password request:", password?.length);
    console.log("Longueur password DB:", admin.password?.length);
    console.log("Password DB commence par $2a$ ou $2b$:", admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$'));
    
    // Test manuel de bcrypt
    try {
      const testCompare = await bcrypt.compare(password, admin.password);
      console.log("Résultat bcrypt.compare:", testCompare);
    } catch (bcryptError) {
      console.log("Erreur bcrypt.compare:", bcryptError);
    }

    // Test avec un hash simple pour vérifier
    const testHash = await bcrypt.hash(password, 12);
    console.log("Test hash du même password:", testHash);
    const testCompareWithNewHash = await bcrypt.compare(password, testHash);
    console.log("Test compare avec nouveau hash:", testCompareWithNewHash);

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    console.log("Résultat final isPasswordValid:", isPasswordValid);
    console.log("=== FIN DEBUG ===");

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Identifiants invalides password" },
        { status: 401 }
      );
    }
    await admin.save();

    // Generate JWT token
    const token = signToken({
      id: admin._id,
      email: admin.email,
    });

    const response = NextResponse.json({
      message: "Connexion réussie",
      token,
      user: {
        id: admin._id,
        email: admin.email,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Erreur de connexion:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
