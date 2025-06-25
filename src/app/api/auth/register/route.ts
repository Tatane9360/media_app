import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@lib";
import { Admin } from "@models";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password, username } = await request.json();

    // Validate input
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Email, mot de passe et nom d'utilisateur requis" },
        { status: 400 }
      );
    }

    // Validate username length
    if (username.length < 3) {
      return NextResponse.json(
        { error: "Le nom d'utilisateur doit comporter au moins 3 caractères" },
        { status: 400 }
      );
    }

    // Check if user already exists (email or username)
    const existingUser = await Admin.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe déjà" },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: "Ce nom d'utilisateur est déjà pris" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new Admin({
      username: username.trim(),
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return NextResponse.json(
      { message: "Utilisateur créé avec succès" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur d'inscription:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
