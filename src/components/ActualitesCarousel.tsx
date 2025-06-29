'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from './Button';
import { useArticleStore } from '../store/articleStore';

interface Article {
  _id: string;
  title: string;
  content: string;
  description?: string;
  image?: string;
  published: boolean;
  author: {
    _id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ActualitesCarousel = () => {
  const { articles, loading, error, fetchArticles } = useArticleStore();

  useEffect(() => {
    fetchArticles(false);
  }, [fetchArticles]);

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const extractTextFromHTML = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  if (loading) {
    return (
      <section className="bg-white dark:bg-[var(--background)] py-8 text-foreground dark:text-light">
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <h2 className="text-foreground dark:text-light text-xl sm:text-2xl font-bold">ACTUALITÉS</h2>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="text-light">Chargement des actualités...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white dark:bg-[var(--background)] py-8 text-foreground dark:text-light">
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <h2 className="text-foreground dark:text-light text-xl sm:text-2xl font-bold">ACTUALITÉS</h2>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="text-red-400">Erreur lors du chargement des actualités</div>
        </div>
      </section>
    );
  }

  const displayedArticles = articles.slice(0, 3);

  return (
    <section className="bg-white dark:bg-[var(--background)] py-8 min-h-screen pt-6 pb-24 text-foreground dark:text-light">
      <div className="px-4 sm:px-6 lg:px-8 mb-6">
        <h2 className="text-foreground dark:text-light text-xl sm:text-2xl font-bold">ACTUALITÉS</h2>
      </div>

      {displayedArticles.length > 0 ? (
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Mobile: Scroll horizontal */}
          <div className="overflow-x-auto scrollbar-hide mb-8 lg:hidden">
            <div className="flex gap-4 pb-2">
              {displayedArticles.map((article: Article) => (
                <Link
                  href={`/blog/${article._id}`}
                  key={article._id}
                  className="flex-shrink-0 w-80 sm:w-96"
                >
                  <div className="bg-navy rounded-lg overflow-hidden h-full hover:bg-navy/90 transition-colors cursor-pointer">
                    <div className="relative aspect-video">
                      {article.image ? (
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          sizes="(max-width: 768px) 320px, 384px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-400">Pas d&apos;image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-light font-bold text-sm sm:text-base mb-2 leading-tight">
                        {article.title}
                      </h3>
                      <p className="text-light opacity-80 text-xs sm:text-sm leading-relaxed">
                        {article.description || truncateContent(extractTextFromHTML(article.content))}
                      </p>
                      <div className="mt-2 text-xs text-foreground dark:text-light opacity-60">
                        {new Date(article.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop: Grille responsive */}
          <div className="hidden lg:block mb-8">
            <div className="grid lg:grid-cols-3 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {displayedArticles.map((article: Article) => (
                <Link
                  href={`/blog/${article._id}`}
                  key={article._id}
                  className="group"
                >
                  <div className="bg-navy rounded-lg overflow-hidden h-full hover:bg-navy/90 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                    <div className="relative aspect-video">
                      {article.image ? (
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          sizes="(min-width: 1280px) 400px, (min-width: 1024px) 350px, 300px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-400">Pas d&apos;image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-light font-bold text-lg mb-3 leading-tight group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-light opacity-80 text-sm leading-relaxed mb-4">
                        {article.description || truncateContent(extractTextFromHTML(article.content), 120)}
                      </p>
                      <div className="text-xs text-foreground dark:text-light opacity-60">
                        {new Date(article.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <Link href="/blog">
              <Button variant="primary" size="md">
                VOIR LA LISTE
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center py-12">
          <div className="text-light opacity-80">Aucune actualité disponible pour le moment</div>
        </div>
      )}
    </section>
  );
};

export default ActualitesCarousel;