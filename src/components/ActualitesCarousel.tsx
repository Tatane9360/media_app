import React from 'react';
import Image from 'next/image';
import Button from './Button';

interface ArticleCard {
  id: string;
  title: string;
  excerpt: string;
  image: string;
}

const ActualitesCarousel = () => {
  const articles: ArticleCard[] = [
    {
      id: '1',
      title: 'TÉLÉTRAVAIL QUAND T\'ES JEUNE ?',
      excerpt: 'Lorem ipsum dolor sit amet consectetur. Vitae quis faucibus auctor donec est viverra pulvinar.',
      image: '/uploads/1750424933217-image.webp'
    },
    {
      id: '2', 
      title: 'LES AFTERWORK',
      excerpt: 'Lorem ipsum dolor sit amet consectetur adipiscing elit quis faucibus id donec est.',
      image: '/uploads/1750424839633-image.webp'
    },
    {
      id: '3',
      title: 'TRAVAIL EN ÉQUIPE',
      excerpt: 'Lorem ipsum dolor sit amet consectetur. Vitae quis faucibus auctor donec est viverra pulvinar.',
      image: '/uploads/1750277389289-nike-3957127640.jpg'
    },
    {
      id: '4', 
      title: 'PAUSE DÉJEUNER',
      excerpt: 'Lorem ipsum dolor sit amet consectetur adipiscing elit quis faucibus id donec est.',
      image: '/uploads/1750285270890-coquilles-de-pates-italiennes-aux-champignons-courgettes-et-sauce-tomate.webp'
    }
  ];

  return (
    <section className="bg-dark py-8">
      {/* Header */}
      <div className="px-4 sm:px-6 flex justify-between items-center mb-6">
        <h2 className="text-light text-xl sm:text-2xl font-bold">ACTUALITÉS</h2>
        <Button variant="primary" size="sm">
          Consultez toutes les actus
        </Button>
      </div>
      
      {/* Carousel with scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 sm:px-6 pb-2">
          {articles.map((article) => (
            <div 
              key={article.id}
              className="flex-shrink-0 w-80 sm:w-96"
            >
              <div className="bg-navy rounded-lg overflow-hidden h-full">
                <div className="relative aspect-video">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-light font-bold text-sm sm:text-base mb-2 leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-light opacity-80 text-xs sm:text-sm leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActualitesCarousel; 