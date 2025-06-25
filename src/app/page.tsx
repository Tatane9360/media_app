'use client'

import { 
  Header, 
  HeroSection, 
  ActualitesCarousel, 
  VideosSection, 
  Footer 
} from '@/components';

export default function Home() {
  return (
    <div className="min-h-screen bg-dark">
      <Header />
      <main>
        <HeroSection />
        <ActualitesCarousel />
        <VideosSection />
      </main>
      <Footer />
    </div>
  );
}
