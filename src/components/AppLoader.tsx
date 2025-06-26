'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AppLoaderProps {
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

const AppLoader: React.FC<AppLoaderProps> = ({
  videoSrc,
  fallbackVideoSrc,
  minDuration = 2000,
  onLoadingComplete,
  loadingText = "Chargement en cours...",
  showProgress = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(videoSrc);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gestion du chargement de la vidéo
  const handleVideoLoad = () => {
    setVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.warn('Impossible de jouer la vidéo automatiquement:', error);
      });
    }
  };

  // Gestion des erreurs vidéo avec fallback
  const handleVideoError = () => {
    if (fallbackVideoSrc && currentVideoSrc !== fallbackVideoSrc) {
      console.warn('Erreur de chargement vidéo, utilisation du fallback');
      setCurrentVideoSrc(fallbackVideoSrc);
      setVideoError(false);
    } else {
      console.error('Erreur de chargement de la vidéo de loader');
      setVideoError(true);
      setVideoLoaded(true); // Continuer même sans vidéo
    }
  };

  // Simulation de progression réaliste
  useEffect(() => {
    if (!isVisible) return;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const elapsed = Date.now() - startTimeRef.current;
        const minProgress = Math.min((elapsed / minDuration) * 100, 100);
        
        if (prev >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          return 100;
        }
        
        // Progression plus rapide au début, plus lente vers la fin
        const increment = prev < 70 ? Math.random() * 15 + 5 : Math.random() * 5 + 1;
        return Math.min(prev + increment, minProgress);
      });
    }, 150);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isVisible, minDuration]);

  // Finalisation du chargement
  useEffect(() => {
    if (progress >= 100 && videoLoaded) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minDuration - elapsed);
      
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onLoadingComplete?.();
        }, 800); // Temps de l'animation de sortie
      }, remainingTime);
    }
  }, [progress, videoLoaded, minDuration, onLoadingComplete]);

  // Messages de chargement dynamiques
  const getLoadingMessage = () => {
    if (progress < 25) return "Initialisation...";
    if (progress < 50) return "Chargement des ressources...";
    if (progress < 75) return "Configuration...";
    if (progress < 95) return "Finalisation...";
    return "Presque prêt...";
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-800 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-label="Chargement de l'application"
      aria-live="polite"
    >
      {/* Vidéo de chargement */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {!videoError && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            style={{ filter: videoLoaded ? 'none' : 'blur(10px)' }}
          >
            <source src={currentVideoSrc} type="video/webm" />
            <source src={currentVideoSrc} type="video/mp4" />
            Votre navigateur ne supporte pas la vidéo.
          </video>
        )}

        {/* Overlay sombre pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-black/30 z-10" />

        {/* Contenu de chargement */}
        <div className="relative z-20 text-center text-white max-w-md mx-auto px-6">
          {/* Texte principal */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
              Media Challenge
            </h1>
            <p 
              className="text-lg md:text-xl text-gray-200 animate-fade-in-delay"
              aria-live="polite"
            >
              {loadingText}
            </p>
          </div>

          {/* Barre de progression */}
          {showProgress && (
            <div className="w-full max-w-xs mx-auto mb-6">
              <div className="bg-white/20 rounded-full h-1 overflow-hidden backdrop-blur-sm">
                <div
                  className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-sm text-gray-300">
                <span>{getLoadingMessage()}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {/* Indicateur de chargement vidéo */}
          {!videoLoaded && !videoError && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {/* Message d'erreur discret */}
          {videoError && (
            <p className="text-sm text-gray-400 mt-4">
              Chargement en mode simplifié...
            </p>
          )}
        </div>

        {/* Pattern de fond animé en cas d'erreur vidéo */}
        {videoError && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="absolute inset-0 opacity-20">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${3 + Math.random() * 4}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Styles CSS intégrés */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-delay {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in-delay 1s ease-out 0.3s both;
        }
      `}</style>
    </div>
  );
};

export default AppLoader;
