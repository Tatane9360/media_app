"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import ArticleList from "@/components/ArticleList";
import Icon from "@/components/Icon";
import Link from "next/link";
import { Header } from "@/components";
import NavbarAdmin from "@/components/NavbarAdmin";

interface Admin {
  id: string;
  email: string;
}

interface Stats {
  videosCount: number;
  articlesCount: number;
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<Stats>({ videosCount: 0, articlesCount: 0 });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch article count
      const articlesRes = await fetch("/api/articles/count");
      const articlesData = await articlesRes.json();

      // Fetch video count (ajustez selon votre API)
      const videosRes = await fetch("/api/videos/count");
      const videosData = await videosRes.json();

      setStats({
        articlesCount: articlesData.count || 0,
        videosCount: videosData.count || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({ videosCount: 3, articlesCount: 5 }); // Valeurs par défaut selon la maquette
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-lg font-semibold text-[var(--foreground)]">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1F1F2C] flex flex-col">
      <Header />

      {/* Main content */}
      <main className="flex-1 px-6 py-2 pb-20"> {/* Added bottom padding for navbar */}
        {activeTab === "dashboard" && (
          <div className="mb-8 flex flex-col gap-6">
            <div className="bg-[#24243C] rounded-lg p-6">
              <h1 className="text-center text-white text-2xl font-bold mb-6">DASHBOARD</h1>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-[#E94E1B] text-3xl font-bold">{stats.videosCount}</div>
                  <div className="text-white">Vidéos</div>
                </div>
                <div className="text-center">
                  <div className="text-[#E94E1B] text-3xl font-bold">{stats.articlesCount}</div>
                  <div className="text-white">Actualités</div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="flex flex-col gap-5">
              <div className="flex gap-4">
                <div className="w-20 h-20 border border-dashed border-white rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="w-6 h-6 bg-white rounded"></div>
                    <div className="w-6 h-6 bg-white rounded"></div>
                    <div className="w-6 h-6 bg-white rounded"></div>
                    <div className="w-6 h-6 bg-white rounded"></div>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/admin/a-la-une")}
                  className="flex-1 bg-[#E94E1B] text-white py-3 rounded text-center"
                >
                  À LA UNE
                </button>
              </div>

              <div className="flex gap-4">
                <div className="w-20 h-20 border border-dashed border-white rounded-lg flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                    <div className="w-10 h-8 bg-[#1F1F2C] rounded-sm"></div>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/admin/actualite")}
                  className="flex-1 bg-[#E94E1B] text-white py-3 rounded text-center"
                >
                  ACTUALITÉS
                </button>
              </div>

              <div className="flex gap-4">
                <div className="w-20 h-20 border border-dashed border-white rounded-lg flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 7V17M7 12H17" stroke="#1F2F2C" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("videos")}
                  className="flex-1 bg-[#E94E1B] text-white py-3 rounded text-center"
                >
                  VIDÉOS
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "articles" && (
          <div>
            <button
              onClick={() => setActiveTab("dashboard")}
              className="mb-4 flex items-center text-white gap-2"
            >
              <span>←</span> Retour au dashboard
            </button>
            <h2 className="text-xl font-bold text-white mb-4">Gestion des actualités</h2>
            <ArticleList />
          </div>
        )}

        {activeTab === "featured" && (
          <div>
            <button
              onClick={() => setActiveTab("dashboard")}
              className="mb-4 flex items-center text-white gap-2"
            >
              <span>←</span> Retour au dashboard
            </button>
            <h2 className="text-xl font-bold text-white mb-4">Gestion des contenus à la une</h2>
            <div className="bg-[#24243C] rounded-lg p-6 text-white">
              <p>Interface de gestion des contenus à la une...</p>
            </div>
          </div>
        )}

        {activeTab === "videos" && (
          <div>
            <button
              onClick={() => setActiveTab("dashboard")}
              className="mb-4 flex items-center text-white gap-2"
            >
              <span>←</span> Retour au dashboard
            </button>
            <h2 className="text-xl font-bold text-white mb-4">Gestion des vidéos</h2>
            <div className="bg-[#24243C] rounded-lg p-6 text-white">
              <p>Interface de gestion des vidéos...</p>
            </div>
          </div>
        )}
      </main>

      {/* Using the new NavbarAdmin component */}
      <NavbarAdmin onLogout={handleLogout} />
    </div>
  );
}
