import React from 'react';

interface VideoThumbnailProps {
  videoUrl: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * Composant qui affiche une miniature vidéo - version simplifiée
 * Utilise un élément img standard au lieu de next/image pour éviter les problèmes
 */
export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoUrl,
  alt,
  width,
  height,
  className,
}) => {
  // Si pas d'URL, afficher un placeholder statique
  if (!videoUrl) {
    return (
      <div 
        className={`bg-gray-800 flex items-center justify-center ${className}`} 
        style={{ width, height }}
      >
        <div className="text-gray-400 text-xs text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="mx-auto mb-2"
          >
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
          <span>Prévisualisation non disponible</span>
        </div>
      </div>
    );
  }

  // Vérifier si c'est une URL Cloudinary
  const isCloudinaryUrl = videoUrl.includes('cloudinary.com');

  if (isCloudinaryUrl) {
    // Construire une URL de miniature Cloudinary directement
    const parts = videoUrl.split('/');
    const cloudName = parts[3];
    
    // Essayer de trouver l'ID public
    let publicId = '';
    const uploadIndex = parts.indexOf('upload');
    
    if (uploadIndex !== -1 && parts.length > uploadIndex + 1) {
      publicId = parts.slice(uploadIndex + 1).join('/');
      
      // Enlever l'extension du fichier si présente
      if (publicId.includes('.')) {
        publicId = publicId.split('.')[0];
      }
      
      // Construire l'URL de la miniature (version sûre)
      const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,w_${width},h_${height}/${publicId}.jpg`;
      
      // Utiliser une balise img standard pour éviter les problèmes avec next/image
      return (
        <img
          src={thumbnailUrl}
          alt={alt}
          width={width}
          height={height}
          className={className}
        />
      );
    }
  }
  
  // Solution de secours - utiliser une balise vidéo avec poster (la première frame)
  return (
    <div 
      className={`bg-gray-800 flex items-center justify-center ${className}`} 
      style={{ width, height }}
    >
      <div className="text-gray-400 text-xs text-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="mx-auto mb-2"
        >
          <polygon points="23 7 16 12 23 17 23 7"></polygon>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </svg>
        <span>Vidéo</span>
      </div>
    </div>
  );
};
