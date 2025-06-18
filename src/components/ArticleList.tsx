'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useArticleStore } from '@/store/articleStore';
import ArticleEditor from './ArticleEditor';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function ArticleList() {
  const { articles, loading, error, fetchArticles, deleteArticle } = useArticleStore();
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      await deleteArticle(id);
    }
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingArticle(null);
  };

  // Function to truncate markdown content
  const truncateMarkdown = (markdown: string, maxLength: number = 200) => {
    const plainText = markdown.replace(/[#*`_~\[\]()]/g, '').replace(/\n/g, ' ');
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
  };

  if (loading && articles.length === 0) {
    return <div className="text-center py-8">Loading articles...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Articles</h2>
        <button
          onClick={() => setShowEditor(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Article
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {articles.map((article) => (
          <div key={article._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>By: {article.author.email}</span>
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    article.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {article.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              {article.image && (
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-24 h-24 object-cover rounded-md ml-4"
                />
              )}
            </div>
            
            <div className="text-gray-700 mb-4">
              {truncateMarkdown(article.content)}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(article)}
                className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(article._id)}
                className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {articles.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No articles found. Create your first article!
        </div>
      )}

      {showEditor && (
        <ArticleEditor
          article={editingArticle}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
