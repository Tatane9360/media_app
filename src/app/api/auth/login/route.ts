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

    const isPasswordValid = await bcrypt.compare(password, admin.password);

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
