'use client';

import React, { useState, useEffect } from 'react';
import { AppLoader } from '@components';
import { useAppLoader } from '@hooks';

interface ClientLayoutProps {
  children: React.ReactNode;
  /** Configuration du loader */
  loaderConfig?: {
    videoSrc: string;
    fallbackVideoSrc?: string;
  };
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ 
  children, 
  loaderConfig 
}) => {
  const [showContent, setShowContent] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isLoading, completeLoading } = useAppLoader({
    forceShow: false
  });

  // Éviter les problèmes d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLoadingComplete = () => {
    completeLoading();
    
    setTimeout(() => {
      setShowContent(true);
    }, 100);
  };

  if (!isMounted) {
    return null;
  }

  if (isLoading && loaderConfig) {
    return (
      <AppLoader
        {...loaderConfig}
        onLoadingComplete={handleLoadingComplete}
      />
    );
  }

  if (isLoading && !loaderConfig) {
    handleLoadingComplete();
  }

  return (
    <div className={`transition-opacity duration-500 ${showContent || !loaderConfig ? 'opacity-100' : ''}`}>
      {children}
    </div>
  );
};

export default ClientLayout;
