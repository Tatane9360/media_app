'use client';

import React, { useState } from 'react';
import { AppLoader } from '@/components';
import { useAppLoader } from '@/hooks';

interface ClientLayoutProps {
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

const ClientLayout: React.FC<ClientLayoutProps> = ({ 
  children, 
  loaderConfig 
}) => {
  const [showContent, setShowContent] = useState(false);
  const { isLoading, completeLoading } = useAppLoader({
    minDuration: loaderConfig?.minDuration || 2000,
  });

  const handleLoadingComplete = () => {
    completeLoading();
    
    setTimeout(() => {
      setShowContent(true);
    }, 100);
  };

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
    <div className={`transition-opacity duration-500 ${showContent || !loaderConfig ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
};

export default ClientLayout;
