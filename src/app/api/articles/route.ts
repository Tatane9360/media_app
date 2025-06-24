import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { verifyToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const isAdmin = searchParams.get('admin') === 'true';

    console.log(`API: Fetching articles from database (admin mode: ${isAdmin})`);

    const allArticles = await Article.find({}).populate("author", "email");
    console.log(`API: Total articles in DB: ${allArticles.length}`);

    if (isAdmin) {
      console.log(`API: Admin mode - returning all ${allArticles.length} articles`);
      return NextResponse.json({ articles: allArticles });
    }

    const publishedArticles = await Article.find({ published: true }).populate("author", "email").sort({ createdAt: -1 });
    console.log(`API: Public mode - returning ${publishedArticles.length} published articles`);

    return NextResponse.json({ articles: publishedArticles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    console.log('API: Processing article creation request');

    const token = request.cookies.get("token")?.value;
    if (!token) {
      console.log('API: Unauthorized - No token provided');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('API: Unauthorized - Invalid token');
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    console.log('API: Received article data:', body);

    const { title, content, image, published } = body;

    if (!title || !content) {
      console.log('API: Missing required fields');
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const isPublished = published === true || published === 'true';
    console.log('API: Article will be created with published =', isPublished);

    const article = new Article({
      title,
      content,
      image,
      published: isPublished,
      author: (decoded as any).id,
    });

    await article.save();
    await article.populate("author", "email");

    console.log('API: Article created successfully:', {
      id: article._id,
      title: article.title,
      published: article.published
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
