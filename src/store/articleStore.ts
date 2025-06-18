import { create } from 'zustand';

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

interface ArticleStore {
  articles: Article[];
  loading: boolean;
  error: string | null;
  fetchArticles: () => Promise<void>;
  createArticle: (article: Omit<Article, '_id' | 'author' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateArticle: (id: string, article: Partial<Article>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
}

export const useArticleStore = create<ArticleStore>((set, get) => ({
  articles: [],
  loading: false,
  error: null,

  fetchArticles: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/articles');
      const data = await response.json();
      
      if (response.ok) {
        set({ articles: data.articles, loading: false });
      } else {
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
      } else {
        set({ error: data.error || 'Failed to create article', loading: false });
      }
    } catch (error) {
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
      
      const data = await response.json();
      
      if (response.ok) {
        set(state => ({
          articles: state.articles.map(article => 
            article._id === id ? data.article : article
          ),
          loading: false
        }));
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
      });
      
      if (response.ok) {
        set(state => ({
          articles: state.articles.filter(article => article._id !== id),
          loading: false
        }));
      } else {
        const data = await response.json();
        set({ error: data.error || 'Failed to delete article', loading: false });
      }
    } catch (error) {
      set({ error: 'Network error', loading: false });
    }
  },
}));
