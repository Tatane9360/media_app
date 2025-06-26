export interface iAppLoaderProps {
  /** Chemin vers le fichier vidéo de chargement (webM ou mp4) */
  videoSrc: string;
  /** Vidéo de fallback en cas d'erreur de chargement */
  fallbackVideoSrc?: string;
  /** Durée minimale d'affichage du loader en millisecondes */
  minDuration?: number;
  /** Callback appelé quand le chargement est terminé */
  onLoadingComplete?: () => void;
  /** Texte personnalisé à afficher */
  loadingText?: string;
  /** Afficher ou non la barre de progression */
  showProgress?: boolean;
}

export interface iAppLoaderConfig {
  /** Durée minimale d'affichage en millisecondes */
  minDuration?: number;
  /** Clé de session pour éviter le re-affichage */
  sessionKey?: string;
  /** Forcer l'affichage même si déjà visité */
  forceShow?: boolean;
}

export interface iClientLayoutProps {
  children: React.ReactNode;
  /** Configuration du loader */
  loaderConfig?: {
    videoSrc: string;
    fallbackVideoSrc?: string;
    minDuration?: number;
    loadingText?: string;
    showProgress?: boolean;
  };
}
