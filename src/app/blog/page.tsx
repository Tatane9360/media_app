'use client';

import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useArticleStore } from '@store';
import { Icon, BackButton } from '@components';

function ArticleCardSkeleton({ desktop = false }: { desktop?: boolean }) {
  return (
    <div className={desktop ? "rounded-3xl overflow-hidden shadow-xl bg-transparent animate-pulse h-[280px]" : "mb-8 rounded-3xl overflow-hidden shadow-lg bg-transparent animate-pulse h-[200px]"}>
      <div className={desktop ? "relative h-full w-full bg-gray-800" : "relative h-full w-full bg-gray-800"}>
        <div className="absolute inset-0 bg-gray-700 rounded-3xl" />
        <div className={desktop ? "absolute top-4 left-4 h-6 w-24 bg-gray-600 rounded-lg" : "absolute top-3 left-3 h-5 w-16 bg-gray-600 rounded"} />
        <div className={desktop ? "absolute top-4 right-4 h-6 w-20 bg-gray-600 rounded-full" : "absolute top-3 right-3 h-5 w-12 bg-gray-600 rounded-full"} />
        <div className={desktop ? "absolute bottom-6 left-6 right-20" : "absolute bottom-4 left-4 right-20"}>
          <div className={desktop ? "h-6 w-2/3 bg-gray-600 rounded mb-2" : "h-5 w-1/2 bg-gray-600 rounded mb-1"} />
          <div className={desktop ? "h-4 w-1/2 bg-gray-700 rounded" : "h-3 w-1/3 bg-gray-700 rounded"} />
        </div>
        <div className={desktop ? "absolute bottom-6 right-6 h-12 w-12 bg-gray-700 rounded-full" : "absolute bottom-4 right-4 h-10 w-10 bg-gray-700 rounded-full"} />
      </div>
    </div>
  );
}

export default function BlogPage() {
  const { articles: apiArticles, loading, fetchArticles, error } = useArticleStore();
  const articles = useMemo(() => {
    console.log('Mémo des articles de l\'API:', apiArticles);

    if (Array.isArray(apiArticles)) {
      console.log('Nombre d\'articles trouvés dans l\'API:', apiArticles.length);

      const publishedArticles = apiArticles.filter(article => article && article.published === true);
      console.log('Nombre d\'articles publiés:', publishedArticles.length);

      if (publishedArticles.length === 0 && apiArticles.length > 0) {
        console.warn('ATTENTION: Des articles existent mais aucun n\'est publié!');
        console.log('Articles non publiés:', apiArticles);
      }

      publishedArticles.forEach((article, index) => {
        console.log(`Article publié ${index}:`, {
          id: article._id,
          title: article.title,
          published: article.published,
          createdAt: article.createdAt
        });
      });

      if (publishedArticles.length === 0 && apiArticles.length > 0) {
        console.log('Débogage: affichage de tous les articles pour test');
        return apiArticles;
      }

      return publishedArticles;
    }

    console.log('Aucun article trouvé ou format invalide');
    return [];
  }, [apiArticles]);
  
  useEffect(() => {
    console.log('BlogPage: Calling fetchArticles (public mode)');
    fetchArticles(false);
  }, [fetchArticles]);

  useEffect(() => {
    console.log('BlogPage: Articles actuels:', articles);
    console.log('BlogPage: État de loading:', loading);
    console.log('BlogPage: Erreur éventuelle:', error);
  }, [articles, loading, error]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}`;
  };

  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / wordsPerMinute);
    return readingTime;
  };
  
  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)] pt-6 pb-24">
        <div className="flex items-center px-4 lg:px-8 mb-4">
          <BackButton variant="icon-only" />
        </div>
        <h1 className="text-white text-2xl mx-4 lg:mx-8 mt-0 mb-6 lg:mb-8 font-bold tracking-widest lg:text-3xl">ACTUALITÉS</h1>
        {/* Mobile Skeletons */}
        <div className="px-4 max-w-lg mx-auto lg:hidden flex flex-col">
          {[...Array(3)].map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
        {/* Desktop Skeletons */}
        <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-8 px-8 max-w-7xl mx-auto">
          {[...Array(6)].map((_, i) => (
            <ArticleCardSkeleton key={i} desktop />
          ))}
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[var(--background)] pt-6 pb-24">
        <div className="flex items-center px-4 lg:px-8 mb-4">
          <BackButton variant="icon-only" />
        </div>
        <h1 className="text-white text-2xl mx-4 lg:mx-8 mt-0 mb-6 lg:mb-8 font-bold tracking-widest lg:text-3xl">ACTUALITÉS</h1>

        {/* Mobile Layout */}
        <div className="px-4 max-w-lg mx-auto lg:hidden">
          {articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white">
              <div className="bg-[#ff7f32]/20 rounded-full p-6 mb-4">
                <Icon name="document" size={48} color="white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Aucun article disponible</h2>
              <p className="text-center text-white/70 mb-6">
                Les articles publiés apparaîtront ici automatiquement.
              </p>
              <Link href="/">
                <div className="bg-[#ff7f32] px-6 py-3 rounded-full text-white font-medium hover:bg-[#ff7f32]/90 transition-all">
                  Retour à l&apos;accueil
                </div>
              </Link>
            </div>
          ) : (
            articles.map((article) => (
              <article
                key={article._id}
                className="relative mb-8 rounded-3xl overflow-hidden shadow-lg bg-transparent transition-transform duration-300 hover:scale-105"
              >
                <div className="relative h-[200px] w-full">
                  <Image
                    src={article.image || '/placeholder-image.jpg'}
                    alt={article.title || 'Article image'}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover rounded-3xl"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#23233b] via-[#23233b]/70 to-transparent rounded-3xl"></div>
                  
                  <div className="absolute top-3 right-3 bg-[#23233b]/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-semibold flex items-center gap-1">
                    <Icon name="clock" size={12} color="white" />
                    <span>{calculateReadingTime(article.content)} Min</span>
                  </div>
                  
                  <div className="absolute top-3 left-3 bg-[#23233b]/70 px-2 py-1 rounded text-xs text-white font-semibold">
                    {formatDate(article.createdAt)}
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-20">
                    <h2 className="text-white text-lg font-bold uppercase mb-1">{article.title}</h2>
                    <p className="text-white/80 text-sm line-clamp-2">
                      {article.description ? truncateDescription(article.description) : 'Aucune description disponible'}
                    </p>
                  </div>
                  <Link
                    href={`/blog/${article._id}`}
                    className="absolute bottom-4 right-4 bg-[#ff7f32] w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-[#ff7f32]/90 transition-transform duration-300 hover:scale-110"
                  >
                    <Icon name="arrowRight" size={20} color="white" />
                  </Link>
                </div>
              </article>
            )))}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block px-8 max-w-7xl mx-auto">
          {articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white">
              <div className="bg-[#ff7f32]/20 rounded-full p-8 mb-6">
                <Icon name="document" size={64} color="white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Aucun article disponible</h2>
              <p className="text-center text-white/70 mb-8 text-lg">
                Les articles publiés apparaîtront ici automatiquement.
              </p>
              <Link href="/">
                <div className="bg-[#ff7f32] px-8 py-4 rounded-full text-white font-medium hover:bg-[#ff7f32]/90 transition-all text-lg">
                  Retour à l&apos;accueil
                </div>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {articles.map((article) => (
                <article
                  key={article._id}
                  className="group relative rounded-3xl overflow-hidden shadow-xl bg-transparent transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <div className="relative h-[280px] w-full">
                    <Image
                      src={article.image || '/placeholder-image.jpg'}
                      alt={article.title || 'Article image'}
                      fill
                      sizes="(min-width: 1280px) 400px, (min-width: 1024px) 350px, 300px"
                      className="object-cover rounded-3xl transition-transform duration-300 group-hover:scale-110"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#23233b] via-[#23233b]/70 to-transparent rounded-3xl"></div>
                    
                    <div className="absolute top-4 right-4 bg-[#23233b]/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white font-semibold flex items-center gap-2">
                      <Icon name="clock" size={14} color="white" />
                      <span>{calculateReadingTime(article.content)} Min</span>
                    </div>
                    
                    <div className="absolute top-4 left-4 bg-[#23233b]/70 px-3 py-2 rounded-lg text-sm text-white font-semibold">
                      {formatDate(article.createdAt)}
                    </div>
                    
                    <div className="absolute bottom-6 left-6 right-20">
                      <h2 className="text-white text-xl font-bold uppercase mb-2 group-hover:text-[#ff7f32] transition-colors">{article.title}</h2>
                      <p className="text-white/80 text-base line-clamp-3 leading-relaxed">
                        {article.description ? truncateDescription(article.description, 150) : 'Aucune description disponible'}
                      </p>
                    </div>
                    <Link
                      href={`/blog/${article._id}`}
                      className="absolute bottom-6 right-6 bg-[#ff7f32] w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-[#ff7f32]/90 transition-all duration-300 hover:scale-110 group-hover:shadow-xl"
                    >
                      <Icon name="arrowRight" size={24} color="white" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}