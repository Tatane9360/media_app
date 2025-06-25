import { useCache } from "./useCache";

interface AdminStats {
  videos: number;
  articles: number;
}

export const useAdminStats = () => {
  const cache = useCache<AdminStats>({
    ttl: 2 * 60 * 1000, // 2 minutes (stats changent souvent)
    maxSize: 5,
  });

  const fetchStats = async () => {
    const cacheKey = "admin-stats";

    return cache.fetchWithCache(cacheKey, async () => {
      const response = await fetch("/api/admin/stats");

      if (!response.ok) {
        throw new Error("Impossible de charger les statistiques");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Erreur lors du chargement des statistiques"
        );
      }

      return data.stats; // Retourner directement data.stats au lieu de data.data
    });
  };

  const invalidateStats = () => {
    cache.clear("admin-stats");
  };

  return {
    fetchStats,
    invalidateStats,
    loading: cache.loading,
    error: cache.error,
  };
};
