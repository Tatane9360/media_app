import React from 'react';
import Image from 'next/image';
import PlaceholderSvg from './PlaceholderSvg';

interface CloudinaryVideoThumbnailProps {
  videoUrl: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * Composant spécifique pour afficher les miniatures de vidéos Cloudinary
 */
export const CloudinaryVideoThumbnail: React.FC<CloudinaryVideoThumbnailProps> = ({
  videoUrl,
  alt,
  width,
  height,
  className,
}) => {
  // Vérifier si l'URL est valide
  if (!videoUrl) {
    return (
      <div style={{ width, height }} className={className}>
        <PlaceholderSvg />
      </div>
    );
  }

  // Vérifier si c'est une URL Cloudinary
  const isCloudinaryUrl = videoUrl.includes('cloudinary.com');
  if (!isCloudinaryUrl) {
    return (
      <div style={{ width, height }} className={className}>
        <PlaceholderSvg />
      </div>
    );
  }

  try {
    // Exemple: https://res.cloudinary.com/demo/video/upload/dog.mp4
    const urlParts = videoUrl.split('/');
    const cloudName = urlParts[3];
    
    // Extraire l'ID public (la partie après upload/)
    let publicId;
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
      publicId = urlParts.slice(uploadIndex + 1).join('/');
    } else {
      // Si nous ne pouvons pas extraire l'ID correctement, utiliser une approche différente
      // Obtenir la dernière partie de l'URL (nom du fichier)
      const parts = videoUrl.split('/');
      publicId = parts[parts.length - 1];
      
      // Supprimer l'extension si présente
      if (publicId.includes('.')) {
        publicId = publicId.split('.')[0];
      }
    }
    
    // Construire l'URL de la miniature vidéo Cloudinary
    // Format: https://res.cloudinary.com/{cloud_name}/video/upload/c_fill,h_{height},w_{width}/{public_id}.jpg
    const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,h_${height},w_${width}/${publicId}.jpg`;
    
    return (
      <Image
        src={thumbnailUrl}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  } catch (error) {
    console.error('Erreur lors de la génération de la miniature vidéo:', error);
    return (
      <div style={{ width, height }} className={className}>
        <PlaceholderSvg />
      </div>
    );
  }
};
