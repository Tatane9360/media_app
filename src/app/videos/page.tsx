'use client'

import { useState, useEffect } from 'react';

import { BackButton, VideoCard } from '@components';

interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface VideosResponse {
  success: boolean;
  data: {
    videos: Video[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

// Skeleton pour VideoCard
function VideoCardSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-3">
      <div className="relative aspect-video rounded-4xl overflow-hidden bg-gray-800">
        <div className="w-full h-full bg-gray-700" />
      </div>
      <div className="h-6 w-2/3 bg-gray-700 rounded mt-2" />
    </div>
  );
}

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<VideosResponse['data']['pagination'] | null>(null);

  const fetchVideos = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/videos?page=${pageNum}&limit=12`);
      const data: VideosResponse = await response.json();
      
      if (data.success) {
        setVideos(data.data.videos);
        setPagination(data.data.pagination);
      } else {
        setError('Erreur lors du chargement des vidéos');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(page);
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-5 gap-8">
        <div className='flex flex-col gap-4 w-full max-w-2xl'>
          <div className="h-8 w-1/3 bg-gray-800 rounded mb-4 animate-pulse" />
        </div>
        <div className="flex flex-col gap-8 w-full max-w-2xl">
          {[...Array(6)].map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gap-3 flex flex-col px-4 py-5">

      {/* Header */}
      <div className='flex flex-col gap-4'>
        <BackButton variant='icon-only' />
        <h1 className="">VIDÉOS EXCLUSIVES</h1>
      </div>

      {/* Videos Grid */}
      <>
        {videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-xl mb-4">
              Aucune vidéo disponible pour le moment
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 space-x-4">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              Précédent
            </button>
            
            <div className="flex space-x-2">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    page === i + 1
                      ? 'bg-purple-600 '
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNext}
              className="px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              Suivant
            </button>
          </div>
        )}
      </>
    </div>
  );
}
