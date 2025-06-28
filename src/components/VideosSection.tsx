import React from 'react';
import Button from './Button';

const VideosSection = () => {
  return (
    <section className="bg-dark px-6 py-8">
      <h2 className="text-light text-2xl font-bold mb-6">
        DERNIÈRES VIDÉOS
      </h2>      <div className="relative max-w-4xl mx-auto">
        {/* Player vidéo intégré avec conteneur responsive */}
        <div className="relative rounded-lg overflow-hidden mb-4 pb-[56.25%] h-0">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Vidéo exclusive"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen>
          </iframe>
        </div>

        <div className="text-center">
          <Button variant="white" size="lg" className="font-bold">
            Voir sur Youtube
          </Button>
        </div>
      </div>
    </section>
  );
};

export default VideosSection; 