'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useArticleStore } from '@store';
import { Icon, Modal } from '@components';

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
}

export default function ActualitePage() {
    const router = useRouter();
    const { articles, loading, error, fetchArticles, deleteArticle } = useArticleStore();
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, articleId: '', articleTitle: '' });

    useEffect(() => {
        fetchArticles(true);
    }, [fetchArticles]);

    const handleEditArticle = (article: Article) => {
        router.push(`/admin/actualite/edit?id=${article._id}`);
    };

    const handleCreateArticle = () => {
        router.push('/admin/actualite/edit');
    };

    const handleDeleteClick = (article: Article) => {
        setDeleteModal({
            isOpen: true,
            articleId: article._id!,
            articleTitle: article.title || 'Cet article'
        });
    };

    const handleDeleteConfirm = async () => {
        await deleteArticle(deleteModal.articleId);
        setDeleteModal({ isOpen: false, articleId: '', articleTitle: '' });
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, articleId: '', articleTitle: '' });
    };

    const handleShowDetail = (article: Article) => {
        router.push(`/blog/${article._id}`);
    };

    const truncateMarkdown = (markdown: string, maxLength = 100) => {
        if (!markdown) return '';
        const plainText = markdown.replace(/[#*`_~\[\]()]/g, '').replace(/\n/g, ' ');
        return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}`;
    };

    return (
        <div className="min-h-screen bg-[#1F1F2C]">
            <main className="px-4 lg:px-8 py-6 pb-24">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-white text-2xl lg:text-3xl font-bold">ACTUALITÉ</h1>
                    <button
                        onClick={handleCreateArticle}
                        className="bg-[#E94E1B] text-white w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center hover:bg-[#E94E1B]/90 transition-colors"
                        aria-label="Ajouter un article"
                    >
                        <Icon name="add" size={20} color="white" />
                    </button>
                </div>

                {/* Mobile Layout */}
                <div className="space-y-4 lg:hidden">
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
                                
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditArticle(article);
                                        }}
                                        className="bg-[#E94E1B] text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#E94E1B]/90 transition-colors"
                                        aria-label="Modifier l'article"
                                    >
                                        <Icon name="edit" size={14} color="white" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(article);
                                        }}
                                        className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                                        aria-label="Supprimer l'article"
                                    >
                                        <Icon name="trash" size={14} color="white" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:block">
                    {loading && articles.length === 0 ? (
                        <div className="text-center py-12 text-white text-xl">Chargement des articles...</div>
                    ) : (
                        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {articles.map((article) => (
                                <div
                                    key={article._id}
                                    className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                    onClick={() => handleShowDetail(article)}
                                >
                                    <div className="relative">
                                        <img
                                            src={article.image || 'https://via.placeholder.com/800x400'}
                                            alt={article.title}
                                            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                        
                                        {article.createdAt && (
                                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                                                <span className="text-white/90 text-sm font-medium">
                                                    {formatDate(article.createdAt)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditArticle(article);
                                                }}
                                                className="bg-[#E94E1B] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E94E1B]/90 transition-all duration-300 hover:scale-110 shadow-lg"
                                                aria-label="Modifier l'article"
                                            >
                                                <Icon name="edit" size={16} color="white" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(article);
                                                }}
                                                className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-700 transition-all duration-300 hover:scale-110 shadow-lg"
                                                aria-label="Supprimer l'article"
                                            >
                                                <Icon name="trash" size={16} color="white" />
                                            </button>
                                        </div>
                                        
                                        <div className="absolute bottom-0 left-0 right-0 p-6">
                                            <h2 className="text-white font-bold text-xl mb-2 group-hover:text-[#E94E1B] transition-colors duration-300">
                                                {article.title}
                                            </h2>
                                            <p className="text-white/80 line-clamp-3 text-sm leading-relaxed">
                                                {truncateMarkdown(article.content, 150)}
                                            </p>
                                            
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-white/60 text-xs">
                                                    {article.published ? 'Publié' : 'Brouillon'}
                                                </span>
                                                <div className="w-8 h-8 bg-[#E94E1B] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <Icon name="arrowRight" size={16} color="white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {articles.length === 0 && !loading && (
                    <div className="text-center py-12 text-white">
                        <div className="bg-[#E94E1B]/20 rounded-full p-8 mb-6 inline-block">
                            <Icon name="document" size={48} color="white" />
                        </div>
                        <h2 className="text-xl lg:text-2xl font-bold mb-3">Aucun article trouvé</h2>
                        <p className="text-white/70 mb-6 lg:text-lg">
                            Créez votre premier article pour commencer !
                        </p>
                        <button
                            onClick={handleCreateArticle}
                            className="bg-[#E94E1B] px-6 py-3 lg:px-8 lg:py-4 rounded-full text-white font-medium hover:bg-[#E94E1B]/90 transition-all inline-flex items-center gap-2"
                        >
                            <Icon name="add" size={20} color="white" />
                            Créer un article
                        </button>
                    </div>
                )}
            </main>

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Supprimer l'article"
                message={`Êtes-vous sûr de vouloir supprimer "${deleteModal.articleTitle}" ? Cette action est irréversible et supprimera également l'image associée.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="danger"
            />
        </div>
    );
}
