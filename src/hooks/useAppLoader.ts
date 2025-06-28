import { useState, useEffect } from "react";

export interface AppLoaderConfig {
  /** Clé de session pour éviter le re-affichage */
  sessionKey?: string;
  /** Forcer l'affichage même si déjà visité */
  forceShow?: boolean;
}

export const useAppLoader = (config: AppLoaderConfig = {}) => {
  const { sessionKey = "hasVisited", forceShow = false } = config;

  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialisation côté client uniquement
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!forceShow) {
        const hasVisited = sessionStorage.getItem(sessionKey);
        setIsLoading(!hasVisited);
      }
      setIsInitialized(true);
    }
  }, [sessionKey, forceShow]);

  const completeLoading = () => {
    if (!isInitialized) return;

    if (typeof window !== "undefined" && !forceShow) {
      sessionStorage.setItem(sessionKey, "true");
    }
    setIsLoading(false);
  };

  const resetLoader = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(sessionKey);
    }
    setIsLoading(true);
  };

  return {
    isLoading: isLoading && isInitialized,
    completeLoading,
    resetLoader,
  };
};

export default useAppLoader;
