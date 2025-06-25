import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { Admin } from "@models";

import { connectDB } from "./mongoose";
import { jwtSign, jwtVerify } from "./jwt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        await connectDB();

        // Trouver l'administrateur par email
        const admin = await Admin.findOne({ email: credentials.email });
        if (!admin) {
          throw new Error("Email ou mot de passe incorrect");
        }

        // Vérifier le mot de passe
        const isPasswordValid = await admin.comparePassword(
          credentials.password
        );
        if (!isPasswordValid) {
          throw new Error("Email ou mot de passe incorrect");
        }

        // Retourner les données de l'utilisateur
        return {
          id: admin._id.toString(),
          username: admin.username,
          email: admin.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          username: token.username as string,
          email: token.email as string,
        };
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "votre-secret-ultra-sécurisé",
};

// Types pour augmenter les types de session NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    email: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
  }
}
