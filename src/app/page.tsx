'use client'

import {
  HeroSection,
  ActualitesCarousel,
  VideosSection,
} from '@components';

export default function Home() {
  return (
    <main className="bg-white dark:bg-transparent">
      <HeroSection />
      <ActualitesCarousel />
      <VideosSection />
    </main>
  );
}
