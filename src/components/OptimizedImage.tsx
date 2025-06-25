import Image from 'next/image';
import React from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Composant d'image optimisée qui utilise next/image avec fallback
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  style
}) => {
  // Pour les URLs externes (comme Cloudinary), on utilise next/image avec unoptimized
  const isExternalUrl = src.startsWith('http://') || src.startsWith('https://');
  
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      unoptimized={isExternalUrl} // Désactiver l'optimisation pour les URLs externes
      onError={() => {
        console.warn('Erreur de chargement d\'image:', src);
        // Fallback vers une image placeholder si besoin
      }}
    />
  );
};
