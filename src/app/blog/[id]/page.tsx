'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import Button from '@/components/Button';

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

interface ArticleDetailPageProps {
    params: {
        id: string;
    };
}

export default function ArticleDetailPage({ params }: ArticleDetailPageProps) {
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await fetch(`/api/articles/${params.id}`);
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

        fetchArticle();
    }, [params.id]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}`;
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
        <main className="min-h-screen bg-[var(--secondary)] pt-4 sm:pt-6 pb-24">
            <div className="px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
                <div className="mb-4 sm:mb-6">
                    <Link href="/blog" className="text-[var(--foreground)] flex items-center gap-2 hover:text-[var(--main)] transition-colors">
                        <Icon name="arrowLeft" size={16} />
                        <span>Retour aux actualités</span>
                    </Link>
                </div>

                <article>
                    <header className="mb-4 sm:mb-6">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
                            {article.title}
                        </h1>
                        <div className="flex items-center gap-4 text-xs sm:text-sm text-[var(--foreground)] opacity-80">
                            <div className="flex items-center gap-1">
                                <span>{formatDate(article.createdAt)}</span>
                            </div>
                        </div>
                    </header>

                    {article.image && (
                        <div className="relative h-[200px] sm:h-[300px] mb-4 sm:mb-6 rounded-lg overflow-hidden shadow-lg">
                            <Image
                                src={article.image}
                                alt={`Image pour ${article.title}`}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}
                    <div className="prose prose-invert max-w-none text-[var(--foreground)] text-sm sm:text-base" style={{ whiteSpace: 'pre-wrap' }}>
                        {article.content}
                    </div>

                    <div className="mt-8 sm:mt-12 border-t border-[var(--foreground)]/20 pt-4 sm:pt-6">
                        <Link href="/blog" className="inline-block">
                            <Button variant="primary" size="sm" className="sm:hidden" icon="arrowLeft" iconPosition="left">
                                Retour
                            </Button>
                            <Button variant="primary" size="md" className="hidden sm:flex" icon="arrowLeft" iconPosition="left">
                                Voir d&apos;autres actualités
                            </Button>
                        </Link>
                    </div>
                </article>
            </div>
        </main>
    );
}
