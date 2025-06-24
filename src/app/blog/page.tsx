
'use client';

import React, { useEffect, useMemo } from 'react';
import { useArticleStore } from '@/store/articleStore';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { Footer, Header } from '@/components';

export default function BlogPage() {
  const { articles: apiArticles, loading, fetchArticles, error } = useArticleStore();
  // Utilisons useMemo pour éviter des re-renders inutiles et effectuons un filtrage supplémentaire
  const articles = useMemo(() => {
    // Assurons-nous qu'on a bien un tableau et qu'il n'est pas vide
    console.log('Mémo des articles de l\'API:', apiArticles);

    // Vérification approfondie des articles
    if (Array.isArray(apiArticles)) {
      console.log('Nombre d\'articles trouvés dans l\'API:', apiArticles.length);

      // Filtrons pour ne garder que les articles publiés (au cas où l'API renvoie tout)
      const publishedArticles = apiArticles.filter(article => article && article.published === true);
      console.log('Nombre d\'articles publiés:', publishedArticles.length);

      // Si aucun article publié mais des articles existent, c'est probablement un problème de statut
      if (publishedArticles.length === 0 && apiArticles.length > 0) {
        console.warn('ATTENTION: Des articles existent mais aucun n\'est publié!');
        console.log('Articles non publiés:', apiArticles);
      }

      // Affichons les détails de chaque article publié pour déboguer
      publishedArticles.forEach((article, index) => {
        console.log(`Article publié ${index}:`, {
          id: article._id,
          title: article.title,
          published: article.published,
          createdAt: article.createdAt
        });
      });

      // Pour le débogage, si aucun article publié, montrons tous les articles
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
    fetchArticles(false); // false = mode public (seulement les articles publiés)
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
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex justify-center items-center">
        <div className="text-white text-xl">Chargement des actualités...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--background)] pt-6 pb-24">        {/* Bouton retour */}
        <div className="flex items-center px-4 mb-4">
          <Link href="/">
            <div className="w-10 h-10 rounded-full bg-[#ff7f32] flex items-center justify-center shadow-md mr-3 mx-5 cursor-pointer hover:bg-[#ff7f32]/90 transition-transform duration-300 hover:scale-105">
              <Icon name="arrowLeft" size={24} color="white" />
            </div>
          </Link>
        </div>
        <h1 className="text-white text-2xl mx-10 mt-0 mb-6 font-bold tracking-widest">ACTUALITÉS</h1>        <div className="px-4 max-w-lg mx-auto">
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
                    className="object-cover rounded-3xl"
                    priority
                  />
                  {/* Dégradé pour le texte */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#23233b] via-[#23233b]/70 to-transparent rounded-3xl"></div>
                  {/* Date */}
                  <div className="absolute top-21 left-3 bg-[#23233b]/70 px-2 py-1 rounded text-xs text-white font-semibold">
                    {formatDate(article.createdAt)}
                  </div>
                  {/* Contenu texte */}
                  <div className="absolute bottom-4 left-4 right-20">
                    <h2 className="text-white text-lg font-bold uppercase mb-1">{article.title}</h2>
                    <p className="text-white/80 text-sm line-clamp-2">{article.content.replace(/[#*`_~\[\]()]/g, '').substring(0, 80)}...</p>
                  </div>
                  {/* Bouton flèche */}
                  <Link
                    href={`/blog/${article._id}`}
                    className="absolute bottom-4 right-4 bg-[#ff7f32] w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-[#ff7f32]/90 transition-transform duration-300 hover:scale-110"
                  >
                    <Icon name="arrowRight" size={20} color="white" />
                  </Link>              </div>
              </article>
            )))}
        </div>
      </main>
      <Footer />
    </>
  );
}