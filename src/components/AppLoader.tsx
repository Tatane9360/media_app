'use client';

import React, { useState, useRef } from 'react';

interface AppLoaderProps {
  /** Chemin vers le fichier vidéo de chargement (webM ou mp4) */
  videoSrc: string;
  /** Vidéo de fallback en cas d'erreur de chargement */
  fallbackVideoSrc?: string;
  /** Callback appelé quand le chargement est terminé */
  onLoadingComplete?: () => void;
}

const AppLoader: React.FC<AppLoaderProps> = ({
  videoSrc,
  fallbackVideoSrc,
  onLoadingComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(videoSrc);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Déterminer le type MIME basé sur l'extension
  const getVideoType = (src: string) => {
    if (src.endsWith('.mp4')) return 'video/mp4';
    if (src.endsWith('.webm')) return 'video/webm';
    return 'video/mp4'; // Par défaut
  };

  // Gestion du chargement de la vidéo
  const handleVideoLoad = () => {
    console.log('Vidéo chargée avec succès:', currentVideoSrc);
    setVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.warn('Impossible de jouer la vidéo automatiquement:', error);
        // Si la lecture automatique échoue, passer directement au contenu
        handleVideoEnded();
      });
    }
  };

  // Gestion des erreurs vidéo avec fallback
  const handleVideoError = () => {
    console.error('Erreur de chargement de la vidéo:', currentVideoSrc);
    
    if (fallbackVideoSrc && currentVideoSrc !== fallbackVideoSrc) {
      console.warn('Utilisation du fallback:', fallbackVideoSrc);
      setCurrentVideoSrc(fallbackVideoSrc);
      setVideoError(false);
      setVideoLoaded(false);
    } else {
      console.error('Aucun fallback disponible, affichage du fond de secours');
      setVideoError(true);
      // En cas d'erreur, passer directement au contenu après 2 secondes
      setTimeout(() => {
        handleVideoEnded();
      }, 2000);
    }
  };

  // Gestion de la fin de la vidéo
  const handleVideoEnded = () => {
    console.log('Vidéo terminée, transition vers le contenu principal');
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onLoadingComplete?.();
      }, 800); // Temps de l'animation de sortie
    }, 500); // Petit délai avant de masquer
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-800 ${
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
            className="w-full h-auto max-h-full object-contain"
            autoPlay
            muted
            playsInline
            preload="auto"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            onCanPlay={handleVideoLoad}
            onEnded={handleVideoEnded}
            style={{ filter: videoLoaded ? 'none' : 'blur(10px)' }}
          >
            <source src={currentVideoSrc} type={getVideoType(currentVideoSrc)} />
            {fallbackVideoSrc && fallbackVideoSrc !== currentVideoSrc && (
              <source src={fallbackVideoSrc} type={getVideoType(fallbackVideoSrc)} />
            )}
            Votre navigateur ne supporte pas la vidéo.
          </video>
        )}

        {/* Pattern de fond animé en cas d'erreur vidéo */}
        {videoError && (
          <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-main">
            <div className="absolute inset-0 opacity-20">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-foreground rounded-full animate-pulse"
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
    </div>
  );
};

export default AppLoader;
