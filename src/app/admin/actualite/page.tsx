'use client';
import React, { useState, useEffect } from 'react';
import { Header } from '@/components';
import ArticleEditor from '@/components/ArticleEditor';
import { useArticleStore } from '@/store/articleStore';
import ArticleDetail from '@/components/ArticleDetails';

interface Article {
    _id?: string;
    title?: string;
    content?: string;
    image?: string;
    author?: {
        email: string;
    };
    createdAt?: string;
    published?: boolean;
    // Add other article properties as needed
}

export default function ActualitePage() {
    const { articles, loading, error, fetchArticles, deleteArticle } = useArticleStore();
    const [showEditor, setShowEditor] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    useEffect(() => {
        fetchArticles(true);
    }, [fetchArticles]);

    // Fonction appelée quand on veut éditer un article
    const handleEditArticle = (article: Article) => {
        setEditingArticle(article);
        setShowEditor(true);
    };

    // Fonction appelée à la fermeture de l'éditeur
    const handleCloseEditor = () => {
        setShowEditor(false);
        setEditingArticle(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
            await deleteArticle(id);
        }
    };

    const handleShowDetail = (article: Article) => {
        setSelectedArticle(article);
    };

    const handleCloseDetail = () => {
        setSelectedArticle(null);
    };

    const truncateMarkdown = (markdown: string, maxLength = 100) => {
        if (!markdown) return '';
        const plainText = markdown.replace(/[#*`_~\[\]()]/g, '').replace(/\n/g, ' ');
        return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
    };

    // Format date pour afficher comme "12/04/23"
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}`;
    };

    return (
        <div className="min-h-screen bg-[#1F1F2C]">
            <Header />

            <main className="px-4 py-6 pb-24">
                {/* En-tête avec titre et bouton ajouter */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-white text-2xl font-bold">ACTUALITÉ</h1>
                    <button
                        onClick={() => setShowEditor(true)}
                        className="bg-[#E94E1B] text-white w-10 h-10 rounded-full flex items-center justify-center"
                        aria-label="Ajouter un article"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>

                {/* Liste des articles */}
                <div className="space-y-4">
                    {loading && articles.length === 0 ? (
                        <div className="text-center py-8 text-white">Chargement des articles...</div>
                    ) : (
                        articles.map((article) => (
                            <div
                                key={article._id}
                                className="relative rounded-lg overflow-hidden cursor-pointer"
                                onClick={() => handleShowDetail(article)}
                            >
                                <div className="relative">
                                    <img
                                        src={article.image || 'https://via.placeholder.com/800x400'}
                                        alt={article.title}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                                        {article.createdAt && (
                                            <span className="text-white/80 text-xs mb-1">
                                                {formatDate(article.createdAt)}
                                            </span>
                                        )}
                                        <h2 className="text-white font-bold text-xl">{article.title}</h2>
                                        <p className="text-white/80 line-clamp-2 text-sm">
                                            {truncateMarkdown(article.content)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditArticle(article);
                                    }}
                                    className="absolute top-4 right-4 bg-[#E94E1B] text-white w-8 h-8 rounded-full flex items-center justify-center"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}

                    {articles.length === 0 && !loading && (
                        <div className="text-center py-12 text-white">
                            Aucun article trouvé. Créez votre premier article !
                        </div>
                    )}
                </div>
            </main>

            {/* Éditeur d'article */}
            {showEditor && (
                <ArticleEditor
                    article={editingArticle}
                    onClose={handleCloseEditor}
                />
            )}

            {/* Détail d'article */}
            {selectedArticle && (
                <ArticleDetail
                    article={selectedArticle}
                    onClose={handleCloseDetail}
                />
            )}
        </div>
    );
}
