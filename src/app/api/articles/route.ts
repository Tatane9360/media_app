import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  try {
    await connectDB();
    const articles = await Article.find({}).populate("author", "email").sort({ createdAt: -1 });
    
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { title, content, image, published } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const article = new Article({
      title,
      content,
      image,
      published: published || false,
      author: (decoded as any).id,
    });

    await article.save();
    await article.populate("author", "email");

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
