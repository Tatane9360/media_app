import React from 'react';
import Button from './Button';

const HeroSection = () => {
  return (<section
    className="relative h-96 bg-cover bg-center bg-no-repeat bg-fixed"
    style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/images/home-image.webp')`
    }}
  >
    <div className="absolute inset-0 flex flex-col justify-end p-6 text-light">
      <h1 className="text-3xl font-bold mb-2">LES AFTERWORKS</h1>
      <p className="text-sm mb-6 opacity-90">PLAISIR OU OBLIGATION ?</p>

      <div className="flex gap-4">
        <Button
          variant="primary"
          size="md"
          icon="play"
          iconPosition="left"
        >
          JETTE UN OEIL
        </Button>
      </div>
    </div>
  </section>
  );
};

export default HeroSection; 