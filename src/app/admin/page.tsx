"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ArticleList } from "@components";

interface Admin {
  id: string;
  email: string;
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("articles");
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.admin) {
          setAdmin(data.admin);
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold text-neutral-900">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col justify-between py-8 px-6 min-h-screen shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <span className="inline-block bg-neutral-900 rounded-full p-2">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span className="text-2xl font-bold text-neutral-900">Admin</span>
          </div>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("articles")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                ${
                  activeTab === "articles"
                    ? "bg-gray-100 text-neutral-900 font-semibold shadow"
                    : "hover:bg-gray-100 text-neutral-900"
                }`}
            >
              <span>📝</span>
              Articles
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                ${
                  activeTab === "dashboard"
                    ? "bg-gray-100 text-neutral-900 font-semibold shadow"
                    : "hover:bg-gray-100 text-neutral-900"
                }`}
            >
              <span>📊</span>
              Dashboard
            </button>
          </nav>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-400 mb-1">Connecté en tant que</div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold">
              {admin?.email?.[0]?.toUpperCase()}
            </span>
            <span className="text-sm font-medium text-neutral-900">{admin?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-lg shadow hover:bg-neutral-800 transition"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-10 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            {activeTab === "articles" ? "Gestion des articles" : "Vue d'ensemble"}
          </h1>
        </div>

        <section>
          {activeTab === "articles" && (
            <div>
              <ArticleList />
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Dashboard Overview</h2>
              <p className="text-neutral-700">
                Les statistiques et l’aperçu du dashboard seront affichés ici...
              </p>
              {/* Ajoute ici tes widgets, graphiques, etc. */}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
