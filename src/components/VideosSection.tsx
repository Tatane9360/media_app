import React from 'react';
import Button from './Button';

const VideosSection = () => {
  return (
    <section className="bg-dark px-6 py-8">
      <h2 className="text-light text-2xl font-bold mb-6">
        VIDÉOS<br />
        EXCLUSIVES
      </h2>
      
      <div className="relative">
        {/* Player vidéo placeholder */}
        <div className="bg-gray-300 rounded-lg aspect-video flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[16px] border-l-gray-600 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"></div>
          </div>
        </div>
        
        <div className="text-center">
          <Button variant="primary" size="lg" className="font-bold">
            EXCLUSIVITÉ
          </Button>
        </div>
      </div>
    </section>
  );
};

export default VideosSection; 