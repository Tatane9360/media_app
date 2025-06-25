import { useCache } from "./useCache";

interface Project {
  _id: string;
  title: string;
  description?: string;
  status: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

interface ProjectsResponse {
  projects: Project[];
}

export const useProjectsData = () => {
  const cache = useCache<ProjectsResponse>({
    ttl: 3 * 60 * 1000, // 3 minutes (les projets changent plus souvent)
    maxSize: 20,
  });

  const fetchProjects = async () => {
    const cacheKey = "projects-list";

    return cache.fetchWithCache(cacheKey, async () => {
      const response = await fetch("/api/project");

      if (!response.ok) {
        throw new Error("Impossible de charger les projets");
      }

      const data = await response.json();

      return {
        projects: data.projects || [],
      };
    });
  };

  const invalidateProjects = () => {
    cache.clear("projects-list");
  };

  return {
    fetchProjects,
    invalidateProjects,
    loading: cache.loading,
    error: cache.error,
  };
};
