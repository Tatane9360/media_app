import { create } from 'zustand';

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

interface ArticleStore {
  articles: Article[];
  loading: boolean;
  error: string | null;
  fetchArticles: (isAdmin?: boolean) => Promise<void>;
  createArticle: (article: Omit<Article, '_id' | 'author' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateArticle: (id: string, article: Partial<Article>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
}

export const useArticleStore = create<ArticleStore>((set, get) => ({
  articles: [],
  loading: false,
  error: null, fetchArticles: async (isAdmin = false) => {
    set({ loading: true, error: null });
    try {

      const endpoint = isAdmin ? '/api/articles?admin=true' : '/api/articles';
      console.log(`Fetching articles from API... (admin mode: ${isAdmin})`);

      const response = await fetch(endpoint, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      const data = await response.json();

      if (response.ok) {

        if (data.articles && Array.isArray(data.articles)) {

          const validArticles = data.articles.filter((article: Article) =>
            article && typeof article === 'object' && article._id && article.title
          );

          set({ articles: validArticles, loading: false });
        } else {
          console.error('No articles array in API response');
          set({ articles: [], error: 'Invalid response format', loading: false });
        }
      } else {
        console.error('Error fetching articles:', data.error);
        set({ error: data.error || 'Failed to fetch articles', loading: false });
      }
    } catch (error) {
      set({ error: 'Network error', loading: false });
    }
  },
  createArticle: async (articleData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      const data = await response.json();

      if (response.ok) {
        set(state => ({
          articles: [data.article, ...state.articles],
          loading: false
        }));
        const isAdminContext = window.location.pathname.includes('/admin');
        setTimeout(() => {
          get().fetchArticles(isAdminContext);
        }, 500);
      } else {
        console.error('Error creating article:', data.error);
        set({ error: data.error || 'Failed to create article', loading: false });
      }
    } catch (error) {
      console.error('Network error during article creation:', error);
      set({ error: 'Network error', loading: false });
    }
  },

  updateArticle: async (id, articleData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      const data = await response.json(); if (response.ok) {
        set(state => ({
          articles: state.articles.map(article =>
            article._id === id ? data.article : article
          ),
          loading: false
        }));


        const isAdminContext = window.location.pathname.includes('/admin');
        setTimeout(() => {
          get().fetchArticles(isAdminContext);
        }, 500);
      } else {
        set({ error: data.error || 'Failed to update article', loading: false });
      }
    } catch (error) {
      set({ error: 'Network error', loading: false });
    }
  },

  deleteArticle: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      }); if (response.ok) {
        set(state => ({
          articles: state.articles.filter(article => article._id !== id),
          loading: false
        }));


        const isAdminContext = window.location.pathname.includes('/admin');
        setTimeout(() => {
          get().fetchArticles(isAdminContext);
        }, 500);
      } else {
        const data = await response.json();
        set({ error: data.error || 'Failed to delete article', loading: false });
      }
    } catch (error) {
      set({ error: 'Network error', loading: false });
    }
  },
}));
