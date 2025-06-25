'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import Button from '@/components/Button';
import { useParams } from 'next/navigation';
import { Footer, Header } from '@/components';

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

// Supprimez l'interface et la dépendance aux props
export default function ArticleDetailPage() {
    // Utilisez useParams() à la place de props.params
    const params = useParams();
    const id = params.id as string;

    const [article, setArticle] = useState<Article | null>(null);
    const [recentArticles, setRecentArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                // Utilisez l'ID obtenu via useParams
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
                    // Filtrer l'article actuel s'il existe dans les résultats
                    const filteredArticles = data.articles.filter((a: Article) => a._id !== id);
                    // Prendre les 3 premiers articles
                    setRecentArticles(filteredArticles.slice(0, 3));
                }
            } catch (err) {
                console.error("Erreur lors du chargement des articles récents", err);
            }
        };

        fetchArticle();
        fetchRecentArticles();
    }, [id]); // Utilisez id comme dépendance au lieu de params.id

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}`;
    };

    // Fonction pour tronquer le titre s'il est trop long
    const truncateTitle = (title: string, maxLength: number = 25) => {
        return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
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

    return (
        <>
            <Header />
            <main className="min-h-screen bg-[var(--background)] flex flex-col items-center">
 
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

                            <Link
                                href="/blog"
                                className="bg-[var(--main)] rounded-full p-2 shadow-md flex items-center justify-center hover:bg-[#ff7c4a] transition"
                            >
                                <Icon name="arrowLeft" size={20} color="#fff" />
                            </Link>
                        </div>
                    </div>
                )}

          
                <div className="relative z-30 w-[100vw] mx-auto -mt-14 pb-8">
                    <article className="bg-[var(--background)] rounded-3xl shadow-lg px-6 py-8 text-[var(--foreground)]">
                        <header className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <h1 className="text-2xl font-bold uppercase tracking-wide">{article.title}</h1>
                            <span className="text-xs opacity-70 mt-1 sm:mt-0">{formatDate(article.createdAt)}</span>
                        </header>
                        <div
                            className="text-[var(--foreground)] text-base leading-relaxed opacity-90 mb-4"
                            style={{ whiteSpace: 'pre-line' }}
                        >
                            {article.content}
                        </div>
                    </article>
                </div>

         
                <section className="w-full max-w-md mx-auto px-6 mb-8">
                    <h2 className="text-[var(--foreground)] text-base font-semibold mb-3">DÉCOUVREZ AUSSI</h2>
                    <div className="flex gap-3">
                        {recentArticles.length > 0 ? (
                            recentArticles.map((recentArticle) => (
                                <Link href={`/blog/${recentArticle._id}`} key={recentArticle._id} className="flex-1 group">
                                    <div className="rounded-xl overflow-hidden shadow bg-[var(--navy)] transition group-hover:scale-105">
                                        <div className="w-full h-[80px] relative">
                                            <Image
                                                src={recentArticle.image || "/placeholder-image.jpg"}
                                                alt={recentArticle.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="p-2 text-xs text-[var(--foreground)]">
                                            {truncateTitle(recentArticle.title.toUpperCase())}
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
            <Footer />
        </>
    );
}