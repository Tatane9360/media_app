import { useState, useEffect } from "react";

export interface AppLoaderConfig {
  /** Durée minimale d'affichage en millisecondes */
  minDuration?: number;
  /** Clé de session pour éviter le re-affichage */
  sessionKey?: string;
  /** Forcer l'affichage même si déjà visité */
  forceShow?: boolean;
}

export const useAppLoader = (config: AppLoaderConfig = {}) => {
  const {
    minDuration = 2000,
    sessionKey = "hasVisited",
    forceShow = false,
  } = config;

  const [isLoading, setIsLoading] = useState(() => {
    // Vérifier si c'est la première visite seulement côté client
    if (typeof window !== "undefined" && !forceShow) {
      return !sessionStorage.getItem(sessionKey);
    }
    return true;
  });

  const [startTime] = useState(() => Date.now());

  const completeLoading = () => {
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, minDuration - elapsed);

    setTimeout(() => {
      if (typeof window !== "undefined" && !forceShow) {
        sessionStorage.setItem(sessionKey, "true");
      }
      setIsLoading(false);
    }, remainingTime);
  };

  const resetLoader = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(sessionKey);
    }
    setIsLoading(true);
  };

  return {
    isLoading,
    completeLoading,
    resetLoader,
  };
};

export default useAppLoader;
