'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import PlaceholderSvg from './PlaceholderSvg';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * Composant qui optimise l'affichage des images Cloudinary avec Next.js
 * Corrige les problèmes d'URL et utilise la transformation d'images de Cloudinary
 */
export const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Log pour le débogage
  console.log('CloudinaryImage - URL reçue:', src);
  
  // Si une erreur s'est produite ou si l'URL est vide, afficher le placeholder
  if (imageError || !src) {
    return (
      <div style={{ width: `${width}px`, height: `${height}px` }} className={className}>
        <PlaceholderSvg />
      </div>
    );
  }

  // Vérifier si l'URL est bien une URL Cloudinary
  const isCloudinaryUrl = src && (
    src.includes('cloudinary.com') || 
    src.includes('res.cloudinary.com')
  );

  // Si ce n'est pas une URL Cloudinary, utiliser Image normal
  if (!isCloudinaryUrl) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={() => setImageError(true)}
      />
    );
  }

  // Nettoyer l'URL Cloudinary pour éviter les problèmes de format
  // Certaines URL Cloudinary peuvent contenir des caractères spéciaux qui posent problème
  let cleanUrl = src;
  
  // Enlever les paramètres d'URL qui peuvent causer des problèmes
  if (cleanUrl.includes('?')) {
    cleanUrl = cleanUrl.split('?')[0];
  }

  // Vérifier si l'URL est une URL de miniature vidéo
  const isVideoThumbnail = 
    cleanUrl.includes('/video/upload/') || 
    cleanUrl.includes('/video/');

  // S'assurer que les paramètres de transformation sont correctement formatés
  try {
    // Analyser l'URL pour extraire les parties importantes
    const parts = cleanUrl.split('/');
    console.log('CloudinaryImage - URL parts:', parts);
    
    if (parts.length < 7) {
      throw new Error('URL Cloudinary invalide - pas assez de segments');
    }
    
    const cloudName = parts[3];
    const resourceType = isVideoThumbnail ? 'video' : (parts[4] || 'image');
    const uploadType = parts[5] || 'upload';
    
    // Trouver l'ID public (dernier segment de l'URL)
    const publicId = parts.slice(6).join('/');
    console.log('CloudinaryImage - Extracted info:', { cloudName, resourceType, uploadType, publicId });
    
    // Si l'URL est vide ou mal formée, utiliser le placeholder
    if (!cloudName || !publicId) {
      return (
        <div style={{ width: `${width}px`, height: `${height}px` }} className={className}>
          <PlaceholderSvg />
        </div>
      );
    }
    
    // Construire une URL optimisée avec les transformations souhaitées
    let optimizedUrl;
    
    if (isVideoThumbnail) {
      // Pour les miniatures vidéo, utiliser des transformations spécifiques
      optimizedUrl = `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${publicId}`;
    } else {
      // Pour les images normales
      optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${publicId}`;
    }
    
    return (
      <Image
        src={optimizedUrl}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={() => setImageError(true)}
      />
    );
  } catch (error) {
    // Si l'analyse de l'URL échoue, afficher le placeholder
    console.warn('Error parsing Cloudinary URL:', error);
    return (
      <div style={{ width: `${width}px`, height: `${height}px` }} className={className}>
        <PlaceholderSvg />
      </div>
    );
  }
};
