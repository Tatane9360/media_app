'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { BackButton, Button } from '@components';

interface Article {
    _id: string;
    title: string;
    content: string;
    image?: string;
    published: boolean;
    author: {
        _id: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

export default function ArticleDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [article, setArticle] = useState<Article | null>(null);
    const [recentArticles, setRecentArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await fetch(`/api/articles/${id}`);
                const data = await response.json();

                if (response.ok) {
                    setArticle(data.article);
                } else {
                    setError(data.error || "Échec du chargement de l'article");
                }
            } catch {
                setError('Erreur réseau');
            } finally {
                setLoading(false);
            }
        };

        const fetchRecentArticles = async () => {
            try {
                const response = await fetch(`/api/articles?limit=4`);
                const data = await response.json();

                if (response.ok) {
                    const filteredArticles = data.articles.filter((a: Article) => a._id !== id);
                    setRecentArticles(filteredArticles.slice(0, 2));
                }
            } catch (err) {
                console.error("Erreur lors du chargement des articles récents", err);
            }
        };

        fetchArticle();
        fetchRecentArticles();
    }, [id]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}`;
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article?.title,
                    text: `Découvrez cet article : ${article?.title}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Erreur lors du partage:', error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Lien copié dans le presse-papiers !');
        }
    };

    const handleWatchVideo = () => {
        console.log('Voir la vidéo de l\'article:', article?.title);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--secondary)] p-6 flex justify-center items-center">
                <div className="text-[var(--foreground)] text-xl">Chargement de l&apos;article...</div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen bg-[var(--secondary)] p-6">
                <div className="max-w-2xl mx-auto bg-[var(--main)]/10 p-4 rounded-lg text-[var(--foreground)]">
                    <h1 className="text-xl font-bold mb-4">Erreur</h1>
                    <p>{error || "L'article n'a pas été trouvé"}</p>
                    <Link href="/blog" className="mt-4 inline-block">
                        <Button variant="primary" size="sm">
                            Retour aux actualités
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const parallaxOffset = Math.min(scrollY * 0.8, 150);

    return (
        <>
            <main className="min-h-screen bg-[var(--background)] flex flex-col">
                {article.image && (
                    <div className="w-full relative">
                        <div className="absolute top-0 left-0 w-full h-[220px] sm:h-[260px] bg-[var(--secondary)] rounded-b-[32px] z-10" />
                        <div className="relative w-full h-[220px] sm:h-[260px] rounded-b-[32px] overflow-hidden z-20">
                            <Image
                                src={article.image}
                                alt={`Image pour ${article.title}`}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/30" />
                        </div>

                        <div className="absolute top-6 left-6 z-30 flex items-center gap-4">
                            <BackButton variant="icon-only" />
                        </div>
                    </div>
                )}

                {!article.image && (
                    <div className="w-full pt-6 px-6">
                        <BackButton variant="icon-only" />
                    </div>
                )}

                <div 
                    className="relative z-30 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 pb-8"
                    style={{
                        transform: article.image ? `translateY(-${parallaxOffset}px)` : 'none',
                        transition: 'transform 0.1s ease-out'
                    }}
                >
                    <article className="bg-[var(--background)] rounded-3xl shadow-lg px-4 sm:px-6 py-6 sm:py-8 text-[var(--foreground)]">
                        <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide break-words">{article.title}</h1>
                            <span className="text-xs opacity-70 mt-2 sm:mt-0 flex-shrink-0">{formatDate(article.createdAt)}</span>
                        </header>
                        <div
                            className="text-[var(--foreground)] text-sm sm:text-base leading-relaxed opacity-90 mb-6 break-words overflow-wrap-anywhere"
                            style={{ whiteSpace: 'pre-line' }}
                        >
                            {article.content}
                        </div>
                        
                        <div className="flex justify-center gap-4 mb-6">
                            <Button 
                                variant="primary" 
                                size="md" 
                                icon="share" 
                                iconPosition="left"
                                onClick={handleShare}
                            >
                                PARTAGER
                            </Button>
                            <Button 
                                variant="secondary" 
                                size="md" 
                                icon="eye" 
                                iconPosition="left"
                                onClick={handleWatchVideo}
                            >
                                VOIR LA VIDÉO
                            </Button>
                        </div>
                    </article>
                </div>

                <section className="w-full px-4 sm:px-6 lg:px-8 mb-8">
                    <h2 className="text-[var(--foreground)] text-base font-semibold mb-6 px-2">DÉCOUVRE AUSSI</h2>
                    <div className="flex gap-4 px-2">
                        {recentArticles.length > 0 ? (
                            recentArticles.map((recentArticle) => (
                                <Link href={`/blog/${recentArticle._id}`} key={recentArticle._id} className="flex-1 group">
                                    <div className="relative rounded-xl overflow-hidden shadow-lg bg-[var(--navy)] transition group-hover:scale-105">
                                        <div className="w-full h-[180px] relative">
                                            <Image
                                                src={recentArticle.image || "/placeholder-image.jpg"}
                                                alt={recentArticle.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                            
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <h3 className="text-white text-sm font-bold uppercase leading-tight">
                                                    {recentArticle.title}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="w-full text-center text-[var(--foreground)] text-sm opacity-70">
                                Aucun autre article disponible pour le moment
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
}