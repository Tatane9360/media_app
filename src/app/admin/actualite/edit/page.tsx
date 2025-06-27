'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useArticleStore } from '@store';
import imageCompression from 'browser-image-compression';
import { Icon, Button } from '@components';

export default function EditArticlePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get('id');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [published, setPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [articleLoaded, setArticleLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { articles, createArticle, updateArticle, deleteArticle, loading, fetchArticles } = useArticleStore();

  // Charger l'article à éditer si un ID est fourni
  useEffect(() => {
    if (articleId && articles.length > 0) {
      const article = articles.find(a => a._id === articleId);
      if (article) {
        setTitle(article.title);
        setContent(article.content);
        setDescription(article.description || '');
        setImage(article.image || '');
        setPreviewImage(article.image || '');
        setPublished(article.published);
        setArticleLoaded(true);
      }
    } else if (!articleId) {
      setArticleLoaded(true);
    }
  }, [articleId, articles]);

  // Charger les articles si pas encore fait
  useEffect(() => {
    if (articles.length === 0) {
      fetchArticles(true);
    }
  }, [articles.length, fetchArticles]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Créer un aperçu local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.7,
      };

      const compressedFile = await imageCompression(file, options);
      const formData = new FormData();
      formData.append('file', compressedFile, 'image.webp');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImage(data.url);
      } else {
        alert(data.error || 'Upload failed');
        setPreviewImage(image);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
      setPreviewImage(image);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title?.trim() || !content?.trim() || !description?.trim()) {
      alert('Le titre, le contenu et la description sont requis');
      return;
    }

    const articleData = {
      title: (title || '').trim(),
      content: content || '',
      description: (description || '').trim(),
      image: (image || '').trim(),
      published,
    };

    try {
      if (articleId) {
        await updateArticle(articleId, articleData);
      } else {
        await createArticle(articleData);
      }
      router.push('/admin/actualite');
    } catch (error) {
      console.error('Error saving article:', error);
    }
  };

  const handleDelete = async () => {
    if (!articleId) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.')) {
      setDeleting(true);
      try {
        await deleteArticle(articleId);
        router.push('/admin/actualite');
      } catch (error) {
        console.error('Error deleting article:', error);
        alert('Erreur lors de la suppression de l\'article');
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleCancel = () => {
    router.push('/admin/actualite');
  };

  if (!articleLoaded) {
    return (
      <div className="min-h-screen bg-[#1F1F2C] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1F1F2C]">
      <main className="px-6 py-6 pb-20">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-2xl font-bold">
            {articleId ? 'MODIFICATION' : 'NOUVEL ARTICLE'}
          </h1>
          {articleId && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-white hover:text-red-400 p-2 transition-colors duration-200 hover:bg-red-500/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Supprimer l'article"
            >
              {deleting ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              ) : (
                <Icon name="trash" size={24} />
              )}
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Image upload */}
          <div>
            <div className="relative w-[72px] h-[52px] bg-white rounded-md flex items-center justify-center overflow-hidden cursor-pointer group">
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="Aperçu de l'image"
                  width={72}
                  height={52}
                  className="object-cover w-full h-full"
                />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                disabled={uploading}
              />
            </div>
          </div>

          {/* TITRE */}
          <div>
            <label htmlFor="title" className="block text-white font-medium mb-1">
              TITRE*
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'article"
              className="w-full h-12 px-4 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E94E1B]"
            />
          </div>

          {/* ARTICLE */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="content" className="text-white font-medium">
                ARTICLE*
              </label>
              <span className={`text-xs ${
                (content?.length || 0) > 1900 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {content?.length || 0}/2000
              </span>
            </div>
            <textarea
              id="content"
              required
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= 2000) {
                  setContent(e.target.value);
                }
              }}
              placeholder="Contenu de l'article"
              rows={8}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E94E1B] resize-none"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="description" className="text-white font-medium">
                DESCRIPTION*
              </label>
              <span className={`text-xs ${
                (description?.length || 0) > 450 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {description?.length || 0}/500
              </span>
            </div>
            <textarea
              id="description"
              required
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setDescription(e.target.value);
                }
              }}
              placeholder="Description courte de l'article"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E94E1B] resize-none"
            />
          </div>

          {/* STATUT DE PUBLICATION */}
          <div>
            <label htmlFor="status" className="block text-white font-medium mb-1">
              STATUT*
            </label>
            <div className="flex items-center space-x-4 h-12 px-4 rounded-lg bg-white">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="published"
                  checked={!published}
                  onChange={() => setPublished(false)}
                  className="mr-2 accent-[#E94E1B]"
                />
                <span className="text-gray-800">Brouillon</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="published"
                  checked={published}
                  onChange={() => setPublished(true)}
                  className="mr-2 accent-[#E94E1B]"
                />
                <span className="text-gray-800">Publié</span>
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 mt-4">
            <Button
              variant="primary"
              size="lg"
              disabled={loading || uploading}
              onClick={() => {
                const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                handleSubmit(fakeEvent);
              }}
              className="flex-1"
            >
              {loading ? 'Enregistrement...' : 'ENREGISTRER'}
            </Button>
            <Button
              variant="white"
              size="lg"
              disabled={loading}
              onClick={handleCancel}
              className="flex-1"
            >
              ANNULER
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
} 