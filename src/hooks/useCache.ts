import { useState, useCallback } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  ttl?: number; // Time to live en millisecondes
  maxSize?: number; // Taille maximum du cache
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 100;

// Cache global partagé entre toutes les instances
class GlobalCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;

  constructor(maxSize = DEFAULT_MAX_SIZE) {
    this.maxSize = maxSize;
  }

  private evictOldest() {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  set<T>(key: string, data: T): void {
    this.evictOldest();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? (entry.data as T) : null;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  getSize(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  isValid(key: string, ttl: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < ttl;
  }
}

// Instance globale du cache
const globalCache = new GlobalCache();

export const useCache = <T>(options: CacheOptions = {}) => {
  const { ttl = DEFAULT_TTL } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback(
    (key: string): T | null => {
      if (globalCache.isValid(key, ttl)) {
        return globalCache.get<T>(key);
      }
      // Supprimer l'entrée expirée
      globalCache.delete(key);
      return null;
    },
    [ttl]
  );

  const set = useCallback((key: string, data: T) => {
    globalCache.set(key, data);
  }, []);

  const fetchWithCache = useCallback(
    async (
      key: string,
      fetchFn: () => Promise<T>,
      forceRefresh = false
    ): Promise<T | null> => {
      // Vérifier le cache d'abord
      if (!forceRefresh) {
        const cachedData = get(key);
        if (cachedData !== null) {
          return cachedData;
        }
      }

      try {
        setLoading(true);
        setError(null);

        const data = await fetchFn();
        set(key, data);

        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(errorMessage);
        console.error(`Erreur lors du fetch pour la clé "${key}":`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get, set]
  );

  const clear = useCallback((key?: string) => {
    if (key) {
      globalCache.delete(key);
    } else {
      globalCache.clear();
    }
  }, []);

  const has = useCallback(
    (key: string): boolean => {
      return globalCache.isValid(key, ttl);
    },
    [ttl]
  );

  const getSize = useCallback(() => {
    return globalCache.getSize();
  }, []);

  const getKeys = useCallback((): string[] => {
    return globalCache.getKeys();
  }, []);

  const invalidatePattern = useCallback((pattern: RegExp) => {
    globalCache.invalidatePattern(pattern);
  }, []);

  return {
    get,
    set,
    fetchWithCache,
    clear,
    has,
    getSize,
    getKeys,
    invalidatePattern,
    loading,
    error,
  };
};
