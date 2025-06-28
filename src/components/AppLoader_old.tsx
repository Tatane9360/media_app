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
}

const AppLoader: React.FC<AppLoaderProps> = ({
  videoSrc,
  fallbackVideoSrc,
  minDuration = 2000,
  onLoadingComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(videoSrc);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Gestion du chargement de la vidéo
  const handleVideoLoad = () => {
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
    if (fallbackVideoSrc && currentVideoSrc !== fallbackVideoSrc) {
      console.warn('Erreur de chargement vidéo, utilisation du fallback');
      setCurrentVideoSrc(fallbackVideoSrc);
      setVideoError(false);
    } else {
      console.error('Erreur de chargement de la vidéo de loader');
      setVideoError(true);
      // En cas d'erreur, passer directement au contenu après 2 secondes
      setTimeout(() => {
        handleVideoEnded();
      }, 2000);
    }
  };

  // Gestion de la fin de la vidéo
  const handleVideoEnded = () => {
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onLoadingComplete?.();
      }, 800); // Temps de l'animation de sortie
    }, 500); // Petit délai avant de masquer
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

    // Timeout de sécurité : forcer la fin après minDuration + 2s
    safetyTimeoutRef.current = setTimeout(() => {
      setProgress(100);
    }, minDuration + 2000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
    };
  }, [isVisible, minDuration]);

  // Finalisation du chargement
  useEffect(() => {
    // Compléter le chargement dès que la progression atteint 100%
    // même si la vidéo n'est pas encore chargée
    if (progress >= 100) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minDuration - elapsed);
      
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onLoadingComplete?.();
        }, 800); // Temps de l'animation de sortie
      }, remainingTime);
    }
  }, [progress, minDuration, onLoadingComplete]);

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
            onCanPlay={handleVideoLoad}
            style={{ filter: videoLoaded ? 'none' : 'blur(10px)' }}
          >
            <source src={currentVideoSrc} type="video/webm" />
            {fallbackVideoSrc && fallbackVideoSrc !== currentVideoSrc && (
              <source src={fallbackVideoSrc} type="video/webm" />
            )}
            Votre navigateur ne supporte pas la vidéo.
          </video>
        )}



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
