"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useAdminStats } from "@hooks";
import { Button, Icon } from "@components";

interface Stats {
  videos: number;
  articles: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const adminStats = useAdminStats();
  const [stats, setStats] = useState<Stats>({ videos: 0, articles: 0 });

  const loadStats = useCallback(async () => {
    try {
      const result = await adminStats.fetchStats();
      if (result) {
        setStats({
          videos: result.videos || 0,
          articles: result.articles || 0
        });
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des stats:', error);
      // Garder les stats par défaut en cas d'erreur
    }
  }, [adminStats]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated) {
      // Petit délai pour éviter les conflits de racing condition
      const timer = setTimeout(() => {
        loadStats();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, router, loadStats]);

  if (adminStats.loading || authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="text-lg font-semibold text-foreground">Chargement...</div>
      </div>
    );
  }

  // Afficher un message d'erreur si nécessaire, mais ne pas bloquer l'interface
  const hasError = adminStats.error && stats.videos === 0 && stats.articles === 0;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Dashboard Header */}
        <div className="bg-navy rounded-2xl p-8 mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-8">DASHBOARD</h1>
          
          {hasError && (
            <div className="bg-red-500 text-white p-3 rounded-lg mb-4 text-sm flex items-center justify-between">
              <span>Erreur lors du chargement des statistiques.</span>
              <button 
                onClick={() => loadStats()}
                className="bg-white text-red-500 px-3 py-1 rounded text-xs hover:bg-gray-100"
              >
                Recharger
              </button>
            </div>
          )}
          
          <div className="flex justify-center gap-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange mb-2">{stats.videos}</div>
              <div className="text-xl text-foreground">Vidéos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange mb-2">{stats.articles}</div>
              <div className="text-xl text-foreground">Actualités</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="flex flex-col gap-10">
          {/* À la une Card */}
          <div className="flex items-center gap-9">
            <div className="w-32 h-32 border-2 border-dashed border-foreground rounded-lg flex items-center justify-center">
              <Icon name="bento" size={48} color="#F6F6F6" />
            </div>
            <Link href="/admin/featured" className="flex-1">
              <Button variant="primary" size="lg" className="w-full">
                À LA UNE
              </Button>
            </Link>
          </div>

          {/* Actualités Card */}
          <div className="flex items-center gap-9">
            <div className="w-32 h-32 border-2 border-dashed border-foreground rounded-lg flex items-center justify-center">
              <Icon name="document" size={48} color="#F6F6F6" />
            </div>
            <Link href="/admin/actualite" className="flex-1">
              <Button variant="primary" size="lg" className="w-full">
                ACTUALITÉS
              </Button>
            </Link>
          </div>

          {/* Vidéos Card */}
          <div className="flex items-center gap-9">
            <div className="w-32 h-32 border-2 border-dashed border-foreground rounded-lg flex items-center justify-center">
              <Icon name="arrowUp" size={48} color="#F6F6F6" />
            </div>
            <Link href="/projects" className="flex-1">
              <Button variant="primary" size="lg" className="w-full">
                VIDÉOS
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
