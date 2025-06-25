import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

function isAdminPath(path: string): boolean {
    switch (true) {
        case path.startsWith("/admin"):
            return true;
        case path.startsWith("/api/admin"):
            return true;
        case path.startsWith("/project"):
            return true;
        case path.startsWith("/projects"):
            return true;
        case path.startsWith("/api/auth/register"):
        default:
            return false;
    }
}

export function middleware(request: NextRequest) {
  if (isAdminPath(request.nextUrl.pathname)) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const decoded = verifyToken(token);
      if (!decoded) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error("Erreur de vérification du token:", error);
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/api/admin/:path*",
        "/project/:path*",
        "/projects/:path*",
        "/api/auth/register"
    ],
};
