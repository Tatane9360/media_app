import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

import { verifyToken, connectDB } from "@lib";
import { Article } from "@models";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const params = await context.params;

    const article = await Article.findById(params.id).populate("author", "email");

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const params = await context.params;

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { title, content, description, image, published } = await request.json();

    const article = await Article.findByIdAndUpdate(
      params.id,
      { title, content, description, image, published },
      { new: true }
    ).populate("author", "email");

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const params = await context.params;

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const article = await Article.findById(params.id);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.image) {
      try {
        const imageUrl = article.image;
        
        if (imageUrl.includes('/uploads/')) {
          const fileName = imageUrl.split('/uploads/')[1];
          const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
          
          await unlink(filePath);
          console.log(`Image supprimée: ${filePath}`);
        }
      } catch (imageError) {
        console.warn("Erreur lors de la suppression de l'image:", imageError);
      }
    }

    await Article.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
