import { useCache } from "./useCache";

interface Video {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

interface VideosResponse {
  videos: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useVideosData = () => {
  const cache = useCache<VideosResponse>({
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 50,
  });

  const fetchVideos = async (page = 1, limit = 12) => {
    const cacheKey = `videos-${page}-${limit}`;

    return cache.fetchWithCache(cacheKey, async () => {
      const response = await fetch(`/api/videos?page=${page}&limit=${limit}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des vidéos");
      }

      return {
        videos: result.data.videos || [],
        pagination: result.data.pagination,
      };
    });
  };

  const prefetchNextPage = async (
    currentPage: number,
    limit = 12,
    hasNext: boolean
  ) => {
    if (!hasNext) return;

    const nextPage = currentPage + 1;
    const cacheKey = `videos-${nextPage}-${limit}`;

    if (!cache.has(cacheKey)) {
      // Précharger en arrière-plan sans attendre
      fetchVideos(nextPage, limit).catch((err) =>
        console.warn("Erreur lors du préchargement:", err)
      );
    }
  };

  const invalidateVideos = () => {
    cache.invalidatePattern(/^videos-/);
  };

  return {
    fetchVideos,
    prefetchNextPage,
    invalidateVideos,
    loading: cache.loading,
    error: cache.error,
    getCacheSize: cache.getSize,
  };
};
